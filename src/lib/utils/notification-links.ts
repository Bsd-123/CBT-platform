const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Where a notification should take the user, or null when it has no target. */
export function getNotificationHref(
  referenceType: string | null | undefined,
  referenceId: string | null | undefined,
): string | null {
  if (!referenceType || !referenceId || !UUID_PATTERN.test(referenceId)) return null;

  switch (referenceType) {
    case "forum":
      return `/forum/${referenceId}`;
    case "recommendation":
      return `/recommendations#rec-${referenceId}`;
    case "event":
      return `/events/${referenceId}`;
    case "professional_request":
      return `/professional-requests/${referenceId}`;
    case "material":
      return `/materials/${referenceId}`;
    case "material_request":
      return `/materials/requests/${referenceId}#responses`;
    default:
      return null;
  }
}
