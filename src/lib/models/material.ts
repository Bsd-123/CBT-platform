import type { MaterialTypeKey } from "@prisma/client";
import type { Material } from "@prisma/client";
import {
  pickPublicMaterialTypeFields,
  type PublicMaterialType,
} from "@/lib/models/material-type";
import { pickPublicUserFields, type PublicUser } from "@/lib/models/user";

export type { Material };

export type CreateMaterialInput = {
  user_id: string;
  title: string;
  description: string;
  file_url: string;
  material_type_id: string;
};

export type ListMaterialsFilter = {
  material_type_id?: string;
  material_type_key?: MaterialTypeKey;
  user_id?: string;
  include_hidden?: boolean;
  search?: string;
  tag_ids?: string[];
};

export function pickPublicMaterialFields(
  material: Material & {
    user?: Parameters<typeof pickPublicUserFields>[0];
    material_type?: Parameters<typeof pickPublicMaterialTypeFields>[0];
  },
) {
  return {
    id: material.id,
    user_id: material.user_id,
    title: material.title,
    description: material.description,
    file_url: material.file_url,
    material_type_id: material.material_type_id,
    created_at: material.created_at,
    user: material.user ? pickPublicUserFields(material.user) : undefined,
    material_type: material.material_type
      ? pickPublicMaterialTypeFields(material.material_type)
      : undefined,
  };
}

export type PublicMaterial = ReturnType<typeof pickPublicMaterialFields>;

export type PublicMaterialWithRelations = PublicMaterial & {
  user: PublicUser;
  material_type: PublicMaterialType;
};
