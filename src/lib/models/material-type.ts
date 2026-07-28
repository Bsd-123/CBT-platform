import type { MaterialType, MaterialTypeKey } from "@prisma/client";

export type { MaterialType, MaterialTypeKey };

export const MATERIAL_TYPE_KEYS: readonly MaterialTypeKey[] = [
  "game",
  "reading",
  "worksheet",
  "treatment_plan",
  "presentation",
  "video",
] as const;

export type CreateMaterialTypeInput = {
  key: MaterialTypeKey;
  label: string;
  icon?: string | null;
};

export type UpdateMaterialTypeInput = {
  label?: string;
  icon?: string | null;
};

export function pickPublicMaterialTypeFields(materialType: MaterialType) {
  return {
    id: materialType.id,
    key: materialType.key,
    label: materialType.label,
    icon: materialType.icon,
  };
}

export type PublicMaterialType = ReturnType<typeof pickPublicMaterialTypeFields>;
