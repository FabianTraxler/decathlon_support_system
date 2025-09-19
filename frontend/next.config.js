/** @type {import('next').NextConfig} */

let backend_domain = process.env.NODE_ENV == "development"? "localhost" : "rust_backend";
const nextConfig = {
    async rewrites() {
        return [
          {
            source: '/api/:path*', 
            destination: `http://${backend_domain}:3001/api/:path*` // Proxy to Backend
          }
        ]
      },
      env: {
        START_DATE: "2025-09-27"
      },
      output: "standalone"
}

// Configuration object tells the next-pwa plugin 
const withPWA = require("next-pwa")({
  dest: "public", // Destination directory for the PWA files
  disable: process.env.NODE_ENV === "development", // Disable PWA in development mode
  register: true, // Register the PWA service worker
  skipWaiting: true, // Skip waiting for service worker activation
});

module.exports = withPWA(nextConfig)
