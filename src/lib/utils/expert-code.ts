const EXPERT_CODE_PATTERN = /^[0-9A-F]{8}$/;

/** e.g. d90963d6-... → #D90963D6 */
export function formatExpertCode(userId: string): string {
  const hex = userId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `#${hex}`;
}

/** Strips optional leading # and uppercases. */
export function normalizeExpertCodeInput(input: string): string {
  return input.trim().replace(/^#/, "").toUpperCase();
}

export function isValidExpertCodeFormat(code: string): boolean {
  return EXPERT_CODE_PATTERN.test(normalizeExpertCodeInput(code));
}

export function expertIdMatchesCode(userId: string, codeInput: string): boolean {
  const normalized = normalizeExpertCodeInput(codeInput);
  if (!EXPERT_CODE_PATTERN.test(normalized)) return false;
  return userId.replace(/-/g, "").toUpperCase().slice(0, 8) === normalized;
}

export function buildExpertReferralPath(code: string): string {
  const normalized = normalizeExpertCodeInput(code);
  return `/register?ref=${encodeURIComponent(normalized)}`;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Normalizes URL ref param or user input for display (e.g. #D90963D6). */
export function formatReferralInputForDisplay(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("#")) {
    return `#${normalizeExpertCodeInput(trimmed)}`;
  }

  const normalized = normalizeExpertCodeInput(trimmed);
  if (EXPERT_CODE_PATTERN.test(normalized)) {
    return `#${normalized}`;
  }

  if (UUID_PATTERN.test(trimmed)) {
    return formatExpertCode(trimmed);
  }

  return trimmed;
}
