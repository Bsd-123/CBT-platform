import "server-only";
import type {
  CreateMaterialRatingInput,
  PublicMaterialRating,
  UpdateMaterialRatingInput,
} from "@/lib/models/material-rating";
import { isValidMaterialRating, pickPublicMaterialRatingFields } from "@/lib/models/material-rating";
import { countOf, done, getDb, row, rows } from "@/lib/db/client";
import type { MaterialRating, User } from "@/lib/db/types";

type RatingRow = MaterialRating & { user: User };

const RATING_SELECT = "*, user:users(*)";

function average(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;
}

export async function getMaterialRating(
  material_id: string,
  user_id: string,
): Promise<PublicMaterialRating | null> {
  const db = await getDb();
  const rating = row<RatingRow>(
    await db
      .from("materials_ratings")
      .select(RATING_SELECT)
      .eq("material_id", material_id)
      .eq("user_id", user_id)
      .maybeSingle(),
  );
  return rating ? pickPublicMaterialRatingFields(rating) : null;
}

export async function listMaterialRatingsByMaterial(
  material_id: string,
): Promise<PublicMaterialRating[]> {
  const db = await getDb();
  const ratings = rows<RatingRow>(
    await db
      .from("materials_ratings")
      .select(RATING_SELECT)
      .eq("material_id", material_id)
      .order("created_at", { ascending: false }),
  );
  return ratings.map(pickPublicMaterialRatingFields);
}

export async function getMaterialAverageRating(material_id: string): Promise<number | null> {
  const db = await getDb();
  const ratings = rows<{ rating: number }>(
    await db.from("materials_ratings").select("rating").eq("material_id", material_id),
  );
  return average(ratings.map((item) => item.rating));
}

/** Average rating per material id in one query (materials without ratings are absent). */
export async function getMaterialAverageRatings(material_ids: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (material_ids.length === 0) return result;

  const db = await getDb();
  const ratings = rows<{ material_id: string; rating: number }>(
    await db.from("materials_ratings").select("material_id, rating").in("material_id", material_ids),
  );

  const byMaterial = new Map<string, number[]>();
  for (const { material_id, rating } of ratings) {
    byMaterial.set(material_id, [...(byMaterial.get(material_id) ?? []), rating]);
  }
  for (const [material_id, values] of byMaterial) result.set(material_id, average(values)!);
  return result;
}

export async function createMaterialRating(
  input: CreateMaterialRatingInput,
): Promise<PublicMaterialRating> {
  if (!isValidMaterialRating(input.rating)) {
    throw new Error("Rating must be an integer between 1 and 5.");
  }

  const db = await getDb();
  const rateable = countOf(
    await db
      .from("materials")
      .select("id", { count: "exact", head: true })
      .eq("id", input.material_id)
      .eq("is_hidden", false)
      .eq("approval_status", "approved"),
  );
  if (rateable === 0) throw new Error("Material not found.");

  const rating = row<RatingRow>(
    await db
      .from("materials_ratings")
      .upsert(
        { material_id: input.material_id, user_id: input.user_id, rating: input.rating },
        { onConflict: "material_id,user_id" },
      )
      .select(RATING_SELECT)
      .single(),
  );
  return pickPublicMaterialRatingFields(rating!);
}

export async function updateMaterialRating(
  material_id: string,
  user_id: string,
  input: UpdateMaterialRatingInput,
): Promise<PublicMaterialRating> {
  if (!isValidMaterialRating(input.rating)) {
    throw new Error("Rating must be an integer between 1 and 5.");
  }
  const db = await getDb();
  const rating = row<RatingRow>(
    await db
      .from("materials_ratings")
      .update({ rating: input.rating })
      .eq("material_id", material_id)
      .eq("user_id", user_id)
      .select(RATING_SELECT)
      .maybeSingle(),
  );
  if (!rating) throw new Error("Rating not found.");
  return pickPublicMaterialRatingFields(rating);
}

export async function deleteMaterialRating(material_id: string, user_id: string): Promise<void> {
  const db = await getDb();
  done(await db.from("materials_ratings").delete().eq("material_id", material_id).eq("user_id", user_id));
}
