import { initializeApp, getApps } from 'firebase/app'
import { getDatabase, ref, get } from 'firebase/database'
import { firebaseConfig, FIREBASE_ENABLED } from '../firebase-config'

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
  navigation?: {
    logoImage: string
    orderUrl: string
    orderButtonText: string
  }
  heroSlider?: {
    images: HeroSliderImage[]
  }
  aboutSection?: {
    mainHeading: string
    subtitle: string
    paragraphs: string[]
    features: AboutFeature[]
  }
  parallax?: {
    backgroundImage: string
    heading: string
    subheading: string
  }
  growingActivity?: {
    heading: string
    subtitle: string
    paragraphs: string[]
    ctaText: string
    ctaUrl: string
    sideImage: string
  }
  founder?: {
    image: string
    heading: string
    subHeading: string
    paragraphs: string[]
    signatureName: string
  }
  gallerySection?: {
    title: string
    description: string
  }
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
  lastUpdated?: string
}

export class ContentLoader {
  private content: ContentConfig | null = null

  constructor() {
    this.init()
  }

  private async init(): Promise<void> {
    try {
      // Try Firebase first if enabled
      if (FIREBASE_ENABLED) {
        try {
          const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
          const db = getDatabase(app)
          const snapshot = await get(ref(db, 'content'))
          if (snapshot.exists()) {
            this.content = snapshot.val()
          }
        } catch (firebaseError) {
          console.warn('Firebase content fetch failed, falling back to local:', firebaseError)
        }
      }

      // Fallback to local file
      if (!this.content) {
        const response = await fetch('/data/content.json')
        this.content = await response.json()
      }

      if (this.content) {
        this.applyContent()
      }
    } catch (error) {
      console.error('Failed to load content config:', error)
    }
  }

  private applyContent(): void {
    if (!this.content) return

    this.applyNavigation()
    this.applyAboutSection()
    this.applyParallaxSection()
    this.applyGrowingActivitySection()
    this.applyFounderSection()
    this.applyGallerySection()
    this.applyOrdersSection()
    this.applyFooterSection()
  }

  private applyNavigation(): void {
    const nav = this.content?.navigation
    if (!nav) return

    // Update order buttons
    const orderButtons = document.querySelectorAll('a[href*="ciboulette.net"]')
    orderButtons.forEach(btn => {
      if (nav.orderUrl) {
        btn.setAttribute('href', nav.orderUrl)
      }
      if (nav.orderButtonText && btn.textContent?.trim() === 'Commander') {
        btn.textContent = nav.orderButtonText
      }
    })
  }

  private applyAboutSection(): void {
    const about = this.content?.aboutSection
    if (!about) return

    // Main heading
    const aboutHeading = document.querySelector('#about h2')
    if (aboutHeading && about.mainHeading) {
      aboutHeading.innerHTML = about.mainHeading
    }

    // Subtitle
    const aboutSubtitle = document.querySelector('#about h3')
    if (aboutSubtitle && about.subtitle) {
      aboutSubtitle.innerHTML = about.subtitle
    }

    // Paragraphs
    const aboutParagraphs = document.querySelectorAll('#about .lg\\:col-span-9 > .mb-6 > p, #about .lg\\:col-span-9 > .mb-8 > p')
    if (about.paragraphs && aboutParagraphs.length > 0) {
      about.paragraphs.forEach((text, index) => {
        if (aboutParagraphs[index]) {
          aboutParagraphs[index].innerHTML = text
        }
      })
    }

    // Features
    if (about.features) {
      const featureItems = document.querySelectorAll('.feature__item')
      about.features.forEach((feature, index) => {
        const item = featureItems[index]
        if (item) {
          const titleEl = item.querySelector('.feature__item__title')
          if (titleEl && feature.title) {
            titleEl.innerHTML = feature.title
          }

          // Handle visibility
          const col = item.closest('.col')
          if (col) {
            if (feature.visible === false) {
              (col as HTMLElement).style.display = 'none'
            } else {
              (col as HTMLElement).style.display = ''
            }
          }
        }
      })
    }
  }

  private applyParallaxSection(): void {
    const parallax = this.content?.parallax
    if (!parallax) return

    const parallaxSection = document.querySelector('.parallax-section') as HTMLElement
    if (parallaxSection) {
      if (parallax.backgroundImage) {
        parallaxSection.style.backgroundImage = `url('${parallax.backgroundImage}')`
      }

      const heading = parallaxSection.querySelector('h2')
      if (heading && parallax.heading) {
        heading.innerHTML = parallax.heading
      }

      const subheading = parallaxSection.querySelector('p')
      if (subheading && parallax.subheading) {
        subheading.innerHTML = parallax.subheading
      }
    }
  }

  private applyGrowingActivitySection(): void {
    const growing = this.content?.growingActivity
    if (!growing) return

    const section = document.querySelector('.section--custom-2')
    if (!section) return

    const heading = section.querySelector('h2')
    if (heading && growing.heading) {
      heading.innerHTML = growing.heading
    }

    const subtitle = section.querySelector('h3')
    if (subtitle && growing.subtitle) {
      subtitle.innerHTML = growing.subtitle
    }

    // Paragraphs
    const paragraphs = section.querySelectorAll('.lg\\:col-span-1:first-child > p')
    if (growing.paragraphs) {
      growing.paragraphs.forEach((text, index) => {
        if (paragraphs[index]) {
          paragraphs[index].innerHTML = text
        }
      })
    }

    // CTA button
    const ctaButton = section.querySelector('.custom-btn')
    if (ctaButton) {
      if (growing.ctaText) {
        ctaButton.textContent = growing.ctaText
      }
      if (growing.ctaUrl) {
        ctaButton.setAttribute('href', growing.ctaUrl)
      }
    }

    // Side image
    const sideImage = section.querySelector('.img-place') as HTMLElement
    if (sideImage && growing.sideImage) {
      sideImage.style.backgroundImage = `url('${growing.sideImage}')`
    }
  }

