import type { EntityTag, EntityType, Tag } from "@prisma/client";

export type { Tag, EntityTag, EntityType };

export const ENTITY_TYPES: readonly EntityType[] = [
  "material",
  "forum",
  "recommendation",
  "event",
  "professional_request",
] as const;

export type CreateTagInput = {
  name: string;
  color?: string;
};

export type AttachEntityTagInput = {
  tag_id: string;
  entity_type: EntityType;
  entity_id: string;
};

export function pickPublicTagFields(tag: Tag) {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
  };
}

export function pickPublicEntityTagFields(entityTag: EntityTag & { tag?: Tag }) {
  return {
    id: entityTag.id,
    tag_id: entityTag.tag_id,
    entity_type: entityTag.entity_type,
    entity_id: entityTag.entity_id,
    tag: entityTag.tag ? pickPublicTagFields(entityTag.tag) : undefined,
  };
}

export type PublicTag = ReturnType<typeof pickPublicTagFields>;
export type PublicEntityTag = ReturnType<typeof pickPublicEntityTagFields>;
