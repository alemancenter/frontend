export interface AdPageContext {
  /** Character count of the main text content on the page. */
  contentLength?: number;
  /** False when content is draft / unapproved / restricted. Undefined = assume approved. */
  hasApprovedContent?: boolean;
  /** Login, register, verify-email, forgot-password pages. */
  isAuthPage?: boolean;
  /** Any /dashboard/* route. */
  isDashboard?: boolean;
  /** 404, 500, or other error pages. */
  isErrorPage?: boolean;
  /** Search result page that returned 0 results. */
  isSearchEmpty?: boolean;
  /** Page contains content flagged as policy-sensitive or restricted. */
  hasPolicyRisk?: boolean;
}

/**
 * Central gate: returns true only when the page is safe and rich enough
 * to display ads under Google Publisher Policy.
 *
 * Blocks:
 * - Auth / dashboard / error pages (no editorial content)
 * - Unapproved or restricted content
 * - Empty search results
 * - Pages with fewer than 600 characters of body text
 */
export function shouldShowAds(ctx: AdPageContext): boolean {
  if (ctx.isAuthPage || ctx.isDashboard || ctx.isErrorPage || ctx.hasPolicyRisk) return false;
  if (ctx.hasApprovedContent === false) return false;
  if (ctx.isSearchEmpty) return false;
  if ((ctx.contentLength ?? Infinity) < 600) return false;
  return true;
}

/**
 * Returns the maximum number of ad slots allowed for the given content length.
 *
 * Google's "Valuable Inventory" policy requires that ads never outweigh content.
 *
 * | Content length | Ad limit |
 * |----------------|----------|
 * | < 600 chars    | 0        |
 * | 600–1 499      | 1        |
 * | 1 500–2 999    | 2        |
 * | ≥ 3 000        | 3 (max)  |
 */
export function getAdLimit(contentLength: number): 0 | 1 | 2 | 3 {
  if (contentLength < 600) return 0;
  if (contentLength < 1500) return 1;
  if (contentLength < 3000) return 2;
  return 3;
}
