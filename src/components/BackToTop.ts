export class BackToTop {
  private button: HTMLElement | null

  constructor() {
    this.button = document.getElementById('back-to-top')
    this.init()
  }

  private init(): void {
    if (!this.button) return

    this.setupScrollListener()
    this.setupClickHandler()
  }

  private setupScrollListener(): void {
    let ticking = false

    const updateButton = () => {
      const scrollY = window.scrollY
      const shouldShow = scrollY > 300

      if (this.button) {
        if (shouldShow) {
          this.button.classList.add('visible')
        } else {
          this.button.classList.remove('visible')
        }
      }

      ticking = false
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateButton)
        ticking = true
      }
    })
  }

  private setupClickHandler(): void {
    this.button?.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    })
  }
}