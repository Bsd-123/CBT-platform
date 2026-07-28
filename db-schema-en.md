# Database Schema — Professional CBT Community Platform

## Users
- `id` (UUID, primary key)
- `full_name` (text, required)
- `title` (text, nullable — professional title)
- `role` (enum: user / expert / admin, required)
- `created_at` (timestamp)

---

## ExpertApprovals
- `id` (UUID, primary key)
- `expert_id` (UUID, references Users.id)
- `user_id` (UUID, references Users.id)
- `status` (enum: pending / approved / rejected, required)
- `created_at` (timestamp)

**Logic:** Expert can only approve/reject users who registered through their referral.

---

## Materials
- `id` (UUID, primary key)
- `user_id` (UUID, references Users.id, required)
- `title` (text, required)
- `description` (text, required)
- `file_url` (text, required — Cloudflare R2 URL)
- `material_type_id` (UUID, references MaterialTypes.id, required)
- `is_hidden` (boolean, default false)
- `created_at` (timestamp)

**Notes:** Files stored in Cloudflare R2, accessed via signed URLs only. Hidden materials are excluded from public lists.

---

## MaterialTypes
- `id` (UUID, primary key)
- `key` (enum: game / reading / worksheet / treatment_plan / presentation / video, unique)
- `label` (text, required)
- `icon` (text, nullable)

**Logic:** Admin manages labels and icons via category management UI. New types use predefined enum keys.

---

## MaterialRequests
- `id` (UUID, primary key)
- `user_id` (UUID, references Users.id, required)
- `title` (text, required)
- `description` (text, required)
- `created_at` (timestamp)

---

## MaterialResponses
- `id` (UUID, primary key)
- `request_id` (UUID, references MaterialRequests.id, required)
- `user_id` (UUID, references Users.id, required)
- `text` (text, nullable)
- `file_url` (text, nullable — Cloudflare R2 URL)
- `created_at` (timestamp)

**Logic:** Response to a MaterialRequest can contain a file upload or text explanation (or both).

---

## ForumQuestions
- `id` (UUID, primary key)
- `user_id` (UUID, references Users.id, required)
- `title` (text, required)
- `content` (text, required)
- `is_hidden` (boolean, default false)
- `created_at` (timestamp)

---

## ForumAnswers
- `id` (UUID, primary key)
- `question_id` (UUID, references ForumQuestions.id, required)
- `user_id` (UUID, references Users.id, required)
- `content` (text, required)
- `parent_answer_id` (UUID, nullable, self-reference)
- `is_hidden` (boolean, default false)
- `created_at` (timestamp)

**Logic:** Full nested thread structure:
- Question → Answers → Replies to Answers → Replies to Replies (unlimited depth)

---

## ForumLikes
- `id` (UUID, primary key)
- `user_id` (UUID, references Users.id, required)
- `target_type` (enum: question / answer, required)
- `target_id` (UUID, required — question id or answer id)
- `created_at` (timestamp)
- Composite unique constraint: (user_id, target_type, target_id)

**Logic:** Toggle likes on forum questions and answers. One like per user per target.

---

## Recommendations
- `id` (UUID, primary key)
- `user_id` (UUID, references Users.id, required)
- `type` (enum: book / game / workshop, nullable)
- `content` (text, required)
- `is_hidden` (boolean, default false)
- `created_at` (timestamp)

---

## RecommendationComments
- `id` (UUID, primary key)
- `recommendation_id` (UUID, references Recommendations.id, required)
- `user_id` (UUID, references Users.id, required)
- `content` (text, required)
- `parent_comment_id` (UUID, nullable, self-reference)
- `depth` (integer, default 0, max 1)
- `created_at` (timestamp)

**Logic:**
- `depth = 0`: Direct reply to recommendation
- `depth = 1`: Reply to a depth-0 comment (max nesting level)
- **Application constraint:** Only allow parent_comment_id if parent comment has depth = 0

---

