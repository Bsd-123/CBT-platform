"use server";



import { requireApprovedRegistration } from "@/lib/auth";

import type { UpdateUserInput } from "@/lib/models/user";

import { getUserActivity } from "@/lib/repositories/profile.repository";

import { listEvents } from "@/lib/repositories/event.repository";

import { enforceRateLimit } from "@/lib/security/rate-limit";
import { parseInput, profileSchema } from "@/lib/validation/schemas";
import { updateUser } from "@/lib/repositories/user.repository";



export async function fetchMyProfileActivity() {

  const auth = await requireApprovedRegistration();

  return getUserActivity(auth.userId);

}



export async function fetchMyEvents() {

  const auth = await requireApprovedRegistration();

  return listEvents({ user_id: auth.userId, include_hidden: true });

}



export async function updateMyProfile(raw: Pick<UpdateUserInput, "full_name" | "title">) {
  const auth = await requireApprovedRegistration();
  enforceRateLimit("write", auth.userId);
  const input = parseInput(profileSchema, raw);

  return updateUser(auth.userId, {
    full_name: input.full_name,
    title: input.title?.trim() || null,
  });
}
