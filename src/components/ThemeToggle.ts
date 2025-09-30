export class ThemeToggle {
  private toggleButton: HTMLElement | null = null;
  private currentTheme: string = 'light';

  constructor() {
    this.init();
  }

  private init(): void {
    // Wait a bit to ensure other components are initialized
    setTimeout(() => {
      this.createToggleButton();
      this.loadSavedTheme();
      this.bindEvents();
    }, 100);
  }

  private createToggleButton(): void {
    // Find the desktop navigation container
    const desktopNav = document.querySelector('#navbar .hidden.md\\:flex');
    const mobileMenu = document.querySelector('#mobile-menu .space-y-1');

    if (desktopNav) {
      // Create desktop toggle button
      const desktopButton = document.createElement('button');
      desktopButton.id = 'theme-toggle-desktop';
      desktopButton.className = 'theme-toggle-nav p-2 rounded-md text-current hover:bg-gray-100 transition-colors';
      desktopButton.setAttribute('aria-label', 'Toggle dark theme');
      desktopButton.innerHTML = this.getSunIcon();

      // Add to the very end (most right) of the navbar
      desktopNav.appendChild(desktopButton);

      this.toggleButton = desktopButton;
    }

    if (mobileMenu) {
      // Create mobile toggle button
      const mobileButton = document.createElement('button');
      mobileButton.id = 'theme-toggle-mobile';
      mobileButton.className = 'theme-toggle-nav-mobile mobile-nav-link flex items-center space-x-2';
      mobileButton.setAttribute('aria-label', 'Toggle dark theme');

      const iconContainer = document.createElement('span');
      iconContainer.innerHTML = this.getSunIcon();
      const textSpan = document.createElement('span');
      textSpan.textContent = 'Theme';

      mobileButton.appendChild(iconContainer);
      mobileButton.appendChild(textSpan);

      mobileMenu.appendChild(mobileButton);

      // Add event listener for mobile button too
      mobileButton.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
  }

  private getSunIcon(): string {
    return `
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z">
        </path>
      </svg>
    `;
  }

  private getMoonIcon(): string {
    return `
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z">
        </path>
      </svg>
    `;
  }

  private loadSavedTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    this.currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    this.applyTheme(this.currentTheme);
  }

  private applyTheme(theme: string): void {
    const html = document.documentElement;
    const desktopButton = document.getElementById('theme-toggle-desktop');
    const mobileButton = document.getElementById('theme-toggle-mobile');

    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark');

      if (desktopButton) {
        desktopButton.innerHTML = this.getMoonIcon();
        desktopButton.setAttribute('aria-label', 'Switch to light theme');
      }

      if (mobileButton) {
        const iconContainer = mobileButton.querySelector('span');
        if (iconContainer) {
          iconContainer.innerHTML = this.getMoonIcon();
        }
        mobileButton.setAttribute('aria-label', 'Switch to light theme');
      }
    } else {
      html.removeAttribute('data-theme');

      if (desktopButton) {
        desktopButton.innerHTML = this.getSunIcon();
        desktopButton.setAttribute('aria-label', 'Switch to dark theme');
      }

      if (mobileButton) {
        const iconContainer = mobileButton.querySelector('span');
        if (iconContainer) {
          iconContainer.innerHTML = this.getSunIcon();
        }
        mobileButton.setAttribute('aria-label', 'Switch to dark theme');
      }
    }

    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
  }

  private toggleTheme(): void {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
  }

  private bindEvents(): void {
    const desktopButton = document.getElementById('theme-toggle-desktop');
    const mobileButton = document.getElementById('theme-toggle-mobile');

    // Desktop button events
    if (desktopButton) {
      desktopButton.addEventListener('click', () => {
        this.toggleTheme();
      });

      desktopButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggleTheme();
        }
      });
    }

    // Mobile button events (already bound in createToggleButton, but add keyboard support)
    if (mobileButton) {
      mobileButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggleTheme();
        }
      });
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}