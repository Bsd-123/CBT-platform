-- Expert approval for uploaded materials.
--
-- Safe to apply on a live database: only adds a type, nullable/defaulted columns,
-- an index and two enum values. Existing materials stay visible because the column
-- defaults to 'approved'; the application sets 'pending' explicitly for uploads by
-- regular users (experts and admins are auto-approved).
--
-- Apply BEFORE deploying the application code that reads these columns.

create type "MaterialApprovalStatus" as enum ('pending', 'approved', 'rejected');

alter table public.materials
  add column approval_status  "MaterialApprovalStatus" not null default 'approved',
  add column reviewed_by      uuid,
  add column reviewed_at      timestamptz,
  add column rejection_reason text;

-- Reviewer is kept as a plain uuid (no FK) so deleting a reviewer account never
-- blocks or cascades into content decisions.

create index materials_approval_status_created_at_idx
  on public.materials (approval_status, created_at);

-- New notification types: the uploader is told about the decision.
alter type "NotificationType" add value if not exists 'material_approved';
alter type "NotificationType" add value if not exists 'material_rejected';

-- Rollback (manual):
--   drop index if exists materials_approval_status_created_at_idx;
--   alter table public.materials drop column approval_status, drop column reviewed_by,
--     drop column reviewed_at, drop column rejection_reason;
--   drop type "MaterialApprovalStatus";
--   (enum values added to "NotificationType" cannot be removed without recreating the type)
