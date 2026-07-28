import type { MaterialRating } from "@prisma/client";
import { pickPublicUserFields } from "@/lib/models/user";

export type { MaterialRating };

export const MIN_MATERIAL_RATING = 1;
export const MAX_MATERIAL_RATING = 5;

export type CreateMaterialRatingInput = {
  material_id: string;
  user_id: string;
  rating: number;
};

export type UpdateMaterialRatingInput = {
  rating: number;
};

export function isValidMaterialRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= MIN_MATERIAL_RATING && rating <= MAX_MATERIAL_RATING;
}

export function pickPublicMaterialRatingFields(
  rating: MaterialRating & {
    user?: Parameters<typeof pickPublicUserFields>[0];
  },
) {
  return {
    id: rating.id,
    material_id: rating.material_id,
    user_id: rating.user_id,
    rating: rating.rating,
    created_at: rating.created_at,
    user: rating.user ? pickPublicUserFields(rating.user) : undefined,
  };
}

export type PublicMaterialRating = ReturnType<typeof pickPublicMaterialRatingFields>;
