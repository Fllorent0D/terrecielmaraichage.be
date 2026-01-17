import { initializeApp, getApps } from 'firebase/app'
import { getDatabase, ref, get } from 'firebase/database'
import { firebaseConfig, FIREBASE_ENABLED } from '../firebase-config'

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

export class MarketDates {
  private config: Config | null = null

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
          const snapshot = await get(ref(db, 'config'))
          if (snapshot.exists()) {
            this.config = snapshot.val()
          }
        } catch (firebaseError) {
          console.warn('Firebase fetch failed, falling back to local:', firebaseError)
        }
      }

      // Fallback to local file
      if (!this.config) {
        const response = await fetch('/data/config.json')
        this.config = await response.json()
      }

      this.renderMarketSection()
    } catch (error) {
      console.error('Failed to load market config:', error)
    }
  }

  private getDayName(day: string): string {
    const dayNames: Record<string, string> = {
      'sunday': 'Dimanche',
      'monday': 'Lundi',
      'tuesday': 'Mardi',
      'wednesday': 'Mercredi',
      'thursday': 'Jeudi',
      'friday': 'Vendredi',
      'saturday': 'Samedi'
    }
    return dayNames[day] || day
  }

  private getFrequencyText(market: MarketConfig): string {
    if (market.pattern === 'weekly') {
      return `Chaque ${this.getDayName(market.day).toLowerCase()}`
    } else if (market.pattern === 'biweekly' && market.weeks) {
      const weeks = Array.isArray(market.weeks) ? market.weeks : Object.values(market.weeks)
      const weekText = weeks.map(w => `${w}${w === 1 ? 'ère' : 'ème'}`).join(' et ')
      return `${weekText} semaine du mois`
    } else if (market.pattern === 'monthly' && market.week !== undefined && market.months) {
      const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                         'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
      const months = Array.isArray(market.months) ? market.months : Object.values(market.months)
      const weekNum = market.week
      const weekSuffix = weekNum === 1 ? 'er' : 'ème'
      const monthText = months.map(m => monthNames[(m as number) - 1]).join(', ')
      return `${weekNum}${weekSuffix} ${this.getDayName(market.day).toLowerCase()} (${monthText})`
    }
    return ''
  }

  private formatHours(hours: string): string {
    return hours.replace('-', ' à ').replace(':', 'h').replace(':', 'h')
  }

  private getNextOccurrence(marketConfig: MarketConfig): Date | null {
    if (!marketConfig.enabled) return null

    const now = new Date()
    const dayMap: Record<string, number> = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    }

    const { pattern, day, week } = marketConfig
    let { weeks, months, closedDates } = marketConfig
    if (weeks && !Array.isArray(weeks)) weeks = Object.values(weeks)
    if (months && !Array.isArray(months)) months = Object.values(months)
    if (closedDates && !Array.isArray(closedDates)) closedDates = Object.values(closedDates)

    const targetDay = dayMap[day]
    const closedSet = new Set(closedDates || [])

    for (let i = 0; i < 90; i++) {
      const checkDate = new Date(now.getTime() + (i * 24 * 60 * 60 * 1000))
      const dayOfWeek = checkDate.getDay()
      const dayOfMonth = checkDate.getDate()
      const month = checkDate.getMonth()

      const dateStr = checkDate.toISOString().split('T')[0]
      if (closedSet.has(dateStr)) continue

      const firstDayOfMonth = new Date(checkDate.getFullYear(), month, 1)
      const firstDayOfWeek = firstDayOfMonth.getDay()
      const daysToFirstTarget = (targetDay - firstDayOfWeek + 7) % 7
      const firstTargetDate = 1 + daysToFirstTarget
      const weekOfMonth = Math.floor((dayOfMonth - firstTargetDate) / 7) + 1

      if (dayOfWeek !== targetDay) continue

      const checkDateStart = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate())
      const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      if (checkDateStart < nowStart) continue

      if (pattern === 'weekly') {
        return checkDate
      } else if (pattern === 'biweekly' && weeks) {
        if (weeks.includes(weekOfMonth)) {
          return checkDate
        }
      } else if (pattern === 'monthly' && week !== undefined && months) {
        const jsMonths = months.map(m => (m as number) - 1)
        if (weekOfMonth === week && jsMonths.includes(month)) {
          return checkDate
        }
      }
    }
    return null
  }

  private formatDate(date: Date | null): string {
    if (!date) return "Pas de prochaine date"

    const now = new Date()
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const formatted = `${day}-${month}-${year}`

    const weekdayOptions: Intl.DateTimeFormatOptions = { weekday: 'long' }
    const weekday = date.toLocaleDateString('fr-BE', weekdayOptions)

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const marketDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const daysUntil = Math.ceil((marketDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

    if (daysUntil === 0) {
      return `Aujourd'hui - ${weekday} ${formatted}`
    } else if (daysUntil === 1) {
      return `Demain - ${weekday} ${formatted}`
    } else if (daysUntil <= 7) {
      return `Dans ${daysUntil} jours - ${weekday} ${formatted}`
    } else {
      return `${weekday} ${formatted}`
    }
  }

  private renderMarketSection(): void {
    if (!this.config) return

    // Render section heading
    const headingContainer = document.getElementById('markets-section-heading')
    if (headingContainer && this.config.marketSection) {
      headingContainer.innerHTML = `
        <h2 id="markets-heading" class="title text-3xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-6">${this.config.marketSection.title}</h2>
        <p class="text-lg text-gray-600 max-w-3xl mx-auto">${this.config.marketSection.description}</p>
      `
    }

    // Render market cards
    const container = document.getElementById('markets-container')
    if (!container) return

    const enabledMarkets = Object.entries(this.config.markets).filter(([, market]) => market.enabled)

    if (enabledMarkets.length === 0) {
      container.innerHTML = '<p class="text-gray-600 text-center">Aucun point de vente disponible pour le moment.</p>'
      return
    }

    container.innerHTML = enabledMarkets.map(([marketKey, market]) => {
      const nextDate = this.getNextOccurrence(market)
      const formattedDate = this.formatDate(nextDate)
      const frequencyText = this.getFrequencyText(market)
      const formattedHours = this.formatHours(market.hours)

      return `
        <div class="bg-white rounded-lg shadow-lg p-8 border-l-4 border-primary-600 hover:shadow-xl transition-shadow duration-300" role="listitem">
          <h5 class="text-2xl font-bold text-primary-600 mb-6">${market.name}</h5>
          <p class="text-gray-800 font-semibold mb-6 text-lg">${frequencyText}</p>

          <div class="space-y-4 mb-6">
            <div class="flex items-center text-gray-600">
              <i data-lucide="map-pin" class="w-6 h-6 mr-4 text-primary-600"></i>
              <span class="text-lg">${market.location}</span>
            </div>
            <div class="flex items-center text-gray-600">
              <i data-lucide="clock" class="w-6 h-6 mr-4 text-primary-600"></i>
              <span class="text-lg">${formattedHours}</span>
            </div>
          </div>

          <div class="border-t pt-4 mt-6">
            <p class="text-sm text-gray-500 mb-2">Prochaine date :</p>
            <p class="text-lg font-medium text-primary-600" data-market="${marketKey}">${formattedDate}</p>
          </div>
        </div>
      `
    }).join('')

    // Re-initialize Lucide icons for the new elements
    if (typeof window !== 'undefined' && (window as unknown as { lucide?: { createIcons: () => void } }).lucide) {
      (window as unknown as { lucide: { createIcons: () => void } }).lucide.createIcons()
    }
  }
}
