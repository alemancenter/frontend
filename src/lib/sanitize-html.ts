const dangerousTags = /<\s*(script|style|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>|<\s*(script|style|object|embed|link|meta)[^>]*\/?>/gi;
const dangerousAttrs = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const dangerousUrls = /\s+(href|src)\s*=\s*(["'])\s*(javascript:|data:text\/html)[\s\S]*?\2/gi;

// --- External link processing ---

const BLOCKED_HOST_KEYWORDS = [
  // Gambling
  'bet365', 'betway', '888casino', 'pokerstars', 'bovada', 'betsafe',
  'unibet', 'williamhill', 'ladbrokes', 'paddypower', 'skybet', 'betfair',
  'draftkings', 'fanduel', 'betmgm', 'betonline', 'mybookie', 'bwin', 'partypoker',
  'caesarssports', 'pointsbet',
  // Adult
  'pornhub', 'xvideos', 'xnxx', 'redtube', 'youporn', 'tube8', 'brazzers',
  'bangbros', 'xhamster', 'spankbang', 'eporner', 'tnaflix', 'sunporno',
  // Warez / piracy
  'thepiratebay', 'piratebay', '1337x', 'rarbg', 'rutracker', 'torrentz2',
  'eztv', 'zooqle', 'cpasbien', '0daydown',
  // Suspicious monetising shorteners (redirect abuse / malware gateways)
  'adf.ly', 'bc.vc', 'sh.st', 'shorte.st', 'viralurl.com', '5z8.info', 'zzb.bz',
];

const blockedHostRe = new RegExp(
  '(' + BLOCKED_HOST_KEYWORDS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')',
  'i',
);

function isExternalHref(href: string): boolean {
  if (
    !href || href === '#' ||
    href.startsWith('#') || href.startsWith('/') ||
    href.startsWith('mailto:') || href.startsWith('tel:')
  ) return false;
  try {
    const { protocol } = new URL(href);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

function isBlockedHref(href: string): boolean {
  try {
    return blockedHostRe.test(new URL(href).hostname);
  } catch {
    return false;
  }
}

/**
 * Processes every <a> tag in the HTML string:
 * - Blocked domains → href replaced with "#"
 * - All external links → target="_blank" rel="noopener noreferrer"
 * Internal / relative / anchor links are left untouched.
 */
function processExternalLinks(html: string): string {
  return html.replace(/<a\b([^>]*)>/gi, (_tag, attrs: string) => {
    const hrefMatch = attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/i);
    if (!hrefMatch) return `<a${attrs}>`;

    const href = hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3] ?? '';
    if (!isExternalHref(href)) return `<a${attrs}>`;

    const finalHref = isBlockedHref(href) ? '#' : href;

    const cleanAttrs = attrs
      .replace(/\bhref\s*=\s*(?:"[^"]*"|'[^']*'|\S+)/gi, '')
      .replace(/\s*\brel\s*=\s*(?:"[^"]*"|'[^']*'|\S+)/gi, '')
      .replace(/\s*\btarget\s*=\s*(?:"[^"]*"|'[^']*'|\S+)/gi, '')
      .trim();

    const attrStr = cleanAttrs ? ` ${cleanAttrs}` : '';
    return `<a${attrStr} href="${finalHref}" target="_blank" rel="noopener noreferrer">`;
  });
}

export function sanitizeRichHtml(input: string, trustedIframeHosts: string[] = []) {
  let html = String(input || '');

  html = html.replace(dangerousTags, '');
  html = html.replace(dangerousAttrs, '');
  html = html.replace(dangerousUrls, ' $1="#"');

  html = html.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, (iframe) => {
    const srcMatch = iframe.match(/\s+src\s*=\s*(["'])(.*?)\1/i);
    if (!srcMatch) return '';

    try {
      const host = new URL(srcMatch[2]).hostname;
      if (!trustedIframeHosts.includes(host)) return '';
    } catch {
      return '';
    }

    return iframe
      .replace(dangerousAttrs, '')
      .replace(dangerousUrls, ' $1="#"')
      .replace(/\s+sandbox\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace('<iframe', '<iframe sandbox="allow-scripts allow-same-origin allow-presentation"');
  });

  return processExternalLinks(html);
}
