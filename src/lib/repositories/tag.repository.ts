import "server-only";
import type {
  AttachEntityTagInput,
  CreateTagInput,
  PublicEntityTag,
  PublicTag,
} from "@/lib/models/tag";
import { pickPublicEntityTagFields, pickPublicTagFields } from "@/lib/models/tag";
import { done, getDb, isUniqueViolation, row, rows, toError } from "@/lib/db/client";
import type { EntityTag, EntityType, Tag } from "@/lib/db/types";

type EntityTagRow = EntityTag & { tag: Tag };

export async function listTags(): Promise<PublicTag[]> {
  const db = await getDb();
  const tags = rows<Tag>(await db.from("tags").select("*").order("name", { ascending: true }));
  return tags.map(pickPublicTagFields);
}

export async function getTagById(id: string): Promise<PublicTag | null> {
  const db = await getDb();
  const tag = row<Tag>(await db.from("tags").select("*").eq("id", id).maybeSingle());
  return tag ? pickPublicTagFields(tag) : null;
}

export async function getTagByName(name: string): Promise<PublicTag | null> {
  const db = await getDb();
  const tag = row<Tag>(await db.from("tags").select("*").eq("name", name).maybeSingle());
  return tag ? pickPublicTagFields(tag) : null;
}

export async function createTag(input: CreateTagInput): Promise<PublicTag> {
  const db = await getDb();
  const result = await db
    .from("tags")
    .insert({ name: input.name, ...(input.color && { color: input.color }) })
    .select("*")
    .single();

  if (isUniqueViolation(result.error)) {
    // Another request created the same tag first: use it.
    const existing = await getTagByName(input.name);
    if (existing) return existing;
  }
  if (result.error) throw toError(result.error);
  return pickPublicTagFields(row<Tag>(result)!);
}

export async function attachEntityTag(input: AttachEntityTagInput): Promise<PublicEntityTag> {
  const db = await getDb();
  const entityTag = row<EntityTagRow>(
    await db.from("entity_tags").insert(input).select("*, tag:tags(*)").single(),
  );
  return pickPublicEntityTagFields(entityTag!);
}

/** Admin-only (Row Level Security): removes the tag from all content, then the tag itself. */
export async function deleteTag(id: string): Promise<void> {
  const db = await getDb();
  done(await db.from("entity_tags").delete().eq("tag_id", id));
  done(await db.from("tags").delete().eq("id", id));
}

export async function detachEntityTag(id: string): Promise<void> {
  const db = await getDb();
  done(await db.from("entity_tags").delete().eq("id", id));
}

export async function listEntityTags(
  entity_type: EntityType,
  entity_id: string,
): Promise<PublicEntityTag[]> {
  const db = await getDb();
  const entityTags = rows<EntityTagRow>(
    await db
      .from("entity_tags")
      .select("*, tag:tags(*)")
      .eq("entity_type", entity_type)
      .eq("entity_id", entity_id),
  );
  return entityTags
    .sort((a, b) => a.tag.name.localeCompare(b.tag.name))
    .map(pickPublicEntityTagFields);
}

/** Tags for many entities in one query, keyed by entity id (avoids N+1 in list pages). */
export async function listEntityTagsForEntities(
  entity_type: EntityType,
  entity_ids: string[],
): Promise<Map<string, PublicTag[]>> {
  const result = new Map<string, PublicTag[]>();
  if (entity_ids.length === 0) return result;

  const db = await getDb();
  const entityTags = rows<EntityTagRow>(
    await db
      .from("entity_tags")
      .select("*, tag:tags(*)")
      .eq("entity_type", entity_type)
      .in("entity_id", entity_ids),
  );

  for (const entityTag of entityTags.sort((a, b) => a.tag.name.localeCompare(b.tag.name))) {
    const list = result.get(entityTag.entity_id) ?? [];
    list.push(pickPublicTagFields(entityTag.tag));
    result.set(entityTag.entity_id, list);
  }
  return result;
}
