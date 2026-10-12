/**
 * Public contact address shown on the contact and accessibility pages. Set
 * NEXT_PUBLIC_CONTACT_EMAIL; until then the pages point members to the admins on the platform.
 */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null;

/** When the legal pages were last revised (shown at the top of each). */
export const LEGAL_UPDATED = "13 באוקטובר 2026";
