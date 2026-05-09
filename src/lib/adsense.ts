const SCRIPT_TAG_PATTERN = /<script\b[^>]*>[\s\S]*?<\/script>/gi;

// ── Structured ad slot config (new format) ───────────────────────────────────

export interface AdSlotConfig {
  ad_slot: string;
  format: string;
  responsive: boolean;
}

const AD_ALLOWED_KEYS = new Set(['ad_slot', 'format', 'responsive']);

/**
 * Parse a stored ad setting value into a typed AdSlotConfig.
 * The stored format is JSON: {"ad_slot":"123","format":"auto","responsive":true}
 * Returns null for empty, invalid, or unsafe values.
 */
export function parseAdSlotConfig(raw: string): AdSlotConfig | null {
  const trimmed = (raw || '').trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    for (const key of Object.keys(parsed)) {
      if (!AD_ALLOWED_KEYS.has(key)) return null;
    }
    const slot = typeof parsed.ad_slot === 'string' ? parsed.ad_slot.trim() : '';
    if (!slot) return null;
    return {
      ad_slot: slot,
      format: typeof parsed.format === 'string' ? parsed.format : 'auto',
      responsive: typeof parsed.responsive === 'boolean' ? parsed.responsive : true,
    };
  } catch {
    return null;
  }
}

/** Serialize a slot ID into the stored JSON format. Returns '' for empty input. */
export function buildAdSlotValue(slotId: string): string {
  const id = (slotId || '').trim();
  if (!id) return '';
  return JSON.stringify({ ad_slot: id, format: 'auto', responsive: true });
}

/** Extract just the slot ID from a stored JSON value, for dashboard inputs. */
export function extractSlotId(raw: string): string {
  return parseAdSlotConfig(raw)?.ad_slot ?? '';
}

// ── Legacy helpers (kept for backward compatibility) ─────────────────────────

export type AdType = 'adsense' | 'script' | 'empty';

export interface ScriptInfo {
  src: string | null;
  async: boolean;
  referrerPolicy: string;
  crossOrigin: string | null;
  content: string;
}

/** Detect whether ad code is AdSense (<ins>), plain script injection, or empty */
export function detectAdType(rawCode: string): AdType {
  const decoded = decodeAdSnippet(rawCode);
  if (!decoded) return 'empty';
  if (/<ins\b[^>]*class="adsbygoogle"/i.test(decoded)) return 'adsense';
  if (/<script\b/i.test(decoded)) return 'script';
  return 'empty';
}

/** Extract all <script> tags from ad code into structured objects */
export function extractScripts(rawCode: string): ScriptInfo[] {
  const decoded = decodeAdSnippet(rawCode);
  if (!decoded) return [];

  const results: ScriptInfo[] = [];
  const pattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(decoded)) !== null) {
    const attrs = match[1];
    const content = match[2].trim();
    const srcMatch = attrs.match(/src=["']([^"']*)["']/i);
    results.push({
      src: srcMatch ? srcMatch[1] : null,
      async: /\basync\b/i.test(attrs),
      referrerPolicy: (attrs.match(/referrerpolicy=["']([^"']*)["']/i) || [])[1] || '',
      crossOrigin: (attrs.match(/crossorigin=["']([^"']*)["']/i) || [])[1] || null,
      content,
    });
  }

  return results;
}

/**
 * Get or create the adsbygoogle queue.
 *
 * CRITICAL: After Google's adsbygoogle.js loads, it replaces window.adsbygoogle
 * with a custom proxy object that has a push() method but is NOT a native Array.
 * Using Array.isArray() would return false and cause us to overwrite Google's
 * object with a plain [], destroying the entire ad processing system.
 *
 * We follow Google's exact recommended pattern:
 *   (window.adsbygoogle = window.adsbygoogle || [])
 */
const getAdsQueue = (): { push: (obj: Record<string, unknown>) => void } | null => {
  if (typeof window === 'undefined') return null;

  const win = window as Window & { adsbygoogle?: any };
  win.adsbygoogle = win.adsbygoogle || [];
  return win.adsbygoogle;
};

const isSlotInitialized = (slot: HTMLElement): boolean =>
  slot.dataset.adUnitInitialized === '1' || slot.hasAttribute('data-adsbygoogle-status');

/**
 * Check if an ad slot is visible to the user.
 * Uses offsetParent to detect ancestors with display:none — this is the
 * standard DOM way to determine effective visibility without walking the tree.
 *
 * Note: offsetParent is null for position:fixed elements too, but ad slots
 * should never be position:fixed so this is safe.
 */
const isSlotVisible = (slot: HTMLElement): boolean => {
  if (typeof window === 'undefined') return false;
  if (!slot.isConnected) return false;

  // offsetParent is null when the element or any ancestor has display:none.
  // This correctly handles the mobile/desktop hidden pattern where a parent
  // div uses Tailwind's "hidden md:block" or "block md:hidden".
  if (slot.offsetParent === null) {
    // Exception: the <body> or <html> element has offsetParent === null,
    // and position:fixed elements do too. Check the slot's own style.
    const style = window.getComputedStyle(slot);
    if (style.position === 'fixed') return true;
    return false;
  }

  const style = window.getComputedStyle(slot);
  if (style.visibility === 'hidden') return false;

  return true;
};

export function decodeAdSnippet(rawCode: string): string {
  const trimmed = rawCode.trim();
  if (!trimmed) return '';
  if (!trimmed.startsWith('__B64__')) return trimmed;

  const encoded = trimmed.slice(7);
  if (!encoded) return '';

  try {
    if (typeof atob === 'function') return atob(encoded).trim();
  } catch {
    return '';
  }

  return '';
}

export function normalizeAdSnippet(rawCode: string): string {
  const decoded = decodeAdSnippet(rawCode);
  if (!decoded) return '';

  // The snippet scripts are loaded globally from RootLayout and pushed manually per <ins>.
  const withoutScripts = decoded.replace(SCRIPT_TAG_PATTERN, '').trim();
  // Strip event handler attributes (on* = "...") to prevent XSS via database-supplied ad code.
  const withoutHandlers = withoutScripts.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');
  return withoutHandlers;
}

export function initializeAdSlots(
  container: HTMLElement,
  options?: { maxAttempts?: number; intervalMs?: number }
): () => void {
  const adSlots = Array.from(container.querySelectorAll<HTMLElement>('ins.adsbygoogle'));
  if (!adSlots.length) return () => {};

  const maxAttempts = options?.maxAttempts ?? 25;
  const intervalMs = options?.intervalMs ?? 300;

  let attempts = 0;
  let disposed = false;
  let timer: number | null = null;

  const tryInitialize = (): boolean => {
    attempts += 1;
    const queue = getAdsQueue();

    if (!queue) return attempts >= maxAttempts;

    for (const slot of adSlots) {
      if (isSlotInitialized(slot) || !isSlotVisible(slot)) continue;

      try {
        queue.push({});
        slot.dataset.adUnitInitialized = '1';
      } catch {
        // Keep trying until maxAttempts is reached.
      }
    }

    const allInitialized = adSlots.every((slot) => !isSlotVisible(slot) || isSlotInitialized(slot));
    return allInitialized || attempts >= maxAttempts;
  };

  if (!tryInitialize()) {
    timer = window.setInterval(() => {
      if (disposed) return;
      if (tryInitialize() && timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    }, intervalMs);
  }

  return () => {
    disposed = true;
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  };
}
