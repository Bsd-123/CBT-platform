"use server";

import { runAction } from "@/lib/actions/result";
import type {
  ForumLikeTargetType,
  RecommendationType,
  ReportTargetType,
} from "@prisma/client";
import { requireApprovedRegistration } from "@/lib/auth";
import { UserFacingError } from "@/lib/errors";
import { isFileKeyOwnedBy } from "@/lib/r2";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { parseTagNames, syncEntityTags, syncEntityTagsByIds } from "@/lib/services/tags";
import {
  eventCommentSchema,
  eventSchema,
  eventUpdateSchema,
  forumAnswerSchema,
  forumLikeSchema,
  forumQuestionSchema,
  materialRatingSchema,
  materialRequestSchema,
  materialResponseSchema,
  materialUploadSchema,
  parseInput,
  professionalCommentSchema,
  professionalRequestSchema,
  recommendationCommentSchema,
  recommendationSchema,
  reportSchema,
} from "@/lib/validation/schemas";
import {
  editEvent,
  fetchEventById,
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
} from "@/lib/data";

/** Authenticates, then throttles. Every mutating action starts with this. */
async function authorizeWrite(bucket: "write" | "report" = "write") {
  const auth = await requireApprovedRegistration();
  enforceRateLimit(bucket, auth.userId);
  return auth;
}

