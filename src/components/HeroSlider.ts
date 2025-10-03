export class HeroSlider {
  private container: HTMLElement | null
  private images: Array<{src: string, name: string}>
  private currentIndex: number = 0
  private slideInterval: number | null = null
  private dots: HTMLElement[] = []

  constructor() {
    this.container = document.getElementById('vegas-slider')

    // Original slide images from the theme
    this.images = [
      { name: "img 15", src: './img/img15.jpeg' },
      { name: "img 24", src: './img/img24.jpeg' },
      { name: "img 26", src: './img/img26.jpeg' },
      { name: "img 16", src: './img/img16.jpeg' },
      { name: "img 22", src: './img/img22.jpeg' },
      { name: "img 9", src: './img/img9.jpeg' },

    ]

    this.init()
  }

  private init(): void {
    if (!this.container) return

    this.createSlides()
    this.createDots()
    this.activateFirstSlide()
    this.startAutoSlide()
  }

  private createSlides(): void {
    if (!this.container) return

    this.images.forEach((image, index) => {
      const slide = document.createElement('div')
      slide.className = 'vegas-slide'
      slide.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url(${image.src});
        background-size: cover;
        background-position: center;
        opacity: ${index === 0 ? 1 : 0};
        transition: opacity 1s ease-in-out;
        animation: kenburns 20s ease-out infinite;
      `
      this.container!.appendChild(slide)
    })

    // No overlay added
  }

  private createDots(): void {
    // No dots created - removed as requested
  }

  private activateFirstSlide(): void {
    // No content slides to activate - just background images
  }

  private goToSlide(index: number): void {
    if (index === this.currentIndex || index >= this.images.length) return

    // Update background slides
    const slides = this.container?.querySelectorAll('.vegas-slide')
    slides?.forEach((slide, i) => {
      (slide as HTMLElement).style.opacity = i === index ? '1' : '0'
    })

    // Update dots
    this.dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index)
    })

    // No content slides to update

    this.currentIndex = index
  }

  private nextSlide(): void {
    const nextIndex = (this.currentIndex + 1) % this.images.length
    this.goToSlide(nextIndex)
  }

  private startAutoSlide(): void {
    this.slideInterval = window.setInterval(() => {
      this.nextSlide()
    }, 5000) // 5 second intervals like original
  }

  private stopAutoSlide(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval)
      this.slideInterval = null
    }
  }

  destroy(): void {
    this.stopAutoSlide()
  }
}