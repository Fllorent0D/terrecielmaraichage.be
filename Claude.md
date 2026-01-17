# Claude.md - Project Instructions

## Project Overview

Terre & Ciel Maraîchage - A modern website for an organic farm (maraîchage biologique) in Belgium.

## Tech Stack

- **Build Tool**: Vite 5
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Sass
- **Backend/Hosting**: Firebase Hosting
- **Icons**: Lucide
- **PWA**: vite-plugin-pwa for offline support

## Key Commands

```bash
# Development
npm run dev          # Start dev server on port 3000

# Build & Deploy
npm run build        # TypeScript check + Vite build
npm run preview      # Preview production build
npm run deploy       # Build and deploy to Firebase Hosting
npm run deploy:preview  # Deploy to preview channel

# Code Quality
npm run type-check   # TypeScript type checking
npm run format       # Format code with Prettier
```

## Project Structure

- `index.html` - Main public-facing website
- `admin.html` - Admin panel entry point
- `src/main.ts` - Main site TypeScript
- `src/admin.ts` - Admin panel TypeScript
- `src/components/` - Reusable components (Gallery, MarketDates)
- `src/firebase-config.ts` - Firebase configuration
- `public/data/` - Static data files

## Deployment

The site is deployed to Firebase Hosting. Use `npm run deploy` for production deployment.

## Notes

- Image optimization is enabled only in production builds (mozjpeg, pngquant, svgo)
- The site is a PWA with offline support via Workbox
- Multi-page setup: both `index.html` and `admin.html` are built as separate entry points
