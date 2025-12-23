#!/bin/bash

# Exit on any error
set -e

# Install all dependencies for build
echo "Installing dependencies..."
npm ci

# Build the Next.js application
echo "Building Next.js application..."
npm run build

echo "Build completed successfully!"