## Events
- `id` (UUID, primary key)
- `user_id` (UUID, references Users.id, required)
- `title` (text, required)
- `description` (text, required)
- `event_date` (date, nullable)
- `event_time` (time, nullable)
- `is_cancelled` (boolean, default false)
- `is_hidden` (boolean, default false)
- `created_at` (timestamp)

**Logic:**
- Event must have at least `event_date` to appear in calendar
- `event_time` is optional (all-day event if null)
- Calendar view displays only events with `event_date` and `is_cancelled = false`
- When `is_cancelled = true`: event remains visible but marked as cancelled
- Event owner can edit full content from "My Events" section in profile
- Event owner or admin can set `is_cancelled = true`

---

## EventComments
- `id` (UUID, primary key)
- `event_id` (UUID, references Events.id, required)
- `user_id` (UUID, references Users.id, required)
- `content` (text, required)
- `created_at` (timestamp)

**Logic:**
- **Flat only** — no nesting, no `parent_comment_id` field
- Event updates/announcements posted as new comments
- Example: "The event will start 30 minutes late" → posted as a new comment

---

## ProfessionalRequests
- `id` (UUID, primary key)
- `user_id` (UUID, references Users.id, required)
- `title` (text, required)
- `description` (text, required)
- `is_hidden` (boolean, default false)
- `created_at` (timestamp)

---

## ProfessionalRequestComments
- `id` (UUID, primary key)
- `request_id` (UUID, references ProfessionalRequests.id, required)
- `user_id` (UUID, references Users.id, required)
- `content` (text, required)
- `parent_comment_id` (UUID, nullable, self-reference)
- `created_at` (timestamp)

**Logic:** Full nested thread (like ForumAnswers) — unlimited depth.

---

## Tags
- `id` (UUID, primary key)
- `name` (text, unique, required)

---

## EntityTags
- `id` (UUID, primary key)
- `tag_id` (UUID, references Tags.id, required)
- `entity_type` (enum: material / forum / recommendation / event / professional_request, required)
- `entity_id` (UUID, required)
- Composite unique constraint: (tag_id, entity_type, entity_id)

---

## MaterialsRatings
- `id` (UUID, primary key)
- `material_id` (UUID, references Materials.id, required)
- `user_id` (UUID, references Users.id, required)
- `rating` (integer, 1–5, required)
- `created_at` (timestamp)
- Composite unique constraint: (material_id, user_id)

---

## Notifications
- `id` (UUID, primary key)
- `user_id` (UUID, references Users.id, required)
- `type` (enum: comment_on_content / comment_on_recommendation / forum_answer / material_request_response, required)
- `reference_type` (text, e.g., "material", "forum", "recommendation", "event", "professional_request")
- `reference_id` (UUID)
- `is_read` (boolean, default false)
- `created_at` (timestamp)

**Notes:** In-app notifications only (no email).

---

## Reports
- `id` (UUID, primary key)
- `user_id` (UUID, references Users.id, required)
- `target_type` (enum: material / forum_question / forum_answer / recommendation / event / professional_request, required)
- `target_id` (UUID, required)
- `reason` (text, required)
- `status` (enum: open / reviewing / resolved, default "open")
- `created_at` (timestamp)

**Logic:** Admin can delete/hide reported content or mark report as resolved. Hidden content uses `is_hidden = true` on the target entity.

---

## Key Constraints & Indexes

| Table | Constraint | Type |
|-------|-----------|------|
| ExpertApprovals | (expert_id, user_id) | unique |
| MaterialsRatings | (material_id, user_id) | unique |
| EntityTags | (tag_id, entity_type, entity_id) | unique |
| ForumLikes | (user_id, target_type, target_id) | unique |

---

## Content Visibility

The following tables include `is_hidden` for admin moderation:
- Materials
- ForumQuestions
- ForumAnswers
- Recommendations
- Events
- ProfessionalRequests

Public queries exclude rows where `is_hidden = true` unless explicitly requested (e.g. owner profile views).

---

*Schema Version: 1.1 | Updated: ForumLikes + is_hidden moderation + admin category/tag management*
