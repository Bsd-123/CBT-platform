import "server-only";
import type {
  CreateMaterialInput,
  ListMaterialsFilter,
  PublicMaterial,
  ReviewMaterialInput,
} from "@/lib/models/material";
import { pickPublicMaterialFields } from "@/lib/models/material";
import type { PublicTag } from "@/lib/models/tag";
import { countOf, getDb, row, rows } from "@/lib/db/client";
import { ilikeAny } from "@/lib/db/search";
import type { EntityTag, Material, MaterialApprovalStatus, MaterialType, User } from "@/lib/db/types";
import { listEntityTagsForEntities } from "@/lib/repositories/tag.repository";

type MaterialRow = Material & { user: User; material_type: MaterialType };

// `!inner` lets a query filter on the material type (e.g. by key) as well as embed it.
const MATERIAL_SELECT = "*, user:users(*), material_type:material_types!inner(*)";

async function getMaterialIdsWithAllTags(tagIds: string[]): Promise<string[]> {
  if (tagIds.length === 0) return [];

  const db = await getDb();
  const entityTags = rows<Pick<EntityTag, "entity_id" | "tag_id">>(
    await db
      .from("entity_tags")
      .select("entity_id, tag_id")
      .eq("entity_type", "material")
      .in("tag_id", tagIds),
  );

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

/** Starts a materials query with `filter` applied; callers add ordering/paging. */
async function filteredMaterials(
  filter: ListMaterialsFilter,
  select: string,
  options?: { count: "exact"; head?: boolean },
) {
  const db = await getDb();
  const tagIds = filter.tag_ids?.filter(Boolean) ?? [];
  const idsForTags = tagIds.length > 0 ? await getMaterialIdsWithAllTags(tagIds) : undefined;

  let query = db.from("materials").select(select, options);
  if (!filter.include_hidden) query = query.eq("is_hidden", false);

  // Public lists show approved materials only; callers opt in to the rest.
  if (filter.approval_status) {
    query = query.eq("approval_status", filter.approval_status);
  } else if (!filter.include_unapproved) {
    query = query.eq("approval_status", "approved");
  }

  if (filter.material_type_id) query = query.eq("material_type_id", filter.material_type_id);
  if (filter.material_type_key) query = query.eq("material_type.key", filter.material_type_key);
  if (filter.user_id) query = query.eq("user_id", filter.user_id);
  if (filter.search?.trim()) query = query.or(ilikeAny(["title", "description"], filter.search));
  if (idsForTags !== undefined) query = query.in("id", idsForTags);
  // Wrapped: returning the (thenable) builder itself from an async function would run it.
  return { query };
}

export async function getMaterialById(
  id: string,
  include_hidden = false,
  include_unapproved = false,
): Promise<PublicMaterial | null> {
  const db = await getDb();
  let query = db.from("materials").select(MATERIAL_SELECT).eq("id", id);
  if (!include_hidden) query = query.eq("is_hidden", false);
  if (!include_unapproved) query = query.eq("approval_status", "approved");

  const material = row<MaterialRow>(await query.maybeSingle());
  return material ? pickPublicMaterialFields(material) : null;
}

export async function listMaterials(filter: ListMaterialsFilter = {}): Promise<PublicMaterial[]> {
  let { query } = await filteredMaterials(filter, MATERIAL_SELECT);
  query = query.order("created_at", { ascending: false });
  if (filter.take !== undefined) {
    const skip = filter.skip ?? 0;
    query = query.range(skip, skip + filter.take - 1);
  }
  return rows<MaterialRow>(await query).map(pickPublicMaterialFields);
}

export async function countMaterials(filter: ListMaterialsFilter = {}): Promise<number> {
  const select = filter.material_type_key ? "id, material_type:material_types!inner(key)" : "id";
  const { query } = await filteredMaterials(filter, select, { count: "exact", head: true });
  return countOf(await query);
}

/** Visible material count per material type id. */
export async function countMaterialsByType(): Promise<Record<string, number>> {
  const db = await getDb();
  const materials = rows<{ material_type_id: string }>(
    await db
      .from("materials")
      .select("material_type_id")
      .eq("is_hidden", false)
      .eq("approval_status", "approved"),
  );
  const counts: Record<string, number> = {};
  for (const { material_type_id } of materials) counts[material_type_id] = (counts[material_type_id] ?? 0) + 1;
  return counts;
}

/**
 * Row Level Security decides what the uploader may set: regular members can only create
 * pending materials; experts and admins may create approved ones with themselves as reviewer.
 */
export async function createMaterial(input: CreateMaterialInput): Promise<PublicMaterial> {
  const db = await getDb();
  const material = row<MaterialRow>(
    await db
      .from("materials")
      .insert({
        user_id: input.user_id,
        title: input.title,
        description: input.description,
        file_url: input.file_url,
        material_type_id: input.material_type_id,
        ...(input.approval_status && { approval_status: input.approval_status }),
        reviewed_by: input.reviewed_by ?? null,
        reviewed_at: input.reviewed_at?.toISOString() ?? null,
      })
      .select(MATERIAL_SELECT)
      .single(),
  );
  return pickPublicMaterialFields(material!);
}

/**
 * Records a decision on a pending material through `review_material`, which checks the
 * caller is an expert/admin, applies only the first decision, and notifies the uploader.
 */
export async function reviewMaterial(
  input: ReviewMaterialInput,
): Promise<{ owner_id: string; title: string }> {
  const db = await getDb();
  const result = await db.rpc("review_material", {
    p_material_id: input.material_id,
    p_decision: input.decision,
    p_reason: input.decision === "rejected" ? (input.rejection_reason ?? null) : null,
  });
  const decided = row<{ owner_id: string; title: string }>(result);
  if (!decided) throw new Error("Material not found.");
  return decided;
}

export async function countPendingMaterials(): Promise<number> {
  const db = await getDb();
  return countOf(
    await db
      .from("materials")
      .select("id", { count: "exact", head: true })
      .eq("approval_status", "pending")
      .eq("is_hidden", false),
  );
}

/** Visible materials per approval status, for the counts on the review tabs. */
export async function countMaterialsByApprovalStatus(): Promise<
  Record<MaterialApprovalStatus, number>
> {
  const db = await getDb();
  const count = (status: MaterialApprovalStatus) =>
    db
      .from("materials")
      .select("id", { count: "exact", head: true })
      .eq("approval_status", status)
      .eq("is_hidden", false);
  const [pending, approved, rejected] = await Promise.all([
    count("pending"),
    count("approved"),
    count("rejected"),
  ]);
  return { pending: countOf(pending), approved: countOf(approved), rejected: countOf(rejected) };
}

export type ReviewQueueItem = PublicMaterial & { tags: PublicTag[] };

/** Materials by approval status for the expert review page (oldest pending first). */
export async function listMaterialsForReview(
  status: MaterialApprovalStatus,
  options: { skip?: number; take?: number } = {},
): Promise<{ items: ReviewQueueItem[]; total: number }> {
  const db = await getDb();
  let query = db
    .from("materials")
    .select(MATERIAL_SELECT, { count: "exact" })
    .eq("approval_status", status)
    .eq("is_hidden", false)
    .order("created_at", { ascending: status === "pending" });
  if (options.take !== undefined) {
    const skip = options.skip ?? 0;
    query = query.range(skip, skip + options.take - 1);
  }

  const result = await query;
  const materials = rows<MaterialRow>(result);
  const tagsByMaterial = await listEntityTagsForEntities(
    "material",
    materials.map((material) => material.id),
  );

  return {
    items: materials.map((material) => ({
      ...pickPublicMaterialFields(material),
      tags: tagsByMaterial.get(material.id) ?? [],
    })),
    total: result.count ?? materials.length,
  };
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
  const { query } = await filteredMaterials(
    { ...filter, include_hidden: true, include_unapproved: true },
    MATERIAL_SELECT,
    { count: "exact" },
  );
  const result = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  const materials = rows<MaterialRow>(result);

  const tagsByMaterial = await listEntityTagsForEntities(
    "material",
    materials.map((material) => material.id),
  );

  const items: AdminMaterialItem[] = materials.map((material) => ({
    id: material.id,
    title: material.title,
    createdAt: material.created_at,
    isHidden: material.is_hidden,
    approvalStatus: material.approval_status,
    uploader: material.user ? { id: material.user.id, full_name: material.user.full_name } : null,
    tags: (tagsByMaterial.get(material.id) ?? []).map((tag) => ({ id: tag.id, name: tag.name })),
  }));

  return { items, total: result.count ?? items.length };
}
