/**
 * Database enums and row types. These mirror the Postgres schema (supabase/migrations) and
 * replace the types Prisma used to generate. Timestamps are `Date`s: rows are converted from
 * PostgREST's ISO strings by `@/lib/db/convert`.
 */

export const USER_ROLES = ["user", "expert", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const EXPERT_APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;
export type ExpertApprovalStatus = (typeof EXPERT_APPROVAL_STATUSES)[number];

export const MATERIAL_APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;
export type MaterialApprovalStatus = (typeof MATERIAL_APPROVAL_STATUSES)[number];

export const MATERIAL_TYPE_KEY_VALUES = [
  "game",
  "reading",
  "worksheet",
  "treatment_plan",
  "presentation",
  "video",
] as const;
export type MaterialTypeKey = (typeof MATERIAL_TYPE_KEY_VALUES)[number];

export const RECOMMENDATION_TYPES = ["book", "game", "workshop"] as const;
export type RecommendationType = (typeof RECOMMENDATION_TYPES)[number];

export const ENTITY_TYPES = [
  "material",
  "forum",
  "recommendation",
  "event",
  "professional_request",
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const FORUM_LIKE_TARGET_TYPES = ["question", "answer"] as const;
export type ForumLikeTargetType = (typeof FORUM_LIKE_TARGET_TYPES)[number];

export const NOTIFICATION_TYPES = [
  "comment_on_content",
  "comment_on_recommendation",
  "forum_answer",
  "material_request_response",
  "material_approved",
  "material_rejected",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const REPORT_STATUSES = ["open", "reviewing", "resolved"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_TARGET_TYPES = [
  "material",
  "forum_question",
  "forum_answer",
  "recommendation",
  "event",
  "professional_request",
] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export type User = {
  id: string;
  full_name: string;
  title: string | null;
  role: UserRole;
  created_at: Date;
};

export type ExpertApproval = {
  id: string;
  expert_id: string;
  user_id: string;
  status: ExpertApprovalStatus;
  created_at: Date;
};

export type MaterialType = {
  id: string;
  key: MaterialTypeKey;
  label: string;
  icon: string | null;
};

export type Material = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  file_url: string;
  material_type_id: string;
  created_at: Date;
  is_hidden: boolean;
  approval_status: MaterialApprovalStatus;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  rejection_reason: string | null;
};

export type MaterialRequest = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  created_at: Date;
};

export type MaterialResponse = {
  id: string;
  request_id: string;
  user_id: string;
  text: string | null;
  file_url: string | null;
  created_at: Date;
};

export type MaterialRating = {
  id: string;
  material_id: string;
  user_id: string;
  rating: number;
  created_at: Date;
};

export type ForumQuestion = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: Date;
  is_hidden: boolean;
  /** The question's domain (one of the existing tags); null only for questions older than the feature. */
  domain_tag_id: string | null;
};

export type ForumAnswer = {
  id: string;
  question_id: string;
  user_id: string;
  content: string;
  parent_answer_id: string | null;
  created_at: Date;
  is_hidden: boolean;
};

export type ForumLike = {
  id: string;
  user_id: string;
  target_type: ForumLikeTargetType;
  target_id: string;
  created_at: Date;
};

export type Recommendation = {
  id: string;
  user_id: string;
  type: RecommendationType | null;
  content: string;
  created_at: Date;
  is_hidden: boolean;
};

export type RecommendationComment = {
  id: string;
  recommendation_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  depth: number;
  created_at: Date;
};

/** `event_date` is a calendar date (UTC midnight); `event_time` is a time of day on 1970-01-01 UTC. */
export type Event = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  event_date: Date | null;
  event_time: Date | null;
  is_cancelled: boolean;
  created_at: Date;
  is_hidden: boolean;
};

export type EventComment = {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  created_at: Date;
};

export type ProfessionalRequest = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  created_at: Date;
  is_hidden: boolean;
};

export type ProfessionalRequestComment = {
  id: string;
  request_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: Date;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
};

export type EntityTag = {
  id: string;
  tag_id: string;
  entity_type: EntityType;
  entity_id: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: Date;
};

export type Report = {
  id: string;
  user_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  status: ReportStatus;
  created_at: Date;
};
