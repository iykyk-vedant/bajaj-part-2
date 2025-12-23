@echo off

echo Installing dependencies...
npm ci --only=production

echo Building Next.js application...
npm run build

echo Build completed successfully!