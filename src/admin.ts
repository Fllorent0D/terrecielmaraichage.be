import './admin.css'
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import {
  getDatabase,
  ref as dbRef,
  get,
  set,
  onValue
} from 'firebase/database'
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'
import { firebaseConfig, FIREBASE_ENABLED } from './firebase-config'

interface MarketConfig {
  enabled: boolean
  name: string
  day: string
  pattern: string
  hours: string
  location: string
  weeks?: number[]
  week?: number
  months?: number[]
  closedDates: string[]
}

interface MarketSectionConfig {
  title: string
  description: string
}

interface Config {
  marketSection?: MarketSectionConfig
  markets: Record<string, MarketConfig>
  lastUpdated: string
}

interface GalleryImage {
  src: string
  caption: string
  visible: boolean
  isFirebaseStorage?: boolean
}

interface GalleryConfig {
  images: GalleryImage[]
  lastUpdated: string
}

interface HeroSliderImage {
  src: string
  visible: boolean
}

interface AboutFeature {
  icon: string
  title: string
  visible: boolean
}

interface ContentConfig {
  // Navigation
  navigation?: {
    logoImage: string
    orderUrl: string
    orderButtonText: string
  }

  // Hero Slider
  heroSlider?: {
    images: HeroSliderImage[]
  }

  // About Section
  aboutSection?: {
    mainHeading: string
    subtitle: string
    paragraphs: string[]
    features: AboutFeature[]
  }

  // Parallax Section
  parallax?: {
    backgroundImage: string
    heading: string
    subheading: string
  }

  // Growing Activity Section
  growingActivity?: {
    heading: string
    subtitle: string
    paragraphs: string[]
    ctaText: string
    ctaUrl: string
    sideImage: string
  }

  // Founder Section
  founder?: {
    image: string
    heading: string
    subHeading: string
    paragraphs: string[]
    signatureName: string
  }

  // Gallery Section (title only - images managed separately)
  gallerySection?: {
    title: string
    description: string
  }

  // Orders Section
  orders?: {
    title: string
    introText: string
    pickupHeading: string
    pickupHours: string
    pickupLocation: string
    pickupNote: string
    buttonText: string
    buttonUrl: string
  }

  // Footer/Contact Section
  footer?: {
    logoImage: string
    copyrightYear: string
    businessName: string
    ownerName: string
    tagline: string
    address: string
    email: string
    phone: string
    facebookUrl: string
    iban: string
    vat: string
    footerQuote: string
  }

  // Legacy fields for backward compatibility
  hero?: {
    title: string
    subtitle: string
  }
  about?: {
    title: string
    description: string
  }
  contact?: {
    phone: string
    email: string
    address: string
  }

  lastUpdated: string
}

class AdminPanel {
  private config: Config | null = null
  private gallery: GalleryConfig | null = null
  private content: ContentConfig | null = null
  private draggedItem: HTMLElement | null = null
  private auth: ReturnType<typeof getAuth> | null = null
  private db: ReturnType<typeof getDatabase> | null = null
  private storage: ReturnType<typeof getStorage> | null = null
  private saveTimeout: number | null = null

  constructor() {
    if (FIREBASE_ENABLED) {
      const app = initializeApp(firebaseConfig)
      this.auth = getAuth(app)
      this.db = getDatabase(app)
      this.storage = getStorage(app)
      this.setupAuthListener()
    } else {
      this.showFirebaseSetupMessage()
    }
    this.bindEvents()
  }

  private showFirebaseSetupMessage(): void {
    const loginBox = document.querySelector('.login-box')
    if (loginBox) {
      loginBox.innerHTML = `
        <img src="./img/logo.png" alt="Terre & Ciel Maraichage" class="login-logo" />
        <h1>Configuration requise</h1>
        <div class="setup-message">
          <p>Firebase n'est pas encore configure.</p>
          <p>Veuillez suivre ces etapes:</p>
          <ol>
            <li>Creez un projet sur <a href="https://console.firebase.google.com" target="_blank">Firebase Console</a></li>
            <li>Activez Authentication (Email/Password)</li>
            <li>Activez Realtime Database</li>
            <li>Activez Storage</li>
            <li>Copiez la configuration dans <code>src/firebase-config.ts</code></li>
            <li>Mettez <code>FIREBASE_ENABLED = true</code></li>
            <li>Reconstruisez le projet</li>
          </ol>
        </div>
      `
    }
  }

