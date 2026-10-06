import "server-only";
import type {
  CreateMaterialInput,
  ListMaterialsFilter,
  PublicMaterial,
} from "@/lib/models/material";
import { pickPublicMaterialFields } from "@/lib/models/material";
import { prisma } from "@/lib/db";
import { visibleContentWhere } from "@/lib/db/visibility";

const materialInclude = {
  user: true,
  material_type: true,
} as const;

async function getMaterialIdsWithAllTags(tagIds: string[]): Promise<string[]> {
  if (tagIds.length === 0) return [];

  const entityTags = await prisma.entityTag.findMany({
    where: {
      entity_type: "material",
      tag_id: { in: tagIds },
    },
    select: { entity_id: true, tag_id: true },
  });

  const tagsByMaterial = new Map<string, Set<string>>();
  for (const entityTag of entityTags) {
    const current = tagsByMaterial.get(entityTag.entity_id) ?? new Set<string>();
    current.add(entityTag.tag_id);
    tagsByMaterial.set(entityTag.entity_id, current);
  }

  return [...tagsByMaterial.entries()]
    .filter(([, materialTagIds]) => tagIds.every((tagId) => materialTagIds.has(tagId)))
    .map(([materialId]) => materialId);
}

async function buildMaterialsWhere(filter: ListMaterialsFilter) {
  const tagIds = filter.tag_ids?.filter(Boolean) ?? [];
  const materialIdsForTags =
    tagIds.length > 0 ? await getMaterialIdsWithAllTags(tagIds) : undefined;

  return {
    ...visibleContentWhere(filter.include_hidden),
    ...(filter.material_type_id && {
      material_type_id: filter.material_type_id,
    }),
    ...(filter.material_type_key && {
      material_type: { key: filter.material_type_key },
    }),
    ...(filter.user_id && { user_id: filter.user_id }),
    ...(filter.search?.trim() && {
      OR: [
        { title: { contains: filter.search.trim(), mode: "insensitive" as const } },
        { description: { contains: filter.search.trim(), mode: "insensitive" as const } },
      ],
    }),
    ...(materialIdsForTags !== undefined && {
      id: { in: materialIdsForTags.length > 0 ? materialIdsForTags : [] },
    }),
  };
}

export async function getMaterialById(
  id: string,
  include_hidden = false,
): Promise<PublicMaterial | null> {
  const material = await prisma.material.findFirst({
    where: { id, ...visibleContentWhere(include_hidden) },
    include: materialInclude,
  });

  return material ? pickPublicMaterialFields(material) : null;
}

export async function listMaterials(
  filter: ListMaterialsFilter = {},
): Promise<PublicMaterial[]> {
  const materials = await prisma.material.findMany({
    where: await buildMaterialsWhere(filter),
    include: materialInclude,
    orderBy: { created_at: "desc" },
  });

  return materials.map(pickPublicMaterialFields);
}

export async function createMaterial(
  input: CreateMaterialInput,
): Promise<PublicMaterial> {
  const material = await prisma.material.create({
    data: {
      user_id: input.user_id,
      title: input.title,
      description: input.description,
      file_url: input.file_url,
      material_type_id: input.material_type_id,
    },
    include: materialInclude,
  });

  return pickPublicMaterialFields(material);
}

export async function deleteMaterial(id: string): Promise<void> {
  await prisma.material.delete({ where: { id } });
}

// Admin-facing listing with pagination and hidden content included
export type AdminMaterialItem = {
  id: string;
  title: string;
  createdAt: Date;
  isHidden: boolean;
  uploader: { id: string; full_name: string } | null;
  tags: { id: string; name: string }[];
};

export async function listMaterialsForAdmin(
  filter: ListMaterialsFilter = {},
  limit = 50,
  offset = 0,
): Promise<{ items: AdminMaterialItem[]; total: number }> {
  const where = await buildMaterialsWhere({ ...filter, include_hidden: true });

  const [items, total] = await prisma.$transaction([
    prisma.material.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { created_at: "desc" },
      include: {
        user: { select: { id: true, full_name: true } },
      },
    }),
    prisma.material.count({ where }),
  ]);

  const tagLinks = await prisma.entityTag.findMany({
    where: { entity_type: "material", entity_id: { in: items.map((m) => m.id) } },
    include: { tag: { select: { id: true, name: true } } },
  });
  const tagsByMaterial = new Map<string, { id: string; name: string }[]>();
  for (const link of tagLinks) {
    const list = tagsByMaterial.get(link.entity_id) ?? [];
    list.push(link.tag);
    tagsByMaterial.set(link.entity_id, list);
  }

  const normalized: AdminMaterialItem[] = items.map((m) => ({
    id: m.id,
    title: m.title,
    createdAt: m.created_at,
    isHidden: m.is_hidden,
    uploader: m.user ? { id: m.user.id, full_name: m.user.full_name } : null,
    tags: tagsByMaterial.get(m.id) ?? [],
  }));

  return { items: normalized, total };
}
