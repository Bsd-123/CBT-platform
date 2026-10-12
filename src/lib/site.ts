/**
 * Public contact address shown on the contact and accessibility pages. Set
 * NEXT_PUBLIC_CONTACT_EMAIL; until then the pages point members to the admins on the platform.
 */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null;

/** When the legal pages were last revised (shown at the top of each). */
export const LEGAL_UPDATED = "13 באוקטובר 2026";

/**
 * Details the accessibility statement must name (Israeli accessibility regulations, reg. 35).
 * Fill these in before launch; while any is null the statement shows a placeholder and a draft notice.
 */
export const ACCESSIBILITY = {
  /** Legal name of whoever runs the site (person or company). */
  owner: null as string | null,
  coordinatorName: null as string | null,
  coordinatorPhone: null as string | null,
  /** Falls back to the general contact address. */
  coordinatorEmail: CONTACT_EMAIL,
  /** Postal address for written requests; optional. */
  coordinatorAddress: null as string | null,
  /** Date of the last professional accessibility audit, e.g. "1 בינואר 2027"; null if none yet. */
  auditDate: null as string | null,
};

/** Enable (enable.co.il) accessibility toolbar, loaded on every page. Licensed per domain. */
export const ENABLE_SCRIPT_SRC =
  "https://cdn.enable.co.il/licenses/enable-L56452cptyhavw5t-1026-83992/init.js";
