const APP_TIME_ZONE = "Asia/Jerusalem";

/** Short Hebrew date for timestamps (created_at), rendered in a fixed zone for SSR/CSR parity. */
export function formatDate(value: Date | string): string {
  return new Date(value).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
  });
}

/** "1 תשובה" / "3 תשובות": count with the matching singular or plural noun. */
export function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
