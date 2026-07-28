import type { EntityType } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  attachEntityTag,
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
    const tag = await getTagById(tag_id);
    if (!tag) {
      throw new Error("אחת התגיות שנבחרו אינה קיימת.");
    }

    const exists = await prisma.entityTag.findUnique({
      where: {
        tag_id_entity_type_entity_id: {
          tag_id,
          entity_type,
          entity_id,
        },
      },
    });

    if (!exists) {
      await attachEntityTag({ tag_id, entity_type, entity_id });
    }
  }
}
