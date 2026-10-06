/**
 * Accepts only same-origin relative paths. Rejects protocol-relative ("//host"),
 * backslash ("/\host") and control-character forms that browsers may normalise
 * into an external URL.
 */
export function isSafeRedirectPath(value: string): boolean {
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//") || value.startsWith("/\\")) return false;
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code < 0x20 || code === 0x7f || char === "\\") return false;
  }
  return true;
}
