/**
 * Internal Fetch Utility for SSR
 *
 * Handles HTTPS requests to the internal API (localhost) with:
 * - SSL certificate bypass (for self-signed certs on localhost)
 * - Proper SNI (Server Name Indication) for Nginx virtual host routing
 * - Host header injection for correct backend routing
 *
 * This enables fast server-to-server communication without DNS/external SSL overhead.
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';
import { getApiHostname } from './config';

interface InternalFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

interface InternalFetchResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  text: () => Promise<string>;
  json: () => Promise<any>;
}

/**
 * Check if internal SSL bypass is enabled
 */
function shouldBypassSSL(): boolean {
  return process.env.NODE_TLS_REJECT_UNAUTHORIZED_INTERNAL === '0';
}

/**
 * Get the API hostname for SNI and Host header
 */
function getHostname(): string {
  return process.env.API_HOSTNAME || getApiHostname();
}

/**
 * Custom fetch for internal API requests
 * Uses Node.js https module with custom agent for SSL bypass and SNI
 */
export function internalFetch(
  url: string,
  options: InternalFetchOptions = {}
): Promise<InternalFetchResponse> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const hostname = getHostname();

    const requestOptions: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        ...options.headers,
        'Host': hostname, // Critical: Nginx uses this for virtual host routing
      },
      timeout: options.timeout || 10000,
    };

    // For HTTPS requests to localhost, bypass SSL and set SNI
    if (isHttps && shouldBypassSSL()) {
      requestOptions.rejectUnauthorized = false; // Bypass self-signed cert
      requestOptions.servername = hostname; // SNI for correct certificate matching
    }

    const protocol = isHttps ? https : http;

    const req = protocol.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        // Convert headers to simple object
        const responseHeaders: Record<string, string> = {};
        for (const [key, value] of Object.entries(res.headers)) {
          if (typeof value === 'string') {
            responseHeaders[key] = value;
          } else if (Array.isArray(value)) {
            responseHeaders[key] = value.join(', ');
          }
        }

        const response: InternalFetchResponse = {
          ok: res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode || 0,
          statusText: res.statusMessage || '',
          headers: responseHeaders,
          text: async () => data,
          json: async () => JSON.parse(data),
        };

        resolve(response);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    // Send body if present
    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Check if we should use internal fetch for this URL.
 * internalFetch is only useful for HTTPS localhost (SSL-bypass for self-signed certs).
 * For plain HTTP to localhost, standard fetch handles everything correctly:
 * proper header forwarding, Next.js data-cache (next.revalidate), and the
 * undici User-Agent triggers FrontendGuard tier-2 (IsSSRUserAgent).
 */
export function shouldUseInternalFetch(url: string): boolean {
  if (typeof window !== 'undefined') return false;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:') return false;

    const hostname = parsedUrl.hostname;
    return hostname === 'localhost' ||
           hostname === '127.0.0.1' ||
           hostname.startsWith('192.168.') ||
           hostname.startsWith('10.');
  } catch {
    return false;
  }
}

/**
 * Universal fetch that uses internal fetch for localhost HTTPS
 * and standard fetch for everything else
 */
export async function universalFetch(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  // Check if we should use internal fetch (localhost with SSL bypass)
  if (shouldUseInternalFetch(url)) {
    try {
      // Convert RequestInit to InternalFetchOptions
      const internalOptions: InternalFetchOptions = {
        method: options.method,
        headers: options.headers as Record<string, string>,
        body: options.body as string,
        timeout: options.timeout,
      };

      const response = await internalFetch(url, internalOptions);

      // Convert to standard Response-like object
      // Note: This is a simplified Response that works for our use case
      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers),
        text: response.text,
        json: response.json,
        // Add other Response methods as needed
        clone: () => { throw new Error('clone not implemented'); },
        blob: () => { throw new Error('blob not implemented'); },
        arrayBuffer: () => { throw new Error('arrayBuffer not implemented'); },
        formData: () => { throw new Error('formData not implemented'); },
        bytes: () => { throw new Error('bytes not implemented'); },
        body: null,
        bodyUsed: false,
        redirected: false,
        type: 'basic' as ResponseType,
        url: url,
      } as unknown as Response;
    } catch (error) {
      // If internal fetch fails, fall back to standard fetch
      console.warn('[Internal Fetch] Failed, falling back to standard fetch:', error);
    }
  }

  // Use standard fetch for non-localhost or as fallback
  return fetch(url, options);
}
