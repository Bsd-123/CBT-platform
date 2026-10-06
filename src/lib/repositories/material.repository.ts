import "server-only";
import type { MaterialApprovalStatus } from "@prisma/client";
import type {
  CreateMaterialInput,
  ListMaterialsFilter,
  PublicMaterial,
  ReviewMaterialInput,
} from "@/lib/models/material";
import { pickPublicTagFields, type PublicTag } from "@/lib/models/tag";
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
    // Public lists show approved materials only; callers opt in to the rest.
    ...(filter.approval_status
      ? { approval_status: filter.approval_status }
      : filter.include_unapproved
        ? {}
        : { approval_status: "approved" as const }),
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
  include_unapproved = false,
): Promise<PublicMaterial | null> {
  const material = await prisma.material.findFirst({
    where: {
      id,
      ...visibleContentWhere(include_hidden),
      ...(include_unapproved ? {} : { approval_status: "approved" as const }),
    },
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
    ...(filter.take !== undefined && { skip: filter.skip ?? 0, take: filter.take }),
  });

  return materials.map(pickPublicMaterialFields);
}

export async function countMaterials(filter: ListMaterialsFilter = {}): Promise<number> {
  return prisma.material.count({ where: await buildMaterialsWhere(filter) });
}

/** Visible material count per material type id, in one grouped query. */
export async function countMaterialsByType(): Promise<Record<string, number>> {
  const groups = await prisma.material.groupBy({
    by: ["material_type_id"],
    where: { ...visibleContentWhere(), approval_status: "approved" },
    _count: { _all: true },
  });
  return Object.fromEntries(groups.map((group) => [group.material_type_id, group._count._all]));
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
      ...(input.approval_status && { approval_status: input.approval_status }),
      reviewed_by: input.reviewed_by ?? null,
      reviewed_at: input.reviewed_at ?? null,
    },
    include: materialInclude,
  });

  return pickPublicMaterialFields(material);
}

/**
 * Records a decision on a pending material. The conditional update means that when
 * several experts act at once only the first decision applies; later ones fail.
 */
export async function reviewMaterial(input: ReviewMaterialInput): Promise<{
  owner_id: string;
  title: string;
}> {
  const material = await prisma.material.findUnique({
    where: { id: input.material_id },
    select: { user_id: true, title: true },
  });
  if (!material) {
    throw new Error("Material not found.");
  }

  const result = await prisma.material.updateMany({
    where: { id: input.material_id, approval_status: "pending" },
    data: {
      approval_status: input.decision,
      reviewed_by: input.reviewer_id,
      reviewed_at: new Date(),
      rejection_reason: input.decision === "rejected" ? (input.rejection_reason ?? null) : null,
    },
  });
  if (result.count === 0) {
    throw new Error("Material already reviewed.");
  }

  return { owner_id: material.user_id, title: material.title };
}

export async function countPendingMaterials(): Promise<number> {
  return prisma.material.count({
    where: { approval_status: "pending", is_hidden: false },
  });
}

export type ReviewQueueItem = PublicMaterial & { tags: PublicTag[] };

/** Materials by approval status for the expert review page (oldest pending first). */
export async function listMaterialsForReview(
  status: MaterialApprovalStatus,
  options: { skip?: number; take?: number } = {},
): Promise<{ items: ReviewQueueItem[]; total: number }> {
  const where = { approval_status: status, is_hidden: false };

  const [rows, total] = await prisma.$transaction([
    prisma.material.findMany({
      where,
      include: materialInclude,
      orderBy: { created_at: status === "pending" ? "asc" : "desc" },
      ...(options.take !== undefined && { skip: options.skip ?? 0, take: options.take }),
    }),
    prisma.material.count({ where }),
  ]);

  const links = await prisma.entityTag.findMany({
    where: { entity_type: "material", entity_id: { in: rows.map((row) => row.id) } },
    include: { tag: true },
    orderBy: { tag: { name: "asc" } },
  });
  const tagsByMaterial = new Map<string, PublicTag[]>();
  for (const link of links) {
    const list = tagsByMaterial.get(link.entity_id) ?? [];
    list.push(pickPublicTagFields(link.tag));
    tagsByMaterial.set(link.entity_id, list);
  }

  return {
    items: rows.map((row) => ({
      ...pickPublicMaterialFields(row),
      tags: tagsByMaterial.get(row.id) ?? [],
    })),
    total,
  };
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
  approvalStatus: MaterialApprovalStatus;
  uploader: { id: string; full_name: string } | null;
  tags: { id: string; name: string }[];
};

export async function listMaterialsForAdmin(
  filter: ListMaterialsFilter = {},
  limit = 50,
  offset = 0,
): Promise<{ items: AdminMaterialItem[]; total: number }> {
  const where = await buildMaterialsWhere({
    ...filter,
    include_hidden: true,
    include_unapproved: true,
  });

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
    approvalStatus: m.approval_status,
    uploader: m.user ? { id: m.user.id, full_name: m.user.full_name } : null,
    tags: tagsByMaterial.get(m.id) ?? [],
  }));

  return { items: normalized, total };
}
