import "server-only";
import type { EntityType } from "@prisma/client";
import type {
  AttachEntityTagInput,
  CreateTagInput,
  PublicEntityTag,
  PublicTag,
} from "@/lib/models/tag";
import {
  pickPublicEntityTagFields,
  pickPublicTagFields,
} from "@/lib/models/tag";
import { prisma } from "@/lib/db";

export async function listTags(): Promise<PublicTag[]> {
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return tags.map(pickPublicTagFields);
}

export async function getTagById(id: string): Promise<PublicTag | null> {
  const tag = await prisma.tag.findUnique({ where: { id } });
  return tag ? pickPublicTagFields(tag) : null;
}

export async function getTagByName(name: string): Promise<PublicTag | null> {
  const tag = await prisma.tag.findUnique({ where: { name } });
  return tag ? pickPublicTagFields(tag) : null;
}

export async function createTag(input: CreateTagInput): Promise<PublicTag> {
  const tag = await prisma.tag.create({
    data: {
      name: input.name,
      color: input.color,
    },
  });
  return pickPublicTagFields(tag);
}

export async function attachEntityTag(
  input: AttachEntityTagInput,
): Promise<PublicEntityTag> {
  const entityTag = await prisma.entityTag.create({
    data: input,
    include: { tag: true },
  });
  return pickPublicEntityTagFields(entityTag);
}

export async function deleteTag(id: string): Promise<void> {
  await prisma.entityTag.deleteMany({ where: { tag_id: id } });
  await prisma.tag.delete({ where: { id } });
}

export async function detachEntityTag(id: string): Promise<void> {
  await prisma.entityTag.delete({ where: { id } });
}

export async function listEntityTags(
  entity_type: EntityType,
  entity_id: string,
): Promise<PublicEntityTag[]> {
  const entityTags = await prisma.entityTag.findMany({
    where: { entity_type, entity_id },
    include: { tag: true },
    orderBy: { tag: { name: "asc" } },
  });
  return entityTags.map(pickPublicEntityTagFields);
}
