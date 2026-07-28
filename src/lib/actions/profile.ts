"use server";



import { requireApprovedRegistration } from "@/lib/auth";

import type { UpdateUserInput } from "@/lib/models/user";

import { getUserActivity } from "@/lib/repositories/profile.repository";

import { listEvents } from "@/lib/repositories/event.repository";

import { updateUser } from "@/lib/repositories/user.repository";



export async function fetchMyProfileActivity() {

  const auth = await requireApprovedRegistration();

  return getUserActivity(auth.userId);

}



export async function fetchMyEvents() {

  const auth = await requireApprovedRegistration();

  return listEvents({ user_id: auth.userId, include_hidden: true });

}



export async function updateMyProfile(input: UpdateUserInput) {

  const auth = await requireApprovedRegistration();



  if (!input.full_name?.trim()) {

    throw new Error("יש להזין שם מלא.");

  }



  return updateUser(auth.userId, {

    full_name: input.full_name.trim(),

    title: input.title?.trim() || null,

  });

}


