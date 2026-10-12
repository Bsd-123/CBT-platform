/**
 * Tag colors are stored by key (e.g. "sage") and rendered as a soft background with
 * dark text of the same hue. Colors live as CSS tokens in globals.css (--tag-<key>-fg/bg).
 */
export const TAG_COLORS = [
  { key: "terracotta", label: "טרקוטה" },
  { key: "sand", label: "חול" },
  { key: "sage", label: "מרווה" },
  { key: "sea", label: "ים" },
  { key: "plum", label: "שזיף" },
  { key: "rose", label: "ורד" },
  { key: "olive", label: "זית" },
  { key: "slate", label: "צפחה" },
] as const;

export type TagColorKey = (typeof TAG_COLORS)[number]["key"];

export const DEFAULT_TAG_COLOR: TagColorKey = "sage";

const TAG_COLOR_KEYS = new Set<string>(TAG_COLORS.map((color) => color.key));

/** Hex colors written by the previous hex-based picker and the original seed data. */
const LEGACY_HEX: Record<string, TagColorKey> = {
  "#6366f1": "slate",
  "#ec4899": "rose",
  "#14b8a6": "sage",
  "#f59e0b": "sand",
  "#8b5cf6": "plum",
  "#ef4444": "terracotta",
  "#0ea5e9": "sea",
  "#84cc16": "olive",
  "#f97316": "terracotta",
  "#64748b": "slate",
};

export function isTagColorKey(value: unknown): value is TagColorKey {
  return typeof value === "string" && TAG_COLOR_KEYS.has(value);
}

/** Resolves a stored value (key or legacy hex) to a palette key. */
export function resolveTagColor(color?: string | null): TagColorKey {
  if (!color) return "slate";
  if (isTagColorKey(color)) return color;
  return LEGACY_HEX[color.toLowerCase()] ?? "slate";
}

export function getTagBadgeStyle(color?: string | null): Record<string, string> {
  const key = resolveTagColor(color);
  return {
    backgroundColor: `var(--tag-${key}-bg)`,
    color: `var(--tag-${key}-fg)`,
  };
}
