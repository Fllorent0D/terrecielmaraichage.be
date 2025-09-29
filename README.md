# Terre & Ciel Maraîchage

A beautiful website for a sustainable farm in Belgium.

## Development

This project uses Gulp for building and development.

### Prerequisites

- Node.js (version 18 or higher)
- npm

### Installation

```bash
npm install
npm install -g gulp-cli
```

### Development

```bash
# Build the project
gulp build

# Development build with file watching
gulp dev
gulp watch
```

### Build

The built files will be in the `dist/` directory.

## GitHub Pages Deployment

This repository is configured to automatically deploy to GitHub Pages using GitHub Actions.

### Setup Instructions

1. **Push to GitHub**: Make sure your code is pushed to a GitHub repository.

2. **Enable GitHub Pages**:
   - Go to your repository settings
   - Scroll down to "Pages" section
   - Under "Source", select "GitHub Actions"

3. **Automatic Deployment**:
   - The workflow will automatically run when you push to the `main` or `master` branch
   - Your site will be available at `https://[username].github.io/[repository-name]`

### Manual Deployment

You can also trigger a deployment manually:
- Go to the "Actions" tab in your GitHub repository
- Select the "Deploy to GitHub Pages" workflow
- Click "Run workflow"

## Project Structure

```
src/
├── html/           # HTML templates
├── style/          # SCSS files
├── js/             # JavaScript files
├── img/            # Images
└── fonts/          # Font files

dist/               # Built files (generated)
```

## Features

- Responsive design
- Modern build process with Gulp
- SCSS compilation
- JavaScript minification
- Image optimization
- Automatic GitHub Pages deployment