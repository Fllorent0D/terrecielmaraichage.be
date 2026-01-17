import { initializeApp, getApps } from 'firebase/app'
import { getDatabase, ref, get } from 'firebase/database'
import { firebaseConfig, FIREBASE_ENABLED } from '../firebase-config'

interface GalleryImage {
  src: string
  caption: string
  visible: boolean
}

interface GalleryConfig {
  images: GalleryImage[]
  lastUpdated: string
}

export class Gallery {
  private container: HTMLElement | null
  private images: GalleryImage[] = []
  private lightbox: HTMLElement | null = null
  private currentIndex: number = 0

  constructor() {
    this.container = document.getElementById('gallery-grid')
    this.init()
  }

  private async init(): Promise<void> {
    if (!this.container) return

    try {
      let config: GalleryConfig | null = null

      // Try Firebase first if enabled
      if (FIREBASE_ENABLED) {
        try {
          const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
          const db = getDatabase(app)
          const snapshot = await get(ref(db, 'gallery'))
          if (snapshot.exists()) {
            config = snapshot.val()
          }
        } catch (firebaseError) {
          console.warn('Firebase fetch failed, falling back to local:', firebaseError)
        }
      }

      // Fallback to local file
      if (!config) {
        const response = await fetch('/data/gallery.json')
        config = await response.json()
      }

      if (config) {
        // Firebase may return arrays as objects, convert if needed
        let images = config.images
        if (images && !Array.isArray(images)) {
          images = Object.values(images)
        }
        this.images = (images || []).filter(img => img && img.visible)
        this.render()
        this.createLightbox()
        this.bindEvents()
      }
    } catch (error) {
      console.error('Failed to load gallery config:', error)
    }
  }

  private render(): void {
    if (!this.container || this.images.length === 0) return

    this.container.innerHTML = this.images.map((image, index) => `
      <div class="gallery-item" data-index="${index}">
        <img
          src="${image.src}"
          alt="${image.caption || 'Photo de la ferme'}"
          loading="lazy"
          class="gallery-image"
        />
        ${image.caption ? `<div class="gallery-caption">${image.caption}</div>` : ''}
      </div>
    `).join('')
  }

  private createLightbox(): void {
    this.lightbox = document.createElement('div')
    this.lightbox.className = 'lightbox'
    this.lightbox.innerHTML = `
      <button class="lightbox-close" aria-label="Fermer">&times;</button>
      <button class="lightbox-prev" aria-label="Image precedente">&#10094;</button>
      <button class="lightbox-next" aria-label="Image suivante">&#10095;</button>
      <div class="lightbox-content">
        <img src="" alt="" class="lightbox-image" />
        <div class="lightbox-caption"></div>
      </div>
      <div class="lightbox-counter"></div>
    `
    document.body.appendChild(this.lightbox)
  }

  private bindEvents(): void {
    if (!this.container || !this.lightbox) return

    this.container.addEventListener('click', (e) => {
      const item = (e.target as HTMLElement).closest('.gallery-item')
      if (item) {
        const index = parseInt(item.getAttribute('data-index') || '0', 10)
        this.openLightbox(index)
      }
    })

    this.lightbox.querySelector('.lightbox-close')?.addEventListener('click', () => {
      this.closeLightbox()
    })

    this.lightbox.querySelector('.lightbox-prev')?.addEventListener('click', (e) => {
      e.stopPropagation()
      this.prevImage()
    })

    this.lightbox.querySelector('.lightbox-next')?.addEventListener('click', (e) => {
      e.stopPropagation()
      this.nextImage()
    })

    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox) {
        this.closeLightbox()
      }
    })

    document.addEventListener('keydown', (e) => {
      if (!this.lightbox?.classList.contains('active')) return

      switch (e.key) {
        case 'Escape':
          this.closeLightbox()
          break
        case 'ArrowLeft':
          this.prevImage()
          break
        case 'ArrowRight':
          this.nextImage()
          break
      }
    })
  }

  private openLightbox(index: number): void {
    if (!this.lightbox) return

    this.currentIndex = index
    this.updateLightboxContent()
    this.lightbox.classList.add('active')
    document.body.style.overflow = 'hidden'
  }

  private closeLightbox(): void {
    if (!this.lightbox) return

    this.lightbox.classList.remove('active')
    document.body.style.overflow = ''
  }

  private prevImage(): void {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length
    this.updateLightboxContent()
  }

  private nextImage(): void {
    this.currentIndex = (this.currentIndex + 1) % this.images.length
    this.updateLightboxContent()
  }

  private updateLightboxContent(): void {
    if (!this.lightbox) return

    const image = this.images[this.currentIndex]
    const img = this.lightbox.querySelector('.lightbox-image') as HTMLImageElement
    const caption = this.lightbox.querySelector('.lightbox-caption') as HTMLElement
    const counter = this.lightbox.querySelector('.lightbox-counter') as HTMLElement

    if (img) {
      img.src = image.src
      img.alt = image.caption || 'Photo de la ferme'
    }

    if (caption) {
      caption.textContent = image.caption || ''
      caption.style.display = image.caption ? 'block' : 'none'
    }

    if (counter) {
      counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`
    }
  }
}
