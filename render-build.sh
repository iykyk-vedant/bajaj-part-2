#!/bin/bash

# Exit on any error
set -e

# Install dependencies
echo "Installing dependencies..."
npm ci --only=production

# Build the Next.js application
echo "Building Next.js application..."
npm run build

# Copy server.js to standalone directory
echo "Copying server.js to standalone directory..."
cp server.js .next/standalone/

echo "Build completed successfully!"