  private applyFounderSection(): void {
    const founder = this.content?.founder
    if (!founder) return

    const section = document.querySelector('.section--background-logo')
    if (!section) return

    // Image
    const img = section.querySelector('img.img-fluid') as HTMLImageElement
    if (img && founder.image) {
      img.src = founder.image
    }

    // Heading
    const heading = section.querySelector('.section-heading h2')
    if (heading && founder.heading) {
      heading.innerHTML = founder.heading
    }

    // Subheading
    const subHeading = section.querySelector('.mb-8 h3')
    if (subHeading && founder.subHeading) {
      subHeading.innerHTML = founder.subHeading
    }

    // Paragraphs
    const paragraphs = section.querySelectorAll('.mb-8 > p')
    if (founder.paragraphs) {
      founder.paragraphs.forEach((text, index) => {
        if (paragraphs[index]) {
          paragraphs[index].innerHTML = text
        }
      })
    }

    // Signature
    const signature = section.querySelector('p[style*="text-align: right"] strong')
    if (signature && founder.signatureName) {
      signature.textContent = founder.signatureName
    }
  }

  private applyGallerySection(): void {
    const gallery = this.content?.gallerySection
    if (!gallery) return

    const heading = document.querySelector('#gallery-heading')
    if (heading && gallery.title) {
      heading.innerHTML = gallery.title
    }

    const description = document.querySelector('#gallery .section-heading p')
    if (description && gallery.description) {
      description.innerHTML = gallery.description
    }
  }

  private applyOrdersSection(): void {
    const orders = this.content?.orders
    if (!orders) return

    const section = document.querySelector('#orders')
    if (!section) return

    // Title
    const heading = section.querySelector('#orders-heading')
    if (heading && orders.title) {
      heading.innerHTML = orders.title
    }

    // Intro text
    const introText = section.querySelector('.text-center.mb-12 > p')
    if (introText && orders.introText) {
      introText.innerHTML = orders.introText
    }

    // Pickup heading
    const pickupHeading = section.querySelector('.text-center.mb-12 h3')
    if (pickupHeading && orders.pickupHeading) {
      pickupHeading.innerHTML = orders.pickupHeading
    }

    // Pickup hours
    const pickupHours = section.querySelector('.bg-white .text-xl.font-bold')
    if (pickupHours && orders.pickupHours) {
      pickupHours.innerHTML = orders.pickupHours
    }

    // Pickup location
    const pickupLocation = section.querySelector('.bg-white .flex.items-center span')
    if (pickupLocation && orders.pickupLocation) {
      pickupLocation.innerHTML = orders.pickupLocation
    }

    // Pickup note
    const pickupNote = section.querySelector('.bg-white .text-gray-600.italic')
    if (pickupNote && orders.pickupNote) {
      pickupNote.innerHTML = orders.pickupNote
    }

    // Button
    const button = section.querySelector('.custom-btn.primary')
    if (button) {
      if (orders.buttonText) {
        button.textContent = orders.buttonText
      }
      if (orders.buttonUrl) {
        button.setAttribute('href', orders.buttonUrl)
      }
    }
  }

  private applyFooterSection(): void {
    const footer = this.content?.footer
    if (!footer) return

    const section = document.querySelector('#contact')
    if (!section) return

    // Logo
    const logo = section.querySelector('img[alt*="Logo"]') as HTMLImageElement
    if (logo && footer.logoImage) {
      logo.src = footer.logoImage
    }

    // Copyright text
    const copyrightP = section.querySelector('.text-gray-600')
    if (copyrightP && footer.copyrightYear && footer.businessName && footer.ownerName && footer.tagline) {
      copyrightP.innerHTML = `&copy; ${footer.copyrightYear}, <em>${footer.businessName}</em>.<br />${footer.ownerName}<br />
      <span class="text-sm">${footer.tagline}</span>`
    }

    // Address
    const addressDiv = section.querySelector('.contact-item:first-of-type div:last-child')
    if (addressDiv && footer.address && footer.businessName) {
      addressDiv.innerHTML = `<strong>${footer.businessName}</strong><br />${footer.address}`
    }

    // Email
    const emailLink = section.querySelector('a[href^="mailto:"]')
    if (emailLink && footer.email) {
      emailLink.setAttribute('href', `mailto:${footer.email}`)
      emailLink.textContent = footer.email
    }

    // Phone
    const phoneLink = section.querySelector('a[href^="tel:"]')
    if (phoneLink && footer.phone) {
      const cleanPhone = footer.phone.replace(/\s/g, '')
      phoneLink.setAttribute('href', `tel:${cleanPhone}`)
      phoneLink.textContent = footer.phone
    }

    // Facebook
    const facebookLink = section.querySelector('a[href*="facebook.com"]')
    if (facebookLink && footer.facebookUrl) {
      facebookLink.setAttribute('href', footer.facebookUrl)
    }

    // IBAN and VAT
    const ibanVatDiv = section.querySelector('.contact-item:last-of-type div:last-child')
    if (ibanVatDiv && footer.iban && footer.vat) {
      ibanVatDiv.innerHTML = `<strong>IBAN:</strong> ${footer.iban}<br /><strong>TVA:</strong> ${footer.vat}`
    }

    // Footer quote
    const quoteP = section.querySelector('.text-sm.text-gray-500.italic')
    if (quoteP && footer.footerQuote) {
      quoteP.innerHTML = `"${footer.footerQuote}"`
    }
  }
}
