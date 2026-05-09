import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatCurrency(amount: number, currency = 'SAR'): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  const precision = size >= 100 ? 0 : size >= 10 ? 1 : 2;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
}

export function getStorageUrl(path: string | undefined | null): string | undefined {
  if (!path) return undefined;

  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const url = new URL(path);
      // Normalize any backend storage absolute URL to a relative /storage/... path
      // so the Next.js internal rewrite proxies it directly to Go Fiber (bypasses
      // DNS/SSL and works even after a domain migration like alemancenter→alemedu).
      if (url.pathname.startsWith('/storage/')) {
        return url.pathname;
      }
      // Local dev server URLs → return pathname as relative path
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return url.pathname;
      }
    } catch {
      // fall through
    }
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (
    normalizedPath.startsWith('/_next/') ||
    normalizedPath.startsWith('/assets/') ||
    normalizedPath.startsWith('/api/')
  ) {
    return normalizedPath;
  }

  // Already has the /storage/ prefix → return as-is
  if (normalizedPath.startsWith('/storage/')) {
    return normalizedPath;
  }

  return `/storage${normalizedPath}`;
}

export function safeJsonLd(json: any): string {
  return JSON.stringify(json).replace(/</g, '\\u003c');
}

export function extractError(err: unknown) {
  if (err && typeof err === 'object') {
    const e = err as any;
    return {
      status: e.status ?? e.response?.status ?? undefined,
      message: e.message ?? e.response?.data?.message ?? 'تعذر تنفيذ العملية',
      errors: e.errors ?? e.response?.data?.errors ?? undefined,
      name: e.name ?? undefined,
    };
  }
  return { message: String(err || 'حدث خطأ غير متوقع') };
}
