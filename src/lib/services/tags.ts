import "server-only";
import { done, getDb, rows } from "@/lib/db/client";
import type { EntityType } from "@/lib/db/types";
import {
  createTag,
  getTagById,
  getTagByName,
} from "@/lib/repositories/tag.repository";

export function parseTagNames(raw: string): string[] {
  return [...new Set(
    raw
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean),
  )];
}

async function getOrCreateTagId(name: string): Promise<string> {
  const existing = await getTagByName(name);
  if (existing) return existing.id;
  const created = await createTag({ name });
  return created.id;
}

export async function syncEntityTags(
  entity_type: EntityType,
  entity_id: string,
  tagNames: string[],
): Promise<void> {
  if (tagNames.length === 0) return;

  const tagIds = await Promise.all(tagNames.map(getOrCreateTagId));
  await syncEntityTagsByIds(entity_type, entity_id, tagIds);
}

export async function syncEntityTagsByIds(
  entity_type: EntityType,
  entity_id: string,
  tag_ids: string[],
): Promise<void> {
  if (tag_ids.length === 0) return;

  const uniqueTagIds = [...new Set(tag_ids)];

  for (const tag_id of uniqueTagIds) {
    if (!(await getTagById(tag_id))) {
      throw new Error("אחת התגיות שנבחרו אינה קיימת.");
    }
  }

  // Only the content owner (or an admin) may attach tags: Row Level Security enforces it.
  const db = await getDb();
  const attached = new Set(
    rows<{ tag_id: string }>(
      await db
        .from("entity_tags")
        .select("tag_id")
        .eq("entity_type", entity_type)
        .eq("entity_id", entity_id)
        .in("tag_id", uniqueTagIds),
    ).map((item) => item.tag_id),
  );

  const missing = uniqueTagIds.filter((tag_id) => !attached.has(tag_id));
  if (missing.length > 0) {
    done(await db.from("entity_tags").insert(missing.map((tag_id) => ({ tag_id, entity_type, entity_id }))));
  }
}
