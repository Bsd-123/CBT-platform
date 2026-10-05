import "server-only";
import type {
  CreateMaterialRatingInput,
  PublicMaterialRating,
  UpdateMaterialRatingInput,
} from "@/lib/models/material-rating";
import {
  isValidMaterialRating,
  pickPublicMaterialRatingFields,
} from "@/lib/models/material-rating";
import { prisma } from "@/lib/db";

export async function getMaterialRating(
  material_id: string,
  user_id: string,
): Promise<PublicMaterialRating | null> {
  const rating = await prisma.materialRating.findUnique({
    where: { material_id_user_id: { material_id, user_id } },
    include: { user: true },
  });
  return rating ? pickPublicMaterialRatingFields(rating) : null;
}

export async function listMaterialRatingsByMaterial(
  material_id: string,
): Promise<PublicMaterialRating[]> {
  const ratings = await prisma.materialRating.findMany({
    where: { material_id },
    include: { user: true },
    orderBy: { created_at: "desc" },
  });
  return ratings.map(pickPublicMaterialRatingFields);
}

export async function getMaterialAverageRating(
  material_id: string,
): Promise<number | null> {
  const result = await prisma.materialRating.aggregate({
    where: { material_id },
    _avg: { rating: true },
  });
  return result._avg.rating;
}

export async function createMaterialRating(
  input: CreateMaterialRatingInput,
): Promise<PublicMaterialRating> {
  if (!isValidMaterialRating(input.rating)) {
    throw new Error("Rating must be an integer between 1 and 5.");
  }

  const material = await prisma.material.findFirst({
    where: { id: input.material_id, is_hidden: false },
    select: { id: true },
  });
  if (!material) {
    throw new Error("Material not found.");
  }

  const rating = await prisma.materialRating.upsert({
    where: {
      material_id_user_id: { material_id: input.material_id, user_id: input.user_id },
    },
    create: input,
    update: { rating: input.rating },
    include: { user: true },
  });
  return pickPublicMaterialRatingFields(rating);
}

export async function updateMaterialRating(
  material_id: string,
  user_id: string,
  input: UpdateMaterialRatingInput,
): Promise<PublicMaterialRating> {
  if (!isValidMaterialRating(input.rating)) {
    throw new Error("Rating must be an integer between 1 and 5.");
  }

  const rating = await prisma.materialRating.update({
    where: { material_id_user_id: { material_id, user_id } },
    data: { rating: input.rating },
    include: { user: true },
  });
  return pickPublicMaterialRatingFields(rating);
}

export async function deleteMaterialRating(
  material_id: string,
  user_id: string,
): Promise<void> {
  await prisma.materialRating.delete({
    where: { material_id_user_id: { material_id, user_id } },
  });
}
