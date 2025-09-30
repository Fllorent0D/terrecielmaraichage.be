import './style.css'
import { HeroSlider } from './components/HeroSlider'
import { Navigation } from './components/Navigation'
import { BackToTop } from './components/BackToTop'
import { ThemeToggle } from './components/ThemeToggle'
import { createIcons, Leaf, Apple, HeartHandshake, AreaChart, Users, MapPin, Clock } from 'lucide'

// Initialize components
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing components...')
  new Navigation()
  new HeroSlider()
  new BackToTop()
  new ThemeToggle()
  
  // Initialize Lucide icons
  console.log('Initializing Lucide icons...')
  createIcons({ 
    icons: { Leaf, Apple, HeartHandshake, AreaChart, Users, MapPin, Clock }
  })
  console.log('Lucide icons initialized')
})