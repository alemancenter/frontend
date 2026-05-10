import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const currentDir = dirname(fileURLToPath(import.meta.url));

// ==============================================
// Dynamic Domain Configuration from Environment
// ==============================================
// Extract hostnames from environment variables
const getHostFromUrl = (url: string | undefined): string | null => {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

// API hostname (e.g., api.example.com)
const apiHost = getHostFromUrl(process.env.NEXT_PUBLIC_API_URL);
// App hostname (e.g., example.com)
const appHost = getHostFromUrl(process.env.NEXT_PUBLIC_APP_URL);

// Extract port from a URL string (e.g. "http://127.0.0.1:8080/api" → "8080")
const getPortFromUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  try {
    const port = new URL(url).port;
    return port || undefined;
  } catch {
    return undefined;
  }
};

const apiPort = getPortFromUrl(process.env.NEXT_PUBLIC_API_URL);

// Build dynamic remote patterns for images
const buildRemotePatterns = () => {
  const patterns: Array<{
    protocol: 'http' | 'https';
    hostname: string;
    port?: string;
    pathname?: string;
  }> = [
    // Always allow these (external services)
    { protocol: 'https', hostname: 'api.dicebear.com' },
    { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
    { protocol: 'https', hostname: '*.googleusercontent.com', pathname: '/**' },
    // Local development — port is read dynamically from NEXT_PUBLIC_API_URL
    { protocol: 'http', hostname: 'localhost', port: apiPort, pathname: '/**' },
    { protocol: 'http', hostname: '127.0.0.1', port: apiPort, pathname: '/**' },
  ];

  // Add API host from environment
  if (apiHost) {
    patterns.push({ protocol: 'https', hostname: apiHost, pathname: '/**' });
  }

  // Add App host from environment
  if (appHost && appHost !== apiHost) {
    patterns.push({ protocol: 'https', hostname: appHost, pathname: '/**' });
  }

  return patterns;
};

const nextConfig: NextConfig = {
  // Performance optimizations
  poweredByHeader: false,
  compress: true,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: buildRemotePatterns(),
  },

  // Experimental features for performance
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'date-fns',
      '@headlessui/react',
      'recharts',
    ],
    scrollRestoration: true,
    // Optimize CSS loading
    optimizeCss: true,
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Target modern browsers only — prevents SWC from emitting polyfills for
  // ES2019–ES2022 built-ins (Array.at, Object.fromEntries, etc.) that are
  // already shipped natively in every browser in the browserslist.
  transpilePackages: [],

  turbopack: {
    root: currentDir,
  },

  async redirects() {
    return [
      {
        source: "/about",
        destination: "/about-us",
        permanent: true,
      },
      {
        source: "/about/",
        destination: "/about-us",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/download/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          }
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://cdn-cookieyes.com https://www.gstatic.com https://accounts.google.com https://*.adtrafficquality.google",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              `connect-src 'self' https://api.alemedu.com https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://pagead2.googlesyndication.com https://region1.google-analytics.com https://region1.analytics.google.com https://cdn-cookieyes.com https://log.cookieyes.com https://accounts.google.com https://*.adtrafficquality.google${process.env.NODE_ENV === 'development' ? ' http://localhost:* http://127.0.0.1:*' : ''}`,
              "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://accounts.google.com",
              "upgrade-insecure-requests",
            ].join('; ')
          },
        ]
      },
      // Next.js hashed static assets — safe to cache forever
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // Cache headers for images
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/storage/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/api/storage/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  },
  async rewrites() {
    // For server-side rewrites, prefer the internal URL (direct plain-HTTP to
    // Go Fiber on 127.0.0.1:8081) so we bypass Nginx, DNS, and SSL overhead.
    // Falls back to the public API URL for local development.
    const rawBase =
      process.env.API_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:8080';
    const apiUrl = rawBase.replace(/\/api\/?$/, '');

    return [
      {
        source: '/storage/:path*',
        destination: `${apiUrl}/storage/:path*`,
      },
      {
        source: '/assets/:path*',
        destination: `${apiUrl}/assets/:path*`,
      },
    ];
  },

};

export default nextConfig;
