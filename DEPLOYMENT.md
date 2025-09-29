# Deployment Guide - Modern Site

This guide explains how to deploy the modern-site project using GitHub Actions and GitHub Pages.

## 🚀 Automatic Deployment

The project is configured with GitHub Actions for automatic deployment. Here's how it works:

### Prerequisites

1. **GitHub Pages Setup**: Enable GitHub Pages in your repository settings
2. **Repository Permissions**: Ensure the repository has the necessary permissions for GitHub Pages deployment

### Setup Steps

1. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Select "GitHub Actions" as the source

2. **Configure Repository Name** (if needed):
   - Update the `base` path in `modern-site/vite.config.ts` to match your repository name
   - The current configuration assumes repository name: `agricom-agriculture-organic-food-html-theme-pack`

### How It Works

The GitHub Action workflow (`deploy-modern-site.yml`) will:

1. **Trigger**: Automatically run on:
   - Push to `main` or `master` branch
   - Changes to `modern-site/` directory
   - Manual workflow dispatch

2. **Build Process**:
   - Install Node.js 20
   - Install dependencies with `npm ci`
   - Run linting with `npm run lint`
   - Build the project with `npm run build`
   - Deploy to GitHub Pages

3. **Deployment**:
   - Builds the Vite project with production optimizations
   - Deploys the `modern-site/dist` folder to GitHub Pages
   - Enables PWA (Progressive Web App) features

### Manual Deployment

To manually trigger deployment:

1. Go to the "Actions" tab in your GitHub repository
2. Select "Build and Deploy Modern Site" workflow
3. Click "Run workflow"

### Local Development

```bash
# Navigate to modern-site directory
cd modern-site

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Configuration

### Environment Variables

The build process uses these environment variables:
- `NODE_ENV=production` - Enables production optimizations

### Build Output

The build process creates optimized files in `modern-site/dist/`:
- Minified JavaScript and CSS
- Optimized images
- PWA manifest and service worker
- Source maps for debugging

### PWA Features

The site includes Progressive Web App features:
- Service worker for offline functionality
- Web app manifest for mobile installation
- Automatic updates

## 🌐 Accessing the Deployed Site

Once deployed, your site will be available at:
- **GitHub Pages URL**: `https://[username].github.io/[repository-name]`
- **Direct Link**: Available in the GitHub Actions output

## 🐛 Troubleshooting

### Common Issues

1. **Build Fails**:
   - Check that all dependencies are installed
   - Verify TypeScript compilation passes
   - Ensure linting passes

2. **Deployment Fails**:
   - Verify GitHub Pages is enabled
   - Check repository permissions
   - Ensure the workflow has the correct permissions

3. **Assets Not Loading**:
   - Verify the `base` path in `vite.config.ts` matches your repository name
   - Check that all assets are included in the build

### Debugging

- Check the GitHub Actions logs for detailed error messages
- Verify the build output in `modern-site/dist/`
- Test locally with `npm run preview` before deploying

## 📝 Notes

- The workflow includes both build and deployment steps
- Pull requests will run a build check without deployment
- The site is optimized for production with minification and source maps
- PWA features are automatically configured and deployed
