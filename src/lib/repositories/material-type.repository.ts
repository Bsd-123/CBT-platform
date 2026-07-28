import type {
  CreateMaterialTypeInput,
  MaterialTypeKey,
  PublicMaterialType,
  UpdateMaterialTypeInput,
} from "@/lib/models/material-type";
import {
  MATERIAL_TYPE_KEYS,
  pickPublicMaterialTypeFields,
} from "@/lib/models/material-type";
import { prisma } from "@/lib/db";

export async function listMaterialTypes(): Promise<PublicMaterialType[]> {
  const materialTypes = await prisma.materialType.findMany({
    orderBy: { label: "asc" },
  });

  return materialTypes.map(pickPublicMaterialTypeFields);
}

export async function getMaterialTypeById(
  id: string,
): Promise<PublicMaterialType | null> {
  const materialType = await prisma.materialType.findUnique({ where: { id } });
  return materialType ? pickPublicMaterialTypeFields(materialType) : null;
}

export async function getMaterialTypeByKey(
  key: MaterialTypeKey,
): Promise<PublicMaterialType | null> {
  const materialType = await prisma.materialType.findUnique({ where: { key } });
  return materialType ? pickPublicMaterialTypeFields(materialType) : null;
}

export async function createMaterialType(
  input: CreateMaterialTypeInput,
): Promise<PublicMaterialType> {
  const existing = await prisma.materialType.findUnique({ where: { key: input.key } });
  if (existing) {
    throw new Error("Material type key already exists.");
  }

  const materialType = await prisma.materialType.create({
    data: {
      key: input.key,
      label: input.label.trim(),
      icon: input.icon?.trim() || null,
    },
  });

  return pickPublicMaterialTypeFields(materialType);
}

export async function updateMaterialType(
  id: string,
  input: UpdateMaterialTypeInput,
): Promise<PublicMaterialType> {
  const materialType = await prisma.materialType.update({
    where: { id },
    data: {
      ...(input.label !== undefined && { label: input.label.trim() }),
      ...(input.icon !== undefined && { icon: input.icon?.trim() || null }),
    },
  });

  return pickPublicMaterialTypeFields(materialType);
}

export async function deleteMaterialType(id: string): Promise<void> {
  const materialCount = await prisma.material.count({
    where: { material_type_id: id },
  });

  if (materialCount > 0) {
    throw new Error("Cannot delete a material type that is in use.");
  }

  await prisma.materialType.delete({ where: { id } });
}

export async function listAvailableMaterialTypeKeys(): Promise<MaterialTypeKey[]> {
  const used = await prisma.materialType.findMany({ select: { key: true } });
  const usedKeys = new Set(used.map((item) => item.key));
  return MATERIAL_TYPE_KEYS.filter((key) => !usedKeys.has(key));
}