export async function submitMaterialUpload(raw: {
  title: string;
  description: string;
  material_type_id: string;
  file_url: string;
  tag_ids: string[];
}) {
  return runAction(async () => {
    const auth = await authorizeWrite();
    const input = parseInput(materialUploadSchema, raw);

    if (!isFileKeyOwnedBy(input.file_url, auth.userId, "materials")) {
      throw new UserFacingError("קובץ לא תקין. יש להעלות את הקובץ מחדש.");
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

  });
}

export async function submitMaterialRequest(raw: {
  title: string;
  description: string;
}) {
  return runAction(async () => {
    const auth = await authorizeWrite();
    const input = parseInput(materialRequestSchema, raw);
    return postMaterialRequest({ user_id: auth.userId, ...input });

  });
}

export async function submitMaterialResponse(raw: {
  request_id: string;
  text?: string;
  file_url?: string;
}) {
  return runAction(async () => {
    const auth = await authorizeWrite();
    const input = parseInput(materialResponseSchema, raw);

    if (!input.text && !input.file_url) {
      throw new UserFacingError("יש לכלול טקסט, קובץ, או שניהם.");
    }

    if (
      input.file_url &&
      !isFileKeyOwnedBy(input.file_url, auth.userId, "material-responses")
    ) {
      throw new UserFacingError("קובץ לא תקין. יש להעלות את הקובץ מחדש.");
    }

    return respondToMaterialRequest({
      request_id: input.request_id,
      user_id: auth.userId,
      text: input.text || null,
      file_url: input.file_url || null,
    });

  });
}

export async function submitMaterialRating(material_id: string, rating: number) {
  return runAction(async () => {
    const auth = await authorizeWrite();
    const input = parseInput(materialRatingSchema, { material_id, rating });
    return rateMaterial({ ...input, user_id: auth.userId });

  });
}

export async function submitForumQuestion(raw: {
  title: string;
  content: string;
  tags: string;
}) {
  return runAction(async () => {
    const auth = await authorizeWrite();
    const input = parseInput(forumQuestionSchema, raw);

    const tagNames = parseTagNames(input.tags);
    if (!tagNames.length) {
      throw new UserFacingError("יש להוסיף לפחות תגית אחת.");
    }
    if (tagNames.length > 10 || tagNames.some((name) => name.length > 40)) {
      throw new UserFacingError("עד 10 תגיות, עד 40 תווים לכל תגית.");
    }

    const question = await postForumQuestion({
      user_id: auth.userId,
      title: input.title,
      content: input.content,
    });

    await syncEntityTags("forum", question.id, tagNames);
    return question;

  });
}

export async function submitForumAnswer(raw: {
  question_id: string;
  content: string;
  parent_answer_id?: string | null;
}) {
  return runAction(async () => {
    const auth = await authorizeWrite();
    const input = parseInput(forumAnswerSchema, raw);
    return postForumAnswer({
      question_id: input.question_id,
      user_id: auth.userId,
      content: input.content,
      parent_answer_id: input.parent_answer_id ?? null,
    });

  });
}

export async function submitForumLikeToggle(
  target_type: ForumLikeTargetType,
  target_id: string,
) {
  return runAction(async () => {
    const auth = await authorizeWrite();
    const input = parseInput(forumLikeSchema, { target_type, target_id });
    return toggleForumLike(auth.userId, input.target_type, input.target_id);

  });
}

export async function submitRecommendation(raw: {
  type?: RecommendationType | null;
  content: string;
  tag_ids: string[];
}) {
  return runAction(async () => {
    const auth = await authorizeWrite();
    const input = parseInput(recommendationSchema, raw);

    const recommendation = await postRecommendation({
      user_id: auth.userId,
      type: input.type ?? null,
      content: input.content,
    });

    await syncEntityTagsByIds("recommendation", recommendation.id, input.tag_ids);
    return recommendation;

  });
}

export async function submitRecommendationComment(raw: {
  recommendation_id: string;
  content: string;
  parent_comment_id?: string | null;
}) {
  return runAction(async () => {
    const auth = await authorizeWrite();
    const input = parseInput(recommendationCommentSchema, raw);
    return postRecommendationComment({
      recommendation_id: input.recommendation_id,
      user_id: auth.userId,
      content: input.content,
      parent_comment_id: input.parent_comment_id ?? null,
    });

  });
}

export async function submitEvent(raw: {
  title: string;
  description: string;
  event_date: string;
  event_time?: string;
}) {
  return runAction(async () => {
    const auth = await authorizeWrite();
    const input = parseInput(eventSchema, raw);

    return postEvent({
      user_id: auth.userId,
      title: input.title,
      description: input.description,
      event_date: new Date(input.event_date),
      event_time: input.event_time ? parseTimeInput(input.event_time) : null,
    });

  });
}

export async function submitEventUpdate(
  event_id: string,
  raw: {
    title?: string;
    description?: string;
    event_date?: string;
    event_time?: string;
    is_cancelled?: boolean;
  },
) {
  return runAction(async () => {
    const auth = await authorizeWrite();
    const id = parseInput(eventCommentSchema.shape.event_id, event_id);
    const input = parseInput(eventUpdateSchema, raw);
    const event = await fetchEventById(id);

    if (!event) {
      throw new UserFacingError("האירוע לא נמצא.");
    }

    const isOwner = event.user_id === auth.userId;
    const isAdmin = auth.profile.role === "admin";

    if (!isOwner && !isAdmin) {
      throw new UserFacingError("אין הרשאה לערוך אירוע זה.");
    }

    return editEvent(id, {
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

  });
}

export async function submitEventComment(raw: {
  event_id: string;
  content: string;
}) {
  return runAction(async () => {
    const auth = await authorizeWrite();
    const input = parseInput(eventCommentSchema, raw);
    return postEventComment({ ...input, user_id: auth.userId });

  });
}

export async function submitProfessionalRequest(raw: {
  title: string;
  description: string;
}) {
  return runAction(async () => {
    const auth = await authorizeWrite();
    const input = parseInput(professionalRequestSchema, raw);
    return postProfessionalRequest({ user_id: auth.userId, ...input });

  });
}

export async function submitProfessionalRequestComment(raw: {
  request_id: string;
  content: string;
  parent_comment_id?: string | null;
}) {
  return runAction(async () => {
    const auth = await authorizeWrite();
    const input = parseInput(professionalCommentSchema, raw);
    return postProfessionalRequestComment({
      request_id: input.request_id,
      user_id: auth.userId,
      content: input.content,
      parent_comment_id: input.parent_comment_id ?? null,
    });

  });
}

export async function submitContentReport(raw: {
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
}) {
  return runAction(async () => {
    const auth = await authorizeWrite("report");
    const input = parseInput(reportSchema, raw);
    return submitReport({ user_id: auth.userId, ...input });

  });
}

function parseTimeInput(time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(0);
  date.setUTCHours(hours, minutes, 0, 0);
  return date;
}
