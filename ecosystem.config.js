module.exports = {
  apps: [
    {
      name: 'alemancenter-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/var/www/vhosts/alemedu.com/httpdocs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Public URL used by the browser for client-side API calls
        NEXT_PUBLIC_API_URL: 'https://api.alemedu.com/api',
        NEXT_PUBLIC_APP_URL: 'https://alemedu.com',
        // Internal URL used by Next.js SSR — direct HTTP to Go Fiber, bypasses Nginx
        API_INTERNAL_URL: 'http://127.0.0.1:8081/api',
        // Host header sent on SSR requests so Go Fiber/Nginx knows the target vhost
        API_HOSTNAME: 'api.alemedu.com',
        // Sensitive keys (FRONTEND_API_KEY, NEXT_PUBLIC_FRONTEND_API_KEY) are loaded
        // at runtime from .env.production on the server — do not hardcode here.
        NEXT_PUBLIC_FRONTEND_API_KEY: process.env.NEXT_PUBLIC_FRONTEND_API_KEY,
      },
      error_file: '/var/www/vhosts/alemedu.com/logs/pm2-error.log',
      out_file: '/var/www/vhosts/alemedu.com/logs/pm2-out.log',
      time: true
    }
  ]
};
