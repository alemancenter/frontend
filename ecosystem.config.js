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

        // ── Public (browser) ──────────────────────────────────────────────
        // MUST also be set before `npm run build` so Next.js inlines them
        // into the JS bundle.  Add them to the server shell profile, e.g.:
        //   export NEXT_PUBLIC_API_URL=https://api.alemedu.com/api
        //   export NEXT_PUBLIC_FRONTEND_API_KEY=<key>
        // then run: npm run build && pm2 restart alemancenter-frontend
        NEXT_PUBLIC_API_URL: 'https://api.alemedu.com/api',
        NEXT_PUBLIC_APP_URL: 'https://alemedu.com',
        NEXT_PUBLIC_DEFAULT_COUNTRY_ID: '1',
        // Loaded from shell environment — must be set before build
        NEXT_PUBLIC_FRONTEND_API_KEY: process.env.NEXT_PUBLIC_FRONTEND_API_KEY || '',

        // ── Server-only (SSR) ─────────────────────────────────────────────
        // These are read at request time — safe to set here or in .env.production
        // Direct HTTP to Go Fiber, bypasses Nginx
        API_INTERNAL_URL: 'http://127.0.0.1:8081/api',
        // Host header for SSR requests (tells Fiber which vhost)
        API_HOSTNAME: 'api.alemedu.com',
        // Server-only API key for SSR requests (never exposed to browser)
        FRONTEND_API_KEY: process.env.FRONTEND_API_KEY || '',
      },
      error_file: '/var/www/vhosts/alemedu.com/logs/pm2-error.log',
      out_file: '/var/www/vhosts/alemedu.com/logs/pm2-out.log',
      time: true
    }
  ]
};
