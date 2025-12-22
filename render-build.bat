@echo off

echo Installing dependencies...
npm ci --only=production

echo Building Next.js application...
npm run build

echo Copying server.js to standalone directory...
copy server.js .next\standalone\

echo Build completed successfully!