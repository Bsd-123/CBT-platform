import type { MaterialTypeKey } from "@prisma/client";

const TYPE_ICONS: Record<MaterialTypeKey, string> = {
  game: "extension",
  reading: "auto_stories",
  worksheet: "description",
  treatment_plan: "fact_check",
  presentation: "slideshow",
  video: "video_library",
};

const TYPE_BADGE_VARIANT: Record<MaterialTypeKey, "secondary" | "tertiary" | "neutral"> = {
  game: "secondary",
  reading: "tertiary",
  worksheet: "secondary",
  treatment_plan: "neutral",
  presentation: "tertiary",
  video: "neutral",
};

export function getMaterialTypeIcon(key: MaterialTypeKey | undefined): string {
  if (!key) return "grid_view";
  return TYPE_ICONS[key] ?? "description";
}

export function getMaterialTypeBadgeVariant(
  key: MaterialTypeKey | undefined,
): "secondary" | "tertiary" | "neutral" {
  if (!key) return "neutral";
  return TYPE_BADGE_VARIANT[key] ?? "neutral";
}
