"use server";

import type { ReportTargetType } from "@prisma/client";
import type { RecommendationType } from "@prisma/client";
import type { ForumLikeTargetType } from "@prisma/client";
import { requireApprovedRegistration } from "@/lib/auth";
import { parseTagNames, syncEntityTags, syncEntityTagsByIds } from "@/lib/services/tags";
import {
  editEvent,
  editMaterialRating,
  fetchEventById,
  fetchUserMaterialRating,
  postEvent,
  postEventComment,
  postForumAnswer,
  postForumQuestion,
  postMaterialRequest,
  postProfessionalRequest,
  postProfessionalRequestComment,
  postRecommendation,
  postRecommendationComment,
  rateMaterial,
  respondToMaterialRequest,
  submitReport,
  toggleForumLike,
  uploadMaterial,
} from "@/lib/actions";

export async function submitMaterialUpload(input: {
  title: string;
  description: string;
  material_type_id: string;
  file_url: string;
  tag_ids: string[];
}) {
  const auth = await requireApprovedRegistration();

  if (!input.material_type_id) {
    throw new Error("יש לבחור סוג חומר.");
  }

  if (!input.tag_ids.length) {
    throw new Error("יש לבחור לפחות תגית אחת.");
  }

  const material = await uploadMaterial({
    user_id: auth.userId,
    title: input.title,
    description: input.description,
    material_type_id: input.material_type_id,
    file_url: input.file_url,
  });

  await syncEntityTagsByIds("material", material.id, input.tag_ids);
  return material;
}

export async function submitMaterialRequest(input: {
  title: string;
  description: string;
}) {
  const auth = await requireApprovedRegistration();
  return postMaterialRequest({
    user_id: auth.userId,
    title: input.title,
    description: input.description,
  });
}

export async function submitMaterialResponse(input: {
  request_id: string;
  text?: string;
  file_url?: string;
}) {
  const auth = await requireApprovedRegistration();

  if (!input.text?.trim() && !input.file_url) {
    throw new Error("יש לכלול טקסט, קובץ, או שניהם.");
  }

  return respondToMaterialRequest({
    request_id: input.request_id,
    user_id: auth.userId,
    text: input.text?.trim() || null,
    file_url: input.file_url || null,
  });
}

export async function submitMaterialRating(material_id: string, rating: number) {
  const auth = await requireApprovedRegistration();
  const existing = await fetchUserMaterialRating(material_id, auth.userId);

  if (existing) {
    return editMaterialRating(material_id, auth.userId, { rating });
  }

  return rateMaterial({
    material_id,
    user_id: auth.userId,
    rating,
  });
}

export async function submitForumQuestion(input: {
  title: string;
  content: string;
  tags: string;
}) {
  const auth = await requireApprovedRegistration();

  if (!parseTagNames(input.tags).length) {
    throw new Error("יש להוסיף לפחות תגית אחת.");
  }

  const question = await postForumQuestion({
    user_id: auth.userId,
    title: input.title,
    content: input.content,
  });

  await syncEntityTags("forum", question.id, parseTagNames(input.tags));
  return question;
}

export async function submitForumAnswer(input: {
  question_id: string;
  content: string;
  parent_answer_id?: string | null;
}) {
  const auth = await requireApprovedRegistration();
  return postForumAnswer({
    question_id: input.question_id,
    user_id: auth.userId,
    content: input.content,
    parent_answer_id: input.parent_answer_id ?? null,
  });
}

export async function submitForumLikeToggle(
  target_type: ForumLikeTargetType,
  target_id: string,
) {
  const auth = await requireApprovedRegistration();
  return toggleForumLike(auth.userId, target_type, target_id);
}

export async function submitRecommendation(input: {
  type?: RecommendationType | null;
  content: string;
  tag_ids: string[];
}) {
  const auth = await requireApprovedRegistration();

  if (!input.tag_ids.length) {
    throw new Error("יש לבחור לפחות תגית אחת.");
  }

  const recommendation = await postRecommendation({
    user_id: auth.userId,
    type: input.type ?? null,
    content: input.content,
  });

  await syncEntityTagsByIds("recommendation", recommendation.id, input.tag_ids);
  return recommendation;
}

export async function submitRecommendationComment(input: {
  recommendation_id: string;
  content: string;
  parent_comment_id?: string | null;
}) {
  const auth = await requireApprovedRegistration();
  return postRecommendationComment({
    recommendation_id: input.recommendation_id,
    user_id: auth.userId,
    content: input.content,
    parent_comment_id: input.parent_comment_id ?? null,
  });
}

export async function submitEvent(input: {
  title: string;
  description: string;
  event_date: string;
  event_time?: string;
}) {
  const auth = await requireApprovedRegistration();

  if (!input.event_date) {
    throw new Error("תאריך אירוע הוא שדה חובה.");
  }

  return postEvent({
    user_id: auth.userId,
    title: input.title,
    description: input.description,
    event_date: new Date(input.event_date),
    event_time: input.event_time ? parseTimeInput(input.event_time) : null,
  });
}

export async function submitEventUpdate(
  event_id: string,
  input: {
    title?: string;
    description?: string;
    event_date?: string;
    event_time?: string;
    is_cancelled?: boolean;
  },
) {
  const auth = await requireApprovedRegistration();
  const event = await fetchEventById(event_id);

  if (!event) {
    throw new Error("האירוע לא נמצא.");
  }

  const isOwner = event.user_id === auth.userId;
  const isAdmin = auth.profile.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new Error("Forbidden");
  }

  return editEvent(event_id, {
    title: input.title,
    description: input.description,
    event_date: input.event_date ? new Date(input.event_date) : undefined,
    event_time:
      input.event_time === undefined
        ? undefined
        : input.event_time
          ? parseTimeInput(input.event_time)
          : null,
    is_cancelled: input.is_cancelled,
  });
}

export async function submitEventComment(input: {
  event_id: string;
  content: string;
}) {
  const auth = await requireApprovedRegistration();
  return postEventComment({
    event_id: input.event_id,
    user_id: auth.userId,
    content: input.content,
  });
}

export async function submitProfessionalRequest(input: {
  title: string;
  description: string;
}) {
  const auth = await requireApprovedRegistration();
  return postProfessionalRequest({
    user_id: auth.userId,
    title: input.title,
    description: input.description,
  });
}

export async function submitProfessionalRequestComment(input: {
  request_id: string;
  content: string;
  parent_comment_id?: string | null;
}) {
  const auth = await requireApprovedRegistration();
  return postProfessionalRequestComment({
    request_id: input.request_id,
    user_id: auth.userId,
    content: input.content,
    parent_comment_id: input.parent_comment_id ?? null,
  });
}

export async function submitContentReport(input: {
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
}) {
  const auth = await requireApprovedRegistration();
  return submitReport({
    user_id: auth.userId,
    target_type: input.target_type,
    target_id: input.target_id,
    reason: input.reason,
  });
}

function parseTimeInput(time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(0);
  date.setUTCHours(hours, minutes ?? 0, 0, 0);
  return date;
}
