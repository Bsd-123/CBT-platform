import { z } from "zod";
import { UserFacingError } from "@/lib/errors";

const uuid = z.string().uuid();
const title = z.string().trim().min(1).max(200);
const longText = z.string().trim().min(1).max(5000);
const comment = z.string().trim().min(1).max(2000);

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => !Number.isNaN(new Date(value).getTime()));
const timeOnly = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const materialUploadSchema = z.object({
  title,
  description: longText,
  material_type_id: uuid,
  file_url: z.string().max(300),
  tag_ids: z.array(uuid).min(1).max(10),
});

export const materialRequestSchema = z.object({ title, description: longText });

export const materialResponseSchema = z.object({
  request_id: uuid,
  text: z.string().trim().max(5000).optional(),
  file_url: z.string().max(300).optional(),
});

export const materialRatingSchema = z.object({
  material_id: uuid,
  rating: z.number().int().min(1).max(5),
});

export const forumQuestionSchema = z.object({
  title,
  content: longText,
  tags: z.string().max(500),
});

export const forumAnswerSchema = z.object({
  question_id: uuid,
  content: longText,
  parent_answer_id: uuid.nullish(),
});

export const forumLikeSchema = z.object({
  target_type: z.enum(["question", "answer"]),
  target_id: uuid,
});

export const recommendationSchema = z.object({
  type: z.enum(["book", "game", "workshop"]).nullish(),
  content: longText,
  tag_ids: z.array(uuid).min(1).max(10),
});

export const recommendationCommentSchema = z.object({
  recommendation_id: uuid,
  content: comment,
  parent_comment_id: uuid.nullish(),
});

export const professionalCommentSchema = z.object({
  request_id: uuid,
  content: comment,
  parent_comment_id: uuid.nullish(),
});

export const eventSchema = z.object({
  title,
  description: longText,
  event_date: dateOnly,
  event_time: timeOnly.optional().or(z.literal("")),
});

export const eventUpdateSchema = z.object({
  title: title.optional(),
  description: longText.optional(),
  event_date: dateOnly.optional(),
  event_time: timeOnly.or(z.literal("")).optional(),
  is_cancelled: z.boolean().optional(),
});

export const eventCommentSchema = z.object({ event_id: uuid, content: comment });

export const professionalRequestSchema = z.object({ title, description: longText });

export const reportSchema = z.object({
  target_type: z.enum([
    "material",
    "forum_question",
    "forum_answer",
    "recommendation",
    "event",
    "professional_request",
  ]),
  target_id: uuid,
  reason: z.string().trim().min(1).max(1000),
});

export const profileSchema = z.object({
  full_name: z.string().trim().min(1).max(100),
  title: z.string().trim().max(100).nullish(),
});

export const registerSchema = z.object({
  id: uuid,
  full_name: z.string().trim().min(1).max(100),
  title: z.string().trim().max(100).nullish(),
  // Required unless the system has no expert yet; enforced in registerProfile.
  expert_code: z.string().trim().max(64).nullish(),
});

export const approvalDecisionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export const reportStatusSchema = z.object({
  status: z.enum(["open", "reviewing", "resolved"]),
});

/** Parses untrusted action input; failures surface as a safe, user-facing error. */
export function parseInput<S extends z.ZodType>(schema: S, raw: unknown): z.infer<S> {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const field = result.error.issues[0]?.path.join(".");
    throw new UserFacingError(
      field ? `הערך בשדה "${field}" אינו תקין.` : "הנתונים שהוזנו אינם תקינים.",
    );
  }
  return result.data;
}
