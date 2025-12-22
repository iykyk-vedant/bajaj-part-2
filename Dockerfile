# Use Node.js 18 as the base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]