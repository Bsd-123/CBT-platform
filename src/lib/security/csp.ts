/** Per-request Content-Security-Policy. Scripts are allowed by nonce, not 'unsafe-inline'. */
export function buildContentSecurityPolicy(nonce: string, isDev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Styles stay inline-friendly: React style props and Next's style tags are not nonced.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

/**
 * Policy for `/api/files/*` responses (PDFs, images, text, audio, video). They have no scripts to
 * run, and they may be framed by the app's own pages (the preview dialog) but by nobody else.
 * `object-src 'self'` lets the browser's built-in PDF viewer start inside the frame.
 */
export function buildFileResponsePolicy(): string {
  return [
    "default-src 'none'",
    "style-src 'unsafe-inline'",
    "img-src 'self' data:",
    "media-src 'self'",
    "object-src 'self'",
    "frame-ancestors 'self'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");
}

export const isFileRoute = (pathname: string) => pathname.startsWith("/api/files/");

export function createNonce(): string {
  return btoa(crypto.randomUUID());
}
