#!/bin/bash

# Build and Test Script for Modern Site
# This script helps with local testing before deployment

set -e

echo "🚀 Building and testing modern-site..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the modern-site directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run linting
echo "🔍 Running linting..."
npm run lint

# Type check
echo "🔧 Running TypeScript type check..."
npx tsc --noEmit

# Build the project
echo "🏗️ Building project..."
NODE_ENV=production npm run build

# Check build output
echo "✅ Build completed successfully!"
echo "📁 Build output:"
ls -la dist/

# Test the build locally
echo "🌐 Starting preview server..."
echo "Press Ctrl+C to stop the preview server"
npm run preview