  private setupAuthListener(): void {
    if (!this.auth) return

    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.showAdminPanel()
      } else {
        this.showLoginScreen()
      }
    })
  }

  private showLoginScreen(): void {
    document.getElementById('login-screen')?.classList.remove('hidden')
    document.getElementById('admin-panel')?.classList.add('hidden')
  }

  private bindEvents(): void {
    // Login form
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault()
      await this.handleLogin()
    })

    // Logout button
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      this.handleLogout()
    })

    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement
        this.switchTab(target.dataset.tab || '')
      })
    })

    // Image upload
    document.getElementById('image-upload')?.addEventListener('change', (e) => {
      this.handleImageUpload(e)
    })
  }

  private async handleLogin(): Promise<void> {
    if (!this.auth) return

    const emailInput = document.getElementById('email') as HTMLInputElement
    const passwordInput = document.getElementById('password') as HTMLInputElement
    const errorElement = document.getElementById('login-error')

    const email = emailInput?.value || ''
    const password = passwordInput?.value || ''

    try {
      await signInWithEmailAndPassword(this.auth, email, password)
      if (errorElement) errorElement.textContent = ''
    } catch (error: unknown) {
      const firebaseError = error as { code?: string }
      let message = 'Erreur de connexion'
      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
        message = 'Email ou mot de passe incorrect'
      } else if (firebaseError.code === 'auth/invalid-email') {
        message = 'Email invalide'
      } else if (firebaseError.code === 'auth/too-many-requests') {
        message = 'Trop de tentatives, reessayez plus tard'
      }
      if (errorElement) errorElement.textContent = message
    }
  }

  private async handleLogout(): Promise<void> {
    if (!this.auth) return
    await signOut(this.auth)
  }

  private async showAdminPanel(): Promise<void> {
    document.getElementById('login-screen')?.classList.add('hidden')
    document.getElementById('admin-panel')?.classList.remove('hidden')

    await this.loadConfigs()
    this.setupRealtimeListeners()
    this.renderMarkets()
    this.renderGallery()
    this.renderContent()
  }

  private switchTab(tabId: string): void {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId)
    })

    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabId}-tab`)
      content.classList.toggle('hidden', content.id !== `${tabId}-tab`)
    })
  }

  private async loadConfigs(): Promise<void> {
    if (!this.db) return

    try {
      const configSnapshot = await get(dbRef(this.db, 'config'))
      const gallerySnapshot = await get(dbRef(this.db, 'gallery'))
      const contentSnapshot = await get(dbRef(this.db, 'content'))

      if (configSnapshot.exists()) {
        this.config = configSnapshot.val()
      } else {
        const configResponse = await fetch('/data/config.json')
        this.config = await configResponse.json()
        await this.saveConfigToFirebase()
      }

      if (gallerySnapshot.exists()) {
        this.gallery = gallerySnapshot.val()
      } else {
        const galleryResponse = await fetch('/data/gallery.json')
        this.gallery = await galleryResponse.json()
        await this.saveGalleryToFirebase()
      }

      if (contentSnapshot.exists()) {
        this.content = contentSnapshot.val()
      } else {
        // Load default content from content.json
        try {
          const contentResponse = await fetch('/data/content.json')
          this.content = await contentResponse.json()
        } catch {
          // Fallback to minimal default content config
          this.content = {
            hero: {
              title: 'Terre & Ciel Maraichage',
              subtitle: 'Legumes et fruits bio cultives avec passion a Antheit'
            },
            about: {
              title: 'A propos',
              description: 'Nous sommes une exploitation maraichere biologique situee a Antheit.'
            },
            contact: {
              phone: '+32 477 21 77 27',
              email: 'armand@terrecielmaraichage.be',
              address: '4520 Antheit'
            },
            lastUpdated: new Date().toISOString().split('T')[0]
          }
        }
        await this.saveContentToFirebase()
      }

      this.updateLastUpdated()
    } catch (error) {
      console.error('Failed to load configs:', error)
      try {
        const configResponse = await fetch('/data/config.json')
        this.config = await configResponse.json()
        const galleryResponse = await fetch('/data/gallery.json')
        this.gallery = await galleryResponse.json()
      } catch (fallbackError) {
        console.error('Failed to load fallback configs:', fallbackError)
      }
    }
  }

  private setupRealtimeListeners(): void {
    if (!this.db) return

    onValue(dbRef(this.db, 'config'), (snapshot) => {
      if (snapshot.exists()) {
        this.config = snapshot.val()
        this.renderMarkets()
        this.updateLastUpdated()
      }
    })

    onValue(dbRef(this.db, 'gallery'), (snapshot) => {
      if (snapshot.exists()) {
        this.gallery = snapshot.val()
        this.renderGallery()
        this.updateLastUpdated()
      }
    })

    onValue(dbRef(this.db, 'content'), (snapshot) => {
      if (snapshot.exists()) {
        this.content = snapshot.val()
        this.renderContent()
        this.updateLastUpdated()
      }
    })
  }

  private async saveConfigToFirebase(): Promise<void> {
    if (!this.db || !this.config) return

    this.config.lastUpdated = new Date().toISOString().split('T')[0]

    try {
      await set(dbRef(this.db, 'config'), this.config)
      this.showSaveStatus('Configuration sauvegardee')
    } catch (error) {
      console.error('Failed to save config:', error)
      this.showSaveStatus('Erreur de sauvegarde', true)
    }
  }

  private async saveGalleryToFirebase(): Promise<void> {
    if (!this.db || !this.gallery) return

    this.gallery.lastUpdated = new Date().toISOString().split('T')[0]

    try {
      await set(dbRef(this.db, 'gallery'), this.gallery)
      this.showSaveStatus('Galerie sauvegardee')
    } catch (error) {
      console.error('Failed to save gallery:', error)
      this.showSaveStatus('Erreur de sauvegarde', true)
    }
  }

  private async saveContentToFirebase(): Promise<void> {
    if (!this.db || !this.content) return

    this.content.lastUpdated = new Date().toISOString().split('T')[0]

    try {
      await set(dbRef(this.db, 'content'), this.content)
      this.showSaveStatus('Contenu sauvegarde')
    } catch (error) {
      console.error('Failed to save content:', error)
      this.showSaveStatus('Erreur de sauvegarde', true)
    }
  }

  private debouncedSaveContent(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    this.saveTimeout = window.setTimeout(() => {
      this.saveContentToFirebase()
    }, 500)
  }

  private async handleImageUpload(e: Event): Promise<void> {
    if (!this.storage || !this.gallery) return

    const input = e.target as HTMLInputElement
    const files = input.files

    if (!files || files.length === 0) return

    const uploadProgress = document.getElementById('upload-progress')
    if (uploadProgress) {
      uploadProgress.style.display = 'block'
      uploadProgress.textContent = 'Upload en cours...'
    }

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file type
        if (!file.type.startsWith('image/')) {
          this.showSaveStatus(`${file.name} n'est pas une image`, true)
          continue
        }

        // Create unique filename
        const timestamp = Date.now()
        const filename = `gallery/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`

        // Upload to Firebase Storage
        const fileRef = storageRef(this.storage, filename)
        await uploadBytes(fileRef, file)

        // Get download URL
        const downloadURL = await getDownloadURL(fileRef)

        // Add to gallery
        this.gallery.images.push({
          src: downloadURL,
          caption: '',
          visible: true,
          isFirebaseStorage: true
        })

        if (uploadProgress) {
          uploadProgress.textContent = `Upload ${i + 1}/${files.length}...`
        }
      }

      // Save gallery config
      await this.saveGalleryToFirebase()
      this.renderGallery()

      if (uploadProgress) {
        uploadProgress.style.display = 'none'
      }

      // Clear input
      input.value = ''

      this.showSaveStatus(`${files.length} image(s) uploadee(s)`)
    } catch (error) {
      console.error('Upload failed:', error)
      this.showSaveStatus('Erreur lors de l\'upload', true)
      if (uploadProgress) {
        uploadProgress.style.display = 'none'
      }
    }
  }

  private async deleteImage(index: number): Promise<void> {
    if (!this.gallery || !this.storage) return

    const image = this.gallery.images[index]

    // If it's a Firebase Storage image, delete from storage
    if (image.isFirebaseStorage && image.src.includes('firebasestorage.googleapis.com')) {
      try {
        const fileRef = storageRef(this.storage, image.src)
        await deleteObject(fileRef)
      } catch (error) {
        console.error('Failed to delete from storage:', error)
        // Continue anyway to remove from gallery
      }
    }

    // Remove from gallery array
    this.gallery.images.splice(index, 1)
    await this.saveGalleryToFirebase()
    this.renderGallery()
    this.showSaveStatus('Image supprimee')
  }

  private debouncedSaveConfig(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    this.saveTimeout = window.setTimeout(() => {
      this.saveConfigToFirebase()
    }, 500)
  }

  private debouncedSaveGallery(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    this.saveTimeout = window.setTimeout(() => {
      this.saveGalleryToFirebase()
    }, 500)
  }

  private showSaveStatus(message: string, isError = false): void {
    const statusElement = document.getElementById('save-status')
    if (statusElement) {
      statusElement.textContent = message
      statusElement.className = `save-status ${isError ? 'error' : 'success'}`
      setTimeout(() => {
        statusElement.textContent = ''
        statusElement.className = 'save-status'
      }, 3000)
    }
  }

  private updateLastUpdated(): void {
    const element = document.getElementById('last-updated')
    if (element && this.config) {
      element.textContent = `Derniere modification: ${this.config.lastUpdated}`
    }
  }

  private generateMarketKey(name: string): string {
    const baseKey = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    if (!this.config || !this.config.markets[baseKey]) {
      return baseKey
    }

    let counter = 2
    while (this.config.markets[`${baseKey}-${counter}`]) {
      counter++
    }
    return `${baseKey}-${counter}`
  }

  private addMarket(): void {
    if (!this.config) return

    const newKey = this.generateMarketKey('nouveau-marche')
    this.config.markets[newKey] = {
      enabled: false,
      name: 'Nouveau marché',
      day: 'friday',
      pattern: 'weekly',
      hours: '14:00-18:00',
      location: 'Lieu à définir',
      closedDates: []
    }

    this.saveConfigToFirebase()
    this.renderMarkets()
    this.showSaveStatus('Marché ajouté')
  }

  private deleteMarket(marketKey: string): void {
    if (!this.config) return

    if (confirm(`Supprimer le marché "${this.config.markets[marketKey].name}" ?`)) {
      delete this.config.markets[marketKey]
      this.saveConfigToFirebase()
      this.renderMarkets()
      this.showSaveStatus('Marché supprimé')
    }
  }

  private renderMarkets(): void {
    if (!this.config) return

    const container = document.getElementById('markets-list')
    if (!container) return

    // Initialize marketSection if not present
    if (!this.config.marketSection) {
      this.config.marketSection = {
        title: 'Point de vente',
        description: 'Venez nous retrouver pour découvrir nos légumes biologiques et fruits de saison.'
      }
    }

    const dayOptions = [
      { value: 'monday', label: 'Lundi' },
      { value: 'tuesday', label: 'Mardi' },
      { value: 'wednesday', label: 'Mercredi' },
      { value: 'thursday', label: 'Jeudi' },
      { value: 'friday', label: 'Vendredi' },
      { value: 'saturday', label: 'Samedi' },
      { value: 'sunday', label: 'Dimanche' }
    ]

    const patternOptions = [
      { value: 'weekly', label: 'Chaque semaine' },
      { value: 'biweekly', label: 'Certaines semaines du mois' },
      { value: 'monthly', label: 'Mensuel (certains mois)' }
    ]

    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                       'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

    // Section text editing
    const sectionHtml = `
      <div class="market-section-config">
        <h3>Textes de la section</h3>
        <div class="form-group">
          <label>Titre de la section</label>
          <input type="text" value="${this.config.marketSection.title}" data-action="update-section-title" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea rows="3" data-action="update-section-description">${this.config.marketSection.description}</textarea>
        </div>
      </div>
    `

    // Add market button
    const addButtonHtml = `
      <div class="add-market-section">
        <button class="btn-primary" data-action="add-market">+ Ajouter un marché</button>
      </div>
    `

    // Market cards
    const marketsHtml = Object.entries(this.config.markets).map(([key, market]) => {
      const weeks = Array.isArray(market.weeks) ? market.weeks : (market.weeks ? Object.values(market.weeks) : [])
      const months = Array.isArray(market.months) ? market.months : (market.months ? Object.values(market.months) : [])

      return `
      <div class="market-card" data-market="${key}">
        <div class="market-header">
          <div class="market-title-row">
            <input type="text" class="market-name-input" value="${market.name}" data-action="update-name" data-market="${key}" />
            <label class="toggle">
              <input type="checkbox" ${market.enabled ? 'checked' : ''} data-action="toggle-market" data-market="${key}" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <button class="btn-delete-market" data-action="delete-market" data-market="${key}" title="Supprimer ce marché">&times;</button>
        </div>

        <div class="market-edit-form">
          <div class="form-row">
            <div class="form-group">
              <label>Jour</label>
              <select data-action="update-day" data-market="${key}">
                ${dayOptions.map(opt => `<option value="${opt.value}" ${market.day === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Fréquence</label>
              <select data-action="update-pattern" data-market="${key}">
                ${patternOptions.map(opt => `<option value="${opt.value}" ${market.pattern === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="form-group weeks-selector ${market.pattern === 'biweekly' ? '' : 'hidden'}" data-market="${key}">
            <label>Semaines du mois</label>
            <div class="checkbox-group">
              ${[1, 2, 3, 4].map(w => `
                <label class="checkbox-label">
                  <input type="checkbox" data-action="update-weeks" data-market="${key}" data-week="${w}" ${weeks.includes(w) ? 'checked' : ''} />
                  <span>${w}${w === 1 ? 'ère' : 'ème'} semaine</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="form-group monthly-selector ${market.pattern === 'monthly' ? '' : 'hidden'}" data-market="${key}">
            <div class="form-row">
              <div class="form-group">
                <label>Semaine du mois</label>
                <select data-action="update-week" data-market="${key}">
                  ${[1, 2, 3, 4].map(w => `<option value="${w}" ${market.week === w ? 'selected' : ''}>${w}${w === 1 ? 'er' : 'ème'}</option>`).join('')}
                </select>
              </div>
            </div>
            <label>Mois actifs</label>
            <div class="checkbox-group months-grid">
              ${monthNames.map((name, i) => `
                <label class="checkbox-label">
                  <input type="checkbox" data-action="update-months" data-market="${key}" data-month="${i + 1}" ${months.includes(i + 1) ? 'checked' : ''} />
                  <span>${name.substring(0, 3)}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Horaires</label>
              <input type="text" value="${market.hours}" data-action="update-hours" data-market="${key}" placeholder="14:00-18:00" />
            </div>
            <div class="form-group">
              <label>Lieu</label>
              <input type="text" value="${market.location}" data-action="update-location" data-market="${key}" />
            </div>
          </div>

          <div class="market-closed-dates">
            <label>Dates de fermeture exceptionnelle</label>
            <div class="closed-dates-list" data-market="${key}">
              ${(market.closedDates || []).map(date => `
                <span class="closed-date">
                  ${date}
                  <button data-action="remove-date" data-market="${key}" data-date="${date}">&times;</button>
                </span>
              `).join('')}
            </div>
            <div class="add-date-form">
              <input type="date" data-market="${key}" class="date-input" />
              <button data-action="add-date" data-market="${key}" class="btn-small">Ajouter</button>
            </div>
          </div>
        </div>
      </div>
    `}).join('')

    container.innerHTML = sectionHtml + addButtonHtml + marketsHtml

    // Bind all events
    this.bindMarketEvents(container)
  }

  private bindMarketEvents(container: HTMLElement): void {
    // Section title
    container.querySelector('[data-action="update-section-title"]')?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement
      if (this.config && this.config.marketSection) {
        this.config.marketSection.title = target.value
        this.debouncedSaveConfig()
      }
    })

    // Section description
    container.querySelector('[data-action="update-section-description"]')?.addEventListener('input', (e) => {
      const target = e.target as HTMLTextAreaElement
      if (this.config && this.config.marketSection) {
        this.config.marketSection.description = target.value
        this.debouncedSaveConfig()
      }
    })

    // Add market button
    container.querySelector('[data-action="add-market"]')?.addEventListener('click', () => {
      this.addMarket()
    })

    // Delete market buttons
    container.querySelectorAll('[data-action="delete-market"]').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement
        const marketKey = target.dataset.market
        if (marketKey) {
          this.deleteMarket(marketKey)
        }
      })
    })

    // Toggle market enabled
    container.querySelectorAll('[data-action="toggle-market"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement
        const marketKey = target.dataset.market
        if (marketKey && this.config) {
          this.config.markets[marketKey].enabled = target.checked
          this.debouncedSaveConfig()
        }
      })
    })

    // Update market name
    container.querySelectorAll('[data-action="update-name"]').forEach(input => {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement
        const marketKey = target.dataset.market
        if (marketKey && this.config) {
          this.config.markets[marketKey].name = target.value
          this.debouncedSaveConfig()
        }
      })
    })

    // Update day
    container.querySelectorAll('[data-action="update-day"]').forEach(select => {
      select.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement
        const marketKey = target.dataset.market
        if (marketKey && this.config) {
          this.config.markets[marketKey].day = target.value
          this.debouncedSaveConfig()
        }
      })
    })

    // Update pattern
    container.querySelectorAll('[data-action="update-pattern"]').forEach(select => {
      select.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement
        const marketKey = target.dataset.market
        if (marketKey && this.config) {
          this.config.markets[marketKey].pattern = target.value

          // Show/hide relevant selectors
          const weeksSelector = container.querySelector(`.weeks-selector[data-market="${marketKey}"]`)
          const monthlySelector = container.querySelector(`.monthly-selector[data-market="${marketKey}"]`)

          if (weeksSelector) {
            weeksSelector.classList.toggle('hidden', target.value !== 'biweekly')
          }
          if (monthlySelector) {
            monthlySelector.classList.toggle('hidden', target.value !== 'monthly')
          }

          // Initialize default values if needed
          if (target.value === 'biweekly' && !this.config.markets[marketKey].weeks) {
            this.config.markets[marketKey].weeks = [1, 3]
          }
          if (target.value === 'monthly') {
            if (!this.config.markets[marketKey].week) {
              this.config.markets[marketKey].week = 1
            }
            if (!this.config.markets[marketKey].months) {
              this.config.markets[marketKey].months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            }
          }

          this.debouncedSaveConfig()
        }
      })
    })

    // Update weeks (biweekly)
    container.querySelectorAll('[data-action="update-weeks"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement
        const marketKey = target.dataset.market
        const week = parseInt(target.dataset.week || '0', 10)
        if (marketKey && this.config) {
          if (!this.config.markets[marketKey].weeks) {
            this.config.markets[marketKey].weeks = []
          }
          const weeks = this.config.markets[marketKey].weeks!
          if (target.checked && !weeks.includes(week)) {
            weeks.push(week)
            weeks.sort((a, b) => a - b)
          } else if (!target.checked) {
            this.config.markets[marketKey].weeks = weeks.filter(w => w !== week)
          }
          this.debouncedSaveConfig()
        }
      })
    })

    // Update week (monthly)
    container.querySelectorAll('[data-action="update-week"]').forEach(select => {
      select.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement
        const marketKey = target.dataset.market
        if (marketKey && this.config) {
          this.config.markets[marketKey].week = parseInt(target.value, 10)
          this.debouncedSaveConfig()
        }
      })
    })

    // Update months (monthly)
    container.querySelectorAll('[data-action="update-months"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement
        const marketKey = target.dataset.market
        const month = parseInt(target.dataset.month || '0', 10)
        if (marketKey && this.config) {
          if (!this.config.markets[marketKey].months) {
            this.config.markets[marketKey].months = []
          }
          const months = this.config.markets[marketKey].months!
          if (target.checked && !months.includes(month)) {
            months.push(month)
            months.sort((a, b) => a - b)
          } else if (!target.checked) {
            this.config.markets[marketKey].months = months.filter(m => m !== month)
          }
          this.debouncedSaveConfig()
        }
      })
    })

    // Update hours
    container.querySelectorAll('[data-action="update-hours"]').forEach(input => {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement
        const marketKey = target.dataset.market
        if (marketKey && this.config) {
          this.config.markets[marketKey].hours = target.value
          this.debouncedSaveConfig()
        }
      })
    })

    // Update location
    container.querySelectorAll('[data-action="update-location"]').forEach(input => {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement
        const marketKey = target.dataset.market
        if (marketKey && this.config) {
          this.config.markets[marketKey].location = target.value
          this.debouncedSaveConfig()
        }
      })
    })

    // Add closed date
    container.querySelectorAll('[data-action="add-date"]').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement
        const marketKey = target.dataset.market
        if (!marketKey || !this.config) return

        const dateInput = container.querySelector(`.date-input[data-market="${marketKey}"]`) as HTMLInputElement
        if (dateInput && dateInput.value) {
          if (!this.config.markets[marketKey].closedDates) {
            this.config.markets[marketKey].closedDates = []
          }
          if (!this.config.markets[marketKey].closedDates.includes(dateInput.value)) {
            this.config.markets[marketKey].closedDates.push(dateInput.value)
            this.config.markets[marketKey].closedDates.sort()
            this.saveConfigToFirebase()
            this.renderMarkets()
          }
          dateInput.value = ''
        }
      })
    })

    // Remove closed date
    container.querySelectorAll('[data-action="remove-date"]').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement
        const marketKey = target.dataset.market
        const date = target.dataset.date
        if (marketKey && date && this.config) {
          this.config.markets[marketKey].closedDates = this.config.markets[marketKey].closedDates.filter(d => d !== date)
          this.saveConfigToFirebase()
          this.renderMarkets()
        }
      })
    })
  }

  private renderGallery(): void {
    if (!this.gallery) return

    const container = document.getElementById('gallery-list')
    if (!container) return

    container.innerHTML = this.gallery.images.map((image, index) => `
      <div class="gallery-item-admin${image.visible ? '' : ' hidden-image'}" data-index="${index}" draggable="true">
        <div class="gallery-drag-handle">&#9776;</div>
        <img src="${image.src}" alt="${image.caption || 'Image'}" class="gallery-thumbnail" />
        <div class="gallery-item-controls">
          <div class="gallery-item-row">
            <label class="visibility-label">
              <span>${image.visible ? 'Visible' : 'Masque'}</span>
              <label class="toggle">
                <input type="checkbox" ${image.visible ? 'checked' : ''} data-action="toggle-image" data-index="${index}" />
                <span class="toggle-slider"></span>
              </label>
            </label>
            <button class="btn-delete" data-action="delete-image" data-index="${index}" title="Supprimer">&times;</button>
          </div>
          <input type="text" value="${image.caption}" placeholder="Legende (optionnel)" data-action="update-caption" data-index="${index}" />
        </div>
      </div>
    `).join('')

    // Bind gallery events
    container.querySelectorAll('[data-action="toggle-image"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement
        const index = parseInt(target.dataset.index || '0', 10)
        if (this.gallery) {
          this.gallery.images[index].visible = target.checked
          // Update visual state
          const card = target.closest('.gallery-item-admin')
          const label = card?.querySelector('.visibility-label span')
          if (card) {
            card.classList.toggle('hidden-image', !target.checked)
          }
          if (label) {
            label.textContent = target.checked ? 'Visible' : 'Masque'
          }
          this.debouncedSaveGallery()
        }
      })
    })

    container.querySelectorAll('[data-action="update-caption"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement
        const index = parseInt(target.dataset.index || '0', 10)
        if (this.gallery) {
          this.gallery.images[index].caption = target.value
          this.debouncedSaveGallery()
        }
      })
    })

    container.querySelectorAll('[data-action="delete-image"]').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement
        const index = parseInt(target.dataset.index || '0', 10)
        if (confirm('Supprimer cette image ?')) {
          this.deleteImage(index)
        }
      })
    })

    this.setupDragAndDrop(container)
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  private renderContent(): void {
    if (!this.content) return

    const container = document.getElementById('content-editor')
    if (!container) return

    const iconOptions = ['leaf', 'apple', 'heart-handshake', 'area-chart', 'users', 'map-pin', 'clock', 'sun', 'sprout', 'carrot']

    container.innerHTML = `
      <!-- Navigation Section -->
      <div class="content-section collapsible">
        <div class="section-header-collapsible" data-section="navigation">
          <h3>Navigation</h3>
          <span class="collapse-icon">-</span>
        </div>
        <div class="section-content" data-section-content="navigation">
          <div class="form-group">
            <label>URL du bouton Commander</label>
            <input type="url" value="${this.escapeHtml(this.content.navigation?.orderUrl || '')}" data-path="navigation.orderUrl" />
          </div>
          <div class="form-group">
            <label>Texte du bouton Commander</label>
            <input type="text" value="${this.escapeHtml(this.content.navigation?.orderButtonText || 'Commander')}" data-path="navigation.orderButtonText" />
          </div>
        </div>
      </div>

      <!-- About Section -->
      <div class="content-section collapsible">
        <div class="section-header-collapsible" data-section="aboutSection">
          <h3>Section A propos</h3>
          <span class="collapse-icon">-</span>
        </div>
        <div class="section-content" data-section-content="aboutSection">
          <div class="form-group">
            <label>Titre principal</label>
            <input type="text" value="${this.escapeHtml(this.content.aboutSection?.mainHeading || '')}" data-path="aboutSection.mainHeading" />
          </div>
          <div class="form-group">
            <label>Sous-titre</label>
            <input type="text" value="${this.escapeHtml(this.content.aboutSection?.subtitle || '')}" data-path="aboutSection.subtitle" />
          </div>
          <div class="form-group">
            <label>Paragraphe 1</label>
            <textarea rows="3" data-path="aboutSection.paragraphs.0">${this.escapeHtml(this.content.aboutSection?.paragraphs?.[0] || '')}</textarea>
          </div>
          <div class="form-group">
            <label>Paragraphe 2</label>
            <textarea rows="3" data-path="aboutSection.paragraphs.1">${this.escapeHtml(this.content.aboutSection?.paragraphs?.[1] || '')}</textarea>
          </div>
          <div class="form-group">
            <label>Paragraphe 3</label>
            <textarea rows="3" data-path="aboutSection.paragraphs.2">${this.escapeHtml(this.content.aboutSection?.paragraphs?.[2] || '')}</textarea>
          </div>
          <div class="features-editor">
            <label>Caracteristiques (5 icones)</label>
            ${(this.content.aboutSection?.features || []).map((feature, index) => `
              <div class="feature-item">
                <div class="form-row">
                  <div class="form-group">
                    <label>Icone</label>
                    <select data-path="aboutSection.features.${index}.icon">
                      ${iconOptions.map(icon => `<option value="${icon}" ${feature.icon === icon ? 'selected' : ''}>${icon}</option>`).join('')}
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Titre (HTML autorise)</label>
                    <input type="text" value="${this.escapeHtml(feature.title || '')}" data-path="aboutSection.features.${index}.title" />
                  </div>
                  <div class="form-group">
                    <label>Visible</label>
                    <label class="toggle">
                      <input type="checkbox" ${feature.visible ? 'checked' : ''} data-path="aboutSection.features.${index}.visible" data-type="boolean" />
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Parallax Section -->
      <div class="content-section collapsible">
        <div class="section-header-collapsible" data-section="parallax">
          <h3>Section Parallax</h3>
          <span class="collapse-icon">-</span>
        </div>
        <div class="section-content" data-section-content="parallax">
          <div class="form-group">
            <label>Image de fond</label>
            <div class="image-input-group">
              <input type="text" value="${this.escapeHtml(this.content.parallax?.backgroundImage || '')}" data-path="parallax.backgroundImage" />
              <label class="upload-btn-small">
                <span>Uploader</span>
                <input type="file" accept="image/*" data-upload-target="parallax.backgroundImage" hidden />
              </label>
            </div>
            ${this.content.parallax?.backgroundImage ? `<img src="${this.content.parallax.backgroundImage}" class="image-preview" alt="Preview" />` : ''}
          </div>
          <div class="form-group">
            <label>Titre</label>
            <input type="text" value="${this.escapeHtml(this.content.parallax?.heading || '')}" data-path="parallax.heading" />
          </div>
          <div class="form-group">
            <label>Sous-titre</label>
            <input type="text" value="${this.escapeHtml(this.content.parallax?.subheading || '')}" data-path="parallax.subheading" />
          </div>
        </div>
      </div>

      <!-- Growing Activity Section -->
      <div class="content-section collapsible">
        <div class="section-header-collapsible" data-section="growingActivity">
          <h3>Section Activite maraichere</h3>
          <span class="collapse-icon">-</span>
        </div>
        <div class="section-content" data-section-content="growingActivity">
          <div class="form-group">
            <label>Titre</label>
            <input type="text" value="${this.escapeHtml(this.content.growingActivity?.heading || '')}" data-path="growingActivity.heading" />
          </div>
          <div class="form-group">
            <label>Sous-titre</label>
            <input type="text" value="${this.escapeHtml(this.content.growingActivity?.subtitle || '')}" data-path="growingActivity.subtitle" />
          </div>
          <div class="form-group">
            <label>Paragraphe 1</label>
            <textarea rows="3" data-path="growingActivity.paragraphs.0">${this.escapeHtml(this.content.growingActivity?.paragraphs?.[0] || '')}</textarea>
          </div>
          <div class="form-group">
            <label>Paragraphe 2</label>
            <textarea rows="3" data-path="growingActivity.paragraphs.1">${this.escapeHtml(this.content.growingActivity?.paragraphs?.[1] || '')}</textarea>
          </div>
          <div class="form-group">
            <label>Texte du bouton</label>
            <input type="text" value="${this.escapeHtml(this.content.growingActivity?.ctaText || '')}" data-path="growingActivity.ctaText" />
          </div>
          <div class="form-group">
            <label>URL du bouton</label>
            <input type="text" value="${this.escapeHtml(this.content.growingActivity?.ctaUrl || '')}" data-path="growingActivity.ctaUrl" />
          </div>
          <div class="form-group">
            <label>Image laterale</label>
            <div class="image-input-group">
              <input type="text" value="${this.escapeHtml(this.content.growingActivity?.sideImage || '')}" data-path="growingActivity.sideImage" />
              <label class="upload-btn-small">
                <span>Uploader</span>
                <input type="file" accept="image/*" data-upload-target="growingActivity.sideImage" hidden />
              </label>
            </div>
            ${this.content.growingActivity?.sideImage ? `<img src="${this.content.growingActivity.sideImage}" class="image-preview" alt="Preview" />` : ''}
          </div>
        </div>
      </div>

      <!-- Founder Section -->
      <div class="content-section collapsible">
        <div class="section-header-collapsible" data-section="founder">
          <h3>Section Fondateur</h3>
          <span class="collapse-icon">-</span>
        </div>
        <div class="section-content" data-section-content="founder">
          <div class="form-group">
            <label>Photo</label>
            <div class="image-input-group">
              <input type="text" value="${this.escapeHtml(this.content.founder?.image || '')}" data-path="founder.image" />
              <label class="upload-btn-small">
                <span>Uploader</span>
                <input type="file" accept="image/*" data-upload-target="founder.image" hidden />
              </label>
            </div>
            ${this.content.founder?.image ? `<img src="${this.content.founder.image}" class="image-preview" alt="Preview" />` : ''}
          </div>
          <div class="form-group">
            <label>Titre</label>
            <input type="text" value="${this.escapeHtml(this.content.founder?.heading || '')}" data-path="founder.heading" />
          </div>
          <div class="form-group">
            <label>Sous-titre</label>
            <input type="text" value="${this.escapeHtml(this.content.founder?.subHeading || '')}" data-path="founder.subHeading" />
          </div>
          <div class="form-group">
            <label>Paragraphe 1</label>
            <textarea rows="3" data-path="founder.paragraphs.0">${this.escapeHtml(this.content.founder?.paragraphs?.[0] || '')}</textarea>
          </div>
          <div class="form-group">
            <label>Paragraphe 2</label>
            <textarea rows="3" data-path="founder.paragraphs.1">${this.escapeHtml(this.content.founder?.paragraphs?.[1] || '')}</textarea>
          </div>
          <div class="form-group">
            <label>Nom de signature</label>
            <input type="text" value="${this.escapeHtml(this.content.founder?.signatureName || '')}" data-path="founder.signatureName" />
          </div>
        </div>
      </div>

      <!-- Gallery Section -->
      <div class="content-section collapsible">
        <div class="section-header-collapsible" data-section="gallerySection">
          <h3>Section Galerie (titres)</h3>
          <span class="collapse-icon">-</span>
        </div>
        <div class="section-content" data-section-content="gallerySection">
          <div class="form-group">
            <label>Titre</label>
            <input type="text" value="${this.escapeHtml(this.content.gallerySection?.title || '')}" data-path="gallerySection.title" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea rows="2" data-path="gallerySection.description">${this.escapeHtml(this.content.gallerySection?.description || '')}</textarea>
          </div>
        </div>
      </div>

      <!-- Orders Section -->
      <div class="content-section collapsible">
        <div class="section-header-collapsible" data-section="orders">
          <h3>Section Commandes</h3>
          <span class="collapse-icon">-</span>
        </div>
        <div class="section-content" data-section-content="orders">
          <div class="form-group">
            <label>Titre</label>
            <input type="text" value="${this.escapeHtml(this.content.orders?.title || '')}" data-path="orders.title" />
          </div>
          <div class="form-group">
            <label>Texte d'introduction (HTML autorise)</label>
            <textarea rows="2" data-path="orders.introText">${this.escapeHtml(this.content.orders?.introText || '')}</textarea>
          </div>
          <div class="form-group">
            <label>Titre retrait</label>
            <input type="text" value="${this.escapeHtml(this.content.orders?.pickupHeading || '')}" data-path="orders.pickupHeading" />
          </div>
          <div class="form-group">
            <label>Horaires de retrait</label>
            <input type="text" value="${this.escapeHtml(this.content.orders?.pickupHours || '')}" data-path="orders.pickupHours" />
          </div>
          <div class="form-group">
            <label>Lieu de retrait</label>
            <input type="text" value="${this.escapeHtml(this.content.orders?.pickupLocation || '')}" data-path="orders.pickupLocation" />
          </div>
          <div class="form-group">
            <label>Note de retrait</label>
            <textarea rows="2" data-path="orders.pickupNote">${this.escapeHtml(this.content.orders?.pickupNote || '')}</textarea>
          </div>
          <div class="form-group">
            <label>Texte du bouton</label>
            <input type="text" value="${this.escapeHtml(this.content.orders?.buttonText || '')}" data-path="orders.buttonText" />
          </div>
          <div class="form-group">
            <label>URL du bouton</label>
            <input type="url" value="${this.escapeHtml(this.content.orders?.buttonUrl || '')}" data-path="orders.buttonUrl" />
          </div>
        </div>
      </div>

      <!-- Footer Section -->
      <div class="content-section collapsible">
        <div class="section-header-collapsible" data-section="footer">
          <h3>Section Contact / Footer</h3>
          <span class="collapse-icon">-</span>
        </div>
        <div class="section-content" data-section-content="footer">
          <div class="form-row">
            <div class="form-group">
              <label>Annee copyright</label>
              <input type="text" value="${this.escapeHtml(this.content.footer?.copyrightYear || '')}" data-path="footer.copyrightYear" />
            </div>
            <div class="form-group">
              <label>Nom de l'entreprise</label>
              <input type="text" value="${this.escapeHtml(this.content.footer?.businessName || '')}" data-path="footer.businessName" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Nom du proprietaire</label>
              <input type="text" value="${this.escapeHtml(this.content.footer?.ownerName || '')}" data-path="footer.ownerName" />
            </div>
            <div class="form-group">
              <label>Tagline</label>
              <input type="text" value="${this.escapeHtml(this.content.footer?.tagline || '')}" data-path="footer.tagline" />
            </div>
          </div>
          <div class="form-group">
            <label>Adresse</label>
            <input type="text" value="${this.escapeHtml(this.content.footer?.address || '')}" data-path="footer.address" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Email</label>
              <input type="email" value="${this.escapeHtml(this.content.footer?.email || '')}" data-path="footer.email" />
            </div>
            <div class="form-group">
              <label>Telephone</label>
              <input type="text" value="${this.escapeHtml(this.content.footer?.phone || '')}" data-path="footer.phone" />
            </div>
          </div>
          <div class="form-group">
            <label>URL Facebook</label>
            <input type="url" value="${this.escapeHtml(this.content.footer?.facebookUrl || '')}" data-path="footer.facebookUrl" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>IBAN</label>
              <input type="text" value="${this.escapeHtml(this.content.footer?.iban || '')}" data-path="footer.iban" />
            </div>
            <div class="form-group">
              <label>TVA</label>
              <input type="text" value="${this.escapeHtml(this.content.footer?.vat || '')}" data-path="footer.vat" />
            </div>
          </div>
          <div class="form-group">
            <label>Citation du footer</label>
            <textarea rows="2" data-path="footer.footerQuote">${this.escapeHtml(this.content.footer?.footerQuote || '')}</textarea>
          </div>
        </div>
      </div>
    `

    this.bindContentEvents(container)
  }

  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.')
    let current = obj as Record<string, unknown>

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      const nextPart = parts[i + 1]

      // Check if next part is a number (array index)
      if (!isNaN(parseInt(nextPart, 10))) {
        if (!current[part] || !Array.isArray(current[part])) {
          current[part] = []
        }
      } else {
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {}
        }
      }
      current = current[part] as Record<string, unknown>
    }

    const lastPart = parts[parts.length - 1]
    current[lastPart] = value
  }

  private bindContentEvents(container: HTMLElement): void {
    // Collapsible sections
    container.querySelectorAll('.section-header-collapsible').forEach(header => {
      header.addEventListener('click', () => {
        const sectionName = header.getAttribute('data-section')
        const content = container.querySelector(`[data-section-content="${sectionName}"]`)
        const icon = header.querySelector('.collapse-icon')

        if (content && icon) {
          content.classList.toggle('collapsed')
          icon.textContent = content.classList.contains('collapsed') ? '+' : '-'
        }
      })
    })

    // Text inputs and textareas
    container.querySelectorAll('input[data-path], textarea[data-path], select[data-path]').forEach(input => {
      const eventType = input.tagName === 'SELECT' ? 'change' : 'input'
      input.addEventListener(eventType, (e) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        const path = target.dataset.path
        const dataType = target.dataset.type

        if (path && this.content) {
          let value: unknown = target.value

          // Handle checkbox for boolean values
          if (target.type === 'checkbox') {
            value = (target as HTMLInputElement).checked
          } else if (dataType === 'boolean') {
            value = (target as HTMLInputElement).checked
          }

          this.setNestedValue(this.content as unknown as Record<string, unknown>, path, value)
          this.debouncedSaveContent()
        }
      })
    })

    // Checkbox inputs for boolean values
    container.querySelectorAll('input[type="checkbox"][data-path]').forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement
        const path = target.dataset.path

        if (path && this.content) {
          this.setNestedValue(this.content as unknown as Record<string, unknown>, path, target.checked)
          this.debouncedSaveContent()
        }
      })
    })

    // Image uploads
    container.querySelectorAll('input[data-upload-target]').forEach(input => {
      input.addEventListener('change', async (e) => {
        const target = e.target as HTMLInputElement
        const uploadPath = target.dataset.uploadTarget
        const file = target.files?.[0]

        if (file && uploadPath && this.storage && this.content) {
          try {
            const timestamp = Date.now()
            const filename = `section-images/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
            const fileRef = storageRef(this.storage, filename)

            await uploadBytes(fileRef, file)
            const downloadURL = await getDownloadURL(fileRef)

            this.setNestedValue(this.content as unknown as Record<string, unknown>, uploadPath, downloadURL)
            await this.saveContentToFirebase()
            this.renderContent()
            this.showSaveStatus('Image uploadee')
          } catch (error) {
            console.error('Upload failed:', error)
            this.showSaveStatus('Erreur lors de l\'upload', true)
          }
        }
      })
    })
  }

  private setupDragAndDrop(container: HTMLElement): void {
    const items = container.querySelectorAll('.gallery-item-admin')

    items.forEach((item) => {
      const element = item as HTMLElement

      element.addEventListener('dragstart', (e) => {
        this.draggedItem = element

        // Required for Firefox
        if (e instanceof DragEvent && e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move'
          e.dataTransfer.setData('text/plain', element.dataset.index || '0')
        }

        setTimeout(() => {
          this.draggedItem?.classList.add('dragging')
        }, 0)
      })

      element.addEventListener('dragend', () => {
        this.draggedItem?.classList.remove('dragging')

        // Save the new order
        if (this.draggedItem) {
          this.updateGalleryOrder(container)
        }

        this.draggedItem = null
      })

      element.addEventListener('dragover', (e) => {
        e.preventDefault()
        if (e instanceof DragEvent && e.dataTransfer) {
          e.dataTransfer.dropEffect = 'move'
        }
      })

      element.addEventListener('dragenter', (e) => {
        e.preventDefault()
        if (!this.draggedItem || this.draggedItem === element) return

        // Remove drag-over from all items
        container.querySelectorAll('.gallery-item-admin').forEach(item => {
          item.classList.remove('drag-over')
        })

        // Add visual feedback
        element.classList.add('drag-over')

        // Get the position to insert based on mouse position relative to element center
        const rect = element.getBoundingClientRect()
        const midX = rect.left + rect.width / 2
        const mouseX = (e as DragEvent).clientX

        // Insert before or after based on mouse position
        if (mouseX < midX) {
          container.insertBefore(this.draggedItem, element)
        } else {
          const nextSibling = element.nextElementSibling
          if (nextSibling) {
            container.insertBefore(this.draggedItem, nextSibling)
          } else {
            container.appendChild(this.draggedItem)
          }
        }
      })

      element.addEventListener('dragleave', () => {
        element.classList.remove('drag-over')
      })
    })

    // Container-level dragover to allow dropping
    container.addEventListener('dragover', (e) => {
      e.preventDefault()
    })

    // Clean up drag-over classes when drag ends anywhere
    container.addEventListener('dragend', () => {
      container.querySelectorAll('.gallery-item-admin').forEach(item => {
        item.classList.remove('drag-over')
      })
    })
  }

  private updateGalleryOrder(container: HTMLElement): void {
    if (!this.gallery) return

    const items = container.querySelectorAll('.gallery-item-admin')
    const newOrder: GalleryImage[] = []

    // Use the original index stored in data-index attribute
    items.forEach(item => {
      const originalIndex = parseInt(item.getAttribute('data-index') || '0', 10)
      if (this.gallery!.images[originalIndex]) {
        newOrder.push(this.gallery!.images[originalIndex])
      }
    })

    this.gallery.images = newOrder
    this.saveGalleryToFirebase()
    // Re-render to update indexes
    this.renderGallery()
  }

}

// Initialize admin panel
new AdminPanel()
