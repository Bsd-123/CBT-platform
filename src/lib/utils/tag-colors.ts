export const TAG_COLOR_PRESETS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#0ea5e9",
  "#84cc16",
  "#f97316",
  "#64748b",
] as const;

function getReadableTextColor(background: string): string {
  const hex = background.replace("#", "");
  if (hex.length !== 6) return "#1a1d23";
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance > 0.62 ? "#1a1d23" : "#ffffff";
}

export function getTagBadgeStyle(color?: string | null): Record<string, string> {
  const background = color ?? "#e8edf3";
  return {
    backgroundColor: background,
    color: getReadableTextColor(background),
  };
}
