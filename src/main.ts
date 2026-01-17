import './style.css'
import { HeroSlider } from './components/HeroSlider'
import { Navigation } from './components/Navigation'
import { BackToTop } from './components/BackToTop'
import { ThemeToggle } from './components/ThemeToggle'
import { Gallery } from './components/Gallery'
import { MarketDates } from './components/MarketDates'
import { ContentLoader } from './components/ContentLoader'
import { createIcons, Leaf, Apple, HeartHandshake, AreaChart, Users, MapPin, Clock } from 'lucide'

// Initialize components
document.addEventListener('DOMContentLoaded', () => {
  new Navigation()
  new HeroSlider()
  new BackToTop()
  new ThemeToggle()
  new Gallery()
  new MarketDates()
  new ContentLoader()

  // Initialize Lucide icons
  createIcons({
    icons: { Leaf, Apple, HeartHandshake, AreaChart, Users, MapPin, Clock }
  })
})