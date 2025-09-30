export class Navigation {
  private navbar: HTMLElement | null
  private navLinks: NodeListOf<HTMLAnchorElement>

  constructor() {
    this.navbar = document.getElementById('navbar')
    this.navLinks = document.querySelectorAll('a[href^="#"]')

    this.init()
  }

  private init(): void {
    this.setupSmoothScrolling()
    this.setupScrollSpy()
    this.setupNavbarScroll()
  }


  private setupSmoothScrolling(): void {
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault()
        const targetId = link.getAttribute('href')?.substring(1)
        if (targetId) {
          const targetElement = document.getElementById(targetId)
          if (targetElement) {
            const navbarHeight = this.navbar?.offsetHeight || 0
            const targetPosition = targetElement.offsetTop - navbarHeight

            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            })
          }
        }
      })
    })
  }

  private setupScrollSpy(): void {
    const sections = document.querySelectorAll('section[id]')

    const observerOptions = {
      rootMargin: '-20% 0px -80% 0px',
      threshold: 0
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.updateActiveLink(entry.target.id)
        }
      })
    }, observerOptions)

    sections.forEach(section => observer.observe(section))
  }

  private updateActiveLink(activeId: string): void {
    this.navLinks.forEach(link => {
      link.classList.remove('active')
      if (link.getAttribute('href') === `#${activeId}`) {
        link.classList.add('active')
      }
    })
  }

  private setupNavbarScroll(): void {
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY
      const heroHeight = window.innerHeight * 0.4 // 40vh

      if (this.navbar) {
        if (currentScrollY > heroHeight - 100) {
          // Scrolled past hero - dark theme
          this.navbar.classList.remove('bg-white/10', 'border-white/20')
          this.navbar.classList.add('bg-white/95', 'border-gray-200')
          this.navbar.classList.add('navbar-scrolled')
        } else {
          // On hero - light theme
          this.navbar.classList.remove('bg-white/95', 'border-gray-200')
          this.navbar.classList.add('bg-white/10', 'border-white/20')
          this.navbar.classList.remove('navbar-scrolled')
        }
      }
    })
  }
}