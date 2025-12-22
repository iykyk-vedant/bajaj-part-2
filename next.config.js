/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure image optimization
  images: {
    domains: ['picsum.photos', 'images.unsplash.com'],
  },
  
  // Environment variables
  env: {
    MYSQL_HOST: process.env.MYSQL_HOST,
    MYSQL_PORT: process.env.MYSQL_PORT,
    MYSQL_USER: process.env.MYSQL_USER,
    MYSQL_PASSWORD: process.env.MYSQL_PASSWORD,
    MYSQL_DATABASE: process.env.MYSQL_DATABASE,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
}

module.exports = nextConfig