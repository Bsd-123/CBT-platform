import "server-only";
import type {
  CreateMaterialTypeInput,
  MaterialTypeKey,
  PublicMaterialType,
  UpdateMaterialTypeInput,
} from "@/lib/models/material-type";
import { MATERIAL_TYPE_KEYS, pickPublicMaterialTypeFields } from "@/lib/models/material-type";
import { countOf, done, getDb, row, rows } from "@/lib/db/client";
import type { MaterialType } from "@/lib/db/types";

export async function listMaterialTypes(): Promise<PublicMaterialType[]> {
  const db = await getDb();
  const types = rows<MaterialType>(
    await db.from("material_types").select("*").order("label", { ascending: true }),
  );
  return types.map(pickPublicMaterialTypeFields);
}

export async function getMaterialTypeById(id: string): Promise<PublicMaterialType | null> {
  const db = await getDb();
  const type = row<MaterialType>(await db.from("material_types").select("*").eq("id", id).maybeSingle());
  return type ? pickPublicMaterialTypeFields(type) : null;
}

export async function getMaterialTypeByKey(key: MaterialTypeKey): Promise<PublicMaterialType | null> {
  const db = await getDb();
  const type = row<MaterialType>(await db.from("material_types").select("*").eq("key", key).maybeSingle());
  return type ? pickPublicMaterialTypeFields(type) : null;
}

export async function createMaterialType(input: CreateMaterialTypeInput): Promise<PublicMaterialType> {
  if (await getMaterialTypeByKey(input.key)) {
    throw new Error("Material type key already exists.");
  }
  const db = await getDb();
  const type = row<MaterialType>(
    await db
      .from("material_types")
      .insert({ key: input.key, label: input.label.trim(), icon: input.icon?.trim() || null })
      .select("*")
      .single(),
  );
  return pickPublicMaterialTypeFields(type!);
}

export async function updateMaterialType(
  id: string,
  input: UpdateMaterialTypeInput,
): Promise<PublicMaterialType> {
  const db = await getDb();
  const type = row<MaterialType>(
    await db
      .from("material_types")
      .update({
        ...(input.label !== undefined && { label: input.label.trim() }),
        ...(input.icon !== undefined && { icon: input.icon?.trim() || null }),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle(),
  );
  if (!type) throw new Error("Forbidden");
  return pickPublicMaterialTypeFields(type);
}

export async function deleteMaterialType(id: string): Promise<void> {
  const db = await getDb();
  const inUse = countOf(
    await db.from("materials").select("id", { count: "exact", head: true }).eq("material_type_id", id),
  );
  if (inUse > 0) {
    throw new Error("Cannot delete a material type that is in use.");
  }
  done(await db.from("material_types").delete().eq("id", id));
}

export async function listAvailableMaterialTypeKeys(): Promise<MaterialTypeKey[]> {
  const db = await getDb();
  const used = rows<{ key: MaterialTypeKey }>(await db.from("material_types").select("key"));
  const usedKeys = new Set(used.map((item) => item.key));
  return MATERIAL_TYPE_KEYS.filter((key) => !usedKeys.has(key));
}
