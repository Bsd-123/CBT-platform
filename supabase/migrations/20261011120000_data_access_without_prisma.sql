-- Data access without Prisma: the app now queries through supabase-js as the signed-in user,
-- so the database itself enforces who can read and write what.
--
-- Before this migration anon/authenticated had no table privileges at all (only the
-- REFERENCES/TRIGGER/TRUNCATE defaults) and ids had no default because Prisma generated them.
-- This migration:
--   1. adds uuid defaults and removes the unusable default privileges (incl. TRUNCATE),
--   2. defines helper functions used by the policies,
--   3. grants the minimum column/table privileges and creates RLS policies,
--   4. moves cross-user side effects (notifications) and multi-statement operations
--      (registration, role changes, moderation, material review) into the database.
--
-- Roles: "user" (member), "expert", "admin". A member is "active" unless their latest
-- expert approval is pending or rejected.

------------------------------------------------------------------------------
-- 1. Defaults and privilege reset
------------------------------------------------------------------------------

alter table public.expert_approvals alter column id set default gen_random_uuid();
alter table public.material_types alter column id set default gen_random_uuid();
alter table public.materials alter column id set default gen_random_uuid();
alter table public.material_requests alter column id set default gen_random_uuid();
alter table public.material_responses alter column id set default gen_random_uuid();
alter table public.forum_questions alter column id set default gen_random_uuid();
alter table public.forum_answers alter column id set default gen_random_uuid();
alter table public.forum_likes alter column id set default gen_random_uuid();
alter table public.recommendations alter column id set default gen_random_uuid();
alter table public.recommendation_comments alter column id set default gen_random_uuid();
alter table public.events alter column id set default gen_random_uuid();
alter table public.event_comments alter column id set default gen_random_uuid();
alter table public.professional_requests alter column id set default gen_random_uuid();
alter table public.professional_request_comments alter column id set default gen_random_uuid();
alter table public.tags alter column id set default gen_random_uuid();
alter table public.entity_tags alter column id set default gen_random_uuid();
alter table public.materials_ratings alter column id set default gen_random_uuid();
alter table public.notifications alter column id set default gen_random_uuid();
alter table public.reports alter column id set default gen_random_uuid();

alter table public.materials_ratings
  drop constraint if exists materials_ratings_rating_range,
  add constraint materials_ratings_rating_range check (rating between 1 and 5);

-- Make the migration self-contained: every table must have RLS on (a no-op where it already is).
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
-- Future objects created by the migration role must not be exposed automatically.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

------------------------------------------------------------------------------
-- 2. Helper functions (SECURITY DEFINER so policies can read users/approvals without
--    recursing into their own RLS; fixed search_path against hijacking)
------------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.users where id = auth.uid()), false)
$$;

create or replace function public.is_reviewer()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('expert', 'admin') from public.users where id = auth.uid()), false)
$$;

-- Registered, and not waiting on / rejected by the referring expert.
create or replace function public.is_active_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid())
    and coalesce(
      (select status = 'approved' from public.expert_approvals
        where user_id = auth.uid() order by created_at desc limit 1),
      true)
$$;

-- Does the signed-in user own the content an entity_tags row points at?
create or replace function public.owns_entity(p_type "EntityType", p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case p_type
    when 'material' then exists (select 1 from public.materials where id = p_id and user_id = auth.uid())
    when 'forum' then exists (select 1 from public.forum_questions where id = p_id and user_id = auth.uid())
    when 'recommendation' then exists (select 1 from public.recommendations where id = p_id and user_id = auth.uid())
    when 'event' then exists (select 1 from public.events where id = p_id and user_id = auth.uid())
    when 'professional_request' then exists (select 1 from public.professional_requests where id = p_id and user_id = auth.uid())
    else false
  end
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_reviewer() to authenticated;
grant execute on function public.is_active_member() to authenticated;
grant execute on function public.owns_entity("EntityType", uuid) to authenticated;

------------------------------------------------------------------------------
-- 3. Privileges + RLS policies (all roles other than `authenticated` get nothing)
------------------------------------------------------------------------------

-- users: members read profiles; everyone edits only their own name/title. Role changes and
-- registration go through the functions below.
grant select on public.users to authenticated;
grant update (full_name, title) on public.users to authenticated;
create policy users_select on public.users for select to authenticated
  using (id = auth.uid() or public.is_active_member());
create policy users_update_own on public.users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- expert_approvals: visible to the two people involved and admins; the referring expert
-- (or an admin) decides. Rows are created by register_profile().
grant select on public.expert_approvals to authenticated;
grant update (status) on public.expert_approvals to authenticated;
create policy expert_approvals_select on public.expert_approvals for select to authenticated
  using (user_id = auth.uid() or expert_id = auth.uid() or public.is_admin());
create policy expert_approvals_decide on public.expert_approvals for update to authenticated
  using (expert_id = auth.uid() or public.is_admin())
  with check (status in ('approved', 'rejected'));

-- material_types: members read, admins manage.
grant select, insert, update, delete on public.material_types to authenticated;
create policy material_types_select on public.material_types for select to authenticated
  using (public.is_active_member());
create policy material_types_admin_write on public.material_types for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- tags: members read and create, admins delete.
grant select, insert, delete on public.tags to authenticated;
create policy tags_select on public.tags for select to authenticated using (public.is_active_member());
create policy tags_insert on public.tags for insert to authenticated
  with check (public.is_active_member() and length(btrim(name)) between 1 and 40);
create policy tags_delete on public.tags for delete to authenticated using (public.is_admin());

-- entity_tags: members read; only the content owner (or an admin) attaches/detaches.
grant select, insert, delete on public.entity_tags to authenticated;
create policy entity_tags_select on public.entity_tags for select to authenticated
  using (public.is_active_member());
create policy entity_tags_insert on public.entity_tags for insert to authenticated
  with check (public.is_active_member() and (public.owns_entity(entity_type, entity_id) or public.is_admin()));
create policy entity_tags_delete on public.entity_tags for delete to authenticated
  using (public.owns_entity(entity_type, entity_id) or public.is_admin());

-- materials. Approved = visible to members; the uploader and reviewers also see pending and
-- rejected ones; hidden ones only to admins. Uploads by non-reviewers start pending; experts
-- and admins are auto-approved with themselves as reviewer. Review/hide/delete use functions.
grant select, insert on public.materials to authenticated;
create policy materials_select on public.materials for select to authenticated
  using (
    public.is_admin()
    or (public.is_active_member() and not is_hidden
        and (approval_status = 'approved' or user_id = auth.uid() or public.is_reviewer()))
  );
create policy materials_insert on public.materials for insert to authenticated
  with check (
    public.is_active_member()
    and user_id = auth.uid()
    and not is_hidden
    and file_url like 'materials/' || auth.uid()::text || '/%'
    and rejection_reason is null
    and (
      (approval_status = 'pending' and reviewed_by is null and reviewed_at is null)
      or (public.is_reviewer() and approval_status = 'approved' and reviewed_by = auth.uid())
    )
  );

-- material_requests / responses
grant select, insert on public.material_requests to authenticated;
create policy material_requests_select on public.material_requests for select to authenticated
  using (public.is_active_member());
create policy material_requests_insert on public.material_requests for insert to authenticated
  with check (public.is_active_member() and user_id = auth.uid());

grant select, insert on public.material_responses to authenticated;
create policy material_responses_select on public.material_responses for select to authenticated
  using (public.is_active_member());
create policy material_responses_insert on public.material_responses for insert to authenticated
  with check (
    public.is_active_member()
    and user_id = auth.uid()
    and (text is not null or file_url is not null)
    and (file_url is null or file_url like 'material-responses/' || auth.uid()::text || '/%')
  );

-- materials_ratings: members rate approved, visible materials; each edits only their own.
grant select, insert, update, delete on public.materials_ratings to authenticated;
create policy materials_ratings_select on public.materials_ratings for select to authenticated
  using (public.is_active_member());
create policy materials_ratings_insert on public.materials_ratings for insert to authenticated
  with check (
    public.is_active_member() and user_id = auth.uid()
    and exists (select 1 from public.materials m
                where m.id = material_id and not m.is_hidden and m.approval_status = 'approved')
  );
create policy materials_ratings_update on public.materials_ratings for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy materials_ratings_delete on public.materials_ratings for delete to authenticated
  using (user_id = auth.uid());

-- forum
grant select, insert on public.forum_questions to authenticated;
create policy forum_questions_select on public.forum_questions for select to authenticated
  using (public.is_admin() or (public.is_active_member() and not is_hidden));
create policy forum_questions_insert on public.forum_questions for insert to authenticated
  with check (public.is_active_member() and user_id = auth.uid() and not is_hidden);

grant select, insert on public.forum_answers to authenticated;
create policy forum_answers_select on public.forum_answers for select to authenticated
  using (public.is_admin() or (public.is_active_member() and not is_hidden));
create policy forum_answers_insert on public.forum_answers for insert to authenticated
  with check (
    public.is_active_member() and user_id = auth.uid() and not is_hidden
    and exists (select 1 from public.forum_questions q where q.id = question_id and not q.is_hidden)
  );

grant select, insert, delete on public.forum_likes to authenticated;
create policy forum_likes_select on public.forum_likes for select to authenticated
  using (public.is_active_member());
create policy forum_likes_insert on public.forum_likes for insert to authenticated
  with check (
    public.is_active_member() and user_id = auth.uid()
    and case target_type
      when 'question' then exists (select 1 from public.forum_questions q where q.id = target_id and not q.is_hidden)
      else exists (select 1 from public.forum_answers a where a.id = target_id and not a.is_hidden)
    end
  );
create policy forum_likes_delete on public.forum_likes for delete to authenticated
  using (user_id = auth.uid());

-- recommendations
grant select, insert on public.recommendations to authenticated;
create policy recommendations_select on public.recommendations for select to authenticated
  using (public.is_admin() or (public.is_active_member() and not is_hidden));
create policy recommendations_insert on public.recommendations for insert to authenticated
  with check (public.is_active_member() and user_id = auth.uid() and not is_hidden);

grant select, insert on public.recommendation_comments to authenticated;
create policy recommendation_comments_select on public.recommendation_comments for select to authenticated
  using (public.is_active_member());
create policy recommendation_comments_insert on public.recommendation_comments for insert to authenticated
  with check (
    public.is_active_member() and user_id = auth.uid()
    and exists (select 1 from public.recommendations r where r.id = recommendation_id and not r.is_hidden)
  );

-- events: owner or admin edits the descriptive columns only (never is_hidden).
grant select, insert on public.events to authenticated;
grant update (title, description, event_date, event_time, is_cancelled) on public.events to authenticated;
create policy events_select on public.events for select to authenticated
  using (public.is_admin() or (public.is_active_member() and not is_hidden));
create policy events_insert on public.events for insert to authenticated
  with check (public.is_active_member() and user_id = auth.uid() and not is_hidden);
create policy events_update on public.events for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

grant select, insert on public.event_comments to authenticated;
create policy event_comments_select on public.event_comments for select to authenticated
  using (public.is_active_member());
create policy event_comments_insert on public.event_comments for insert to authenticated
  with check (
    public.is_active_member() and user_id = auth.uid()
    and exists (select 1 from public.events e where e.id = event_id and not e.is_hidden)
  );

-- professional requests
grant select, insert on public.professional_requests to authenticated;
create policy professional_requests_select on public.professional_requests for select to authenticated
  using (public.is_admin() or (public.is_active_member() and not is_hidden));
create policy professional_requests_insert on public.professional_requests for insert to authenticated
  with check (public.is_active_member() and user_id = auth.uid() and not is_hidden);

grant select, insert on public.professional_request_comments to authenticated;
create policy professional_request_comments_select on public.professional_request_comments for select to authenticated
  using (public.is_active_member());
create policy professional_request_comments_insert on public.professional_request_comments for insert to authenticated
  with check (
    public.is_active_member() and user_id = auth.uid()
    and exists (select 1 from public.professional_requests p where p.id = request_id and not p.is_hidden)
  );

-- notifications: read and mark-read your own; rows are created by triggers/functions only.
grant select on public.notifications to authenticated;
grant update (is_read) on public.notifications to authenticated;
create policy "Users can read their own notifications" on public.notifications
  for select to authenticated using (auth.uid() = user_id);
create policy notifications_mark_read on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reports: file your own; read your own (admins read all); admins change status.
grant select, insert on public.reports to authenticated;
grant update (status) on public.reports to authenticated;
create policy reports_select on public.reports for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy reports_insert on public.reports for insert to authenticated
  with check (public.is_active_member() and user_id = auth.uid() and status = 'open');
create policy reports_update_status on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

------------------------------------------------------------------------------
-- 4. Triggers: reply-depth rules and notifications (the writer must not be able to
--    notify arbitrary users, so notifications are derived from the inserted row).
------------------------------------------------------------------------------

create or replace function public.enforce_forum_answer_rules()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  parent_row public.forum_answers%rowtype;
  grandparent uuid;
begin
  if new.parent_answer_id is not null then
    select * into parent_row from public.forum_answers where id = new.parent_answer_id and not is_hidden;
    if not found or parent_row.question_id <> new.question_id then
      raise exception 'Invalid parent answer.';
    end if;
    select parent_answer_id into grandparent from public.forum_answers where id = parent_row.parent_answer_id;
    if grandparent is not null then
      raise exception 'Maximum reply depth reached.';
    end if;
  end if;
  return new;
end $$;

create or replace function public.enforce_professional_comment_rules()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  parent_row public.professional_request_comments%rowtype;
  grandparent uuid;
begin
  if new.parent_comment_id is not null then
    select * into parent_row from public.professional_request_comments where id = new.parent_comment_id;
    if not found or parent_row.request_id <> new.request_id then
      raise exception 'Invalid parent comment.';
    end if;
    select parent_comment_id into grandparent from public.professional_request_comments where id = parent_row.parent_comment_id;
    if grandparent is not null then
      raise exception 'Maximum reply depth reached.';
    end if;
  end if;
  return new;
end $$;

create or replace function public.enforce_recommendation_comment_rules()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  parent_row public.recommendation_comments%rowtype;
begin
  if new.parent_comment_id is null then
    new.depth := 0;
  else
    select * into parent_row from public.recommendation_comments where id = new.parent_comment_id;
    if not found or parent_row.recommendation_id <> new.recommendation_id then
      raise exception 'Invalid parent comment.';
    end if;
    if parent_row.depth <> 0 then
      raise exception 'Recommendation comments allow only one reply level.';
    end if;
    new.depth := 1;
  end if;
  return new;
end $$;

create trigger forum_answers_rules before insert on public.forum_answers
  for each row execute function public.enforce_forum_answer_rules();
create trigger professional_comments_rules before insert on public.professional_request_comments
  for each row execute function public.enforce_professional_comment_rules();
create trigger recommendation_comments_rules before insert on public.recommendation_comments
  for each row execute function public.enforce_recommendation_comment_rules();

create or replace function public.notify_on_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  recipient uuid;
  ref_id uuid;
begin
  if tg_table_name = 'forum_answers' then
    select user_id into recipient from public.forum_questions where id = new.question_id;
    insert into public.notifications (user_id, type, reference_type, reference_id)
      select recipient, 'forum_answer', 'forum', new.question_id
      where recipient is not null and recipient <> new.user_id;
  elsif tg_table_name = 'recommendation_comments' then
    select user_id into recipient from public.recommendations where id = new.recommendation_id;
    insert into public.notifications (user_id, type, reference_type, reference_id)
      select recipient, 'comment_on_recommendation', 'recommendation', new.recommendation_id
      where recipient is not null and recipient <> new.user_id;
  elsif tg_table_name = 'event_comments' then
    select user_id into recipient from public.events where id = new.event_id;
    insert into public.notifications (user_id, type, reference_type, reference_id)
      select recipient, 'comment_on_content', 'event', new.event_id
      where recipient is not null and recipient <> new.user_id;
  elsif tg_table_name = 'professional_request_comments' then
    select user_id into recipient from public.professional_requests where id = new.request_id;
    insert into public.notifications (user_id, type, reference_type, reference_id)
      select recipient, 'comment_on_content', 'professional_request', new.request_id
      where recipient is not null and recipient <> new.user_id;
  elsif tg_table_name = 'material_responses' then
    select user_id into recipient from public.material_requests where id = new.request_id;
    insert into public.notifications (user_id, type, reference_type, reference_id)
      select recipient, 'material_request_response', 'material_request', new.request_id
      where recipient is not null and recipient <> new.user_id;
  end if;
  return new;
end $$;

create trigger forum_answers_notify after insert on public.forum_answers
  for each row execute function public.notify_on_insert();
create trigger recommendation_comments_notify after insert on public.recommendation_comments
  for each row execute function public.notify_on_insert();
create trigger event_comments_notify after insert on public.event_comments
  for each row execute function public.notify_on_insert();
create trigger professional_comments_notify after insert on public.professional_request_comments
  for each row execute function public.notify_on_insert();
create trigger material_responses_notify after insert on public.material_responses
  for each row execute function public.notify_on_insert();

------------------------------------------------------------------------------
-- 5. Functions called by the app (SECURITY DEFINER; each checks the caller itself)
------------------------------------------------------------------------------

-- Creates the caller's profile and, when a referral is given, the pending approval.
create or replace function public.register_profile(
  p_full_name text, p_title text, p_expert_code text
) returns json language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  existing public.users%rowtype;
  expert uuid;
  code text;
  created public.users%rowtype;
begin
  if uid is null then
    raise exception 'Authentication required.';
  end if;

  select * into existing from public.users where id = uid;
  if found then
    return json_build_object(
      'profile', to_json(existing),
      'pending_expert_approval',
      exists (select 1 from public.expert_approvals where user_id = uid and status = 'pending')
    );
  end if;

  if btrim(coalesce(p_full_name, '')) = '' then
    raise exception 'Full name required.';
  end if;

  p_expert_code := nullif(btrim(coalesce(p_expert_code, '')), '');

  if p_expert_code is null then
    if exists (select 1 from public.users where role = 'expert') then
      raise exception 'Expert referral code required.';
    end if;
  elsif p_expert_code ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    select id into expert from public.users where id = p_expert_code::uuid and role = 'expert';
    if expert is null then raise exception 'Invalid expert referral.'; end if;
  else
    code := upper(regexp_replace(p_expert_code, '^#', ''));
    if code !~ '^[0-9A-F]{8}$' then raise exception 'Invalid expert code format.'; end if;
    select id into expert from public.users
      where role = 'expert' and left(upper(replace(id::text, '-', '')), 8) = code
      order by created_at limit 1;
    if expert is null then raise exception 'Invalid expert referral.'; end if;
  end if;

  if expert = uid then raise exception 'Cannot refer yourself.'; end if;

  insert into public.users (id, full_name, title)
    values (uid, btrim(p_full_name), nullif(btrim(coalesce(p_title, '')), ''))
    returning * into created;

  if expert is not null then
    insert into public.expert_approvals (expert_id, user_id, status) values (expert, uid, 'pending');
  end if;

  return json_build_object('profile', to_json(created), 'pending_expert_approval', expert is not null);
end $$;

-- Whether sign-up currently requires a referral code (callable before registering).
create or replace function public.is_referral_code_required()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users where role = 'expert')
$$;

-- The caller's newest referral approval with the referring expert's name, for the "waiting for
-- approval" page (a member who is not yet approved cannot read other users' rows directly).
create or replace function public.my_registration_state()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object('status', a.status, 'expert_name', u.full_name)
  from public.expert_approvals a
  join public.users u on u.id = a.expert_id
  where a.user_id = auth.uid()
  order by a.created_at desc
  limit 1
$$;

-- Admin changes a role; the last admin cannot be demoted (serialised against races).
create or replace function public.admin_set_user_role(p_user_id uuid, p_role "UserRole")
returns json language plpgsql security definer set search_path = public as $$
declare
  old_role "UserRole";
  updated public.users%rowtype;
begin
  if not public.is_admin() then raise exception 'Forbidden'; end if;

  perform pg_advisory_xact_lock(hashtext('admin-role-change'));

  select role into old_role from public.users where id = p_user_id;
  if not found then raise exception 'User not found.'; end if;

  if old_role = 'admin' and p_role <> 'admin'
     and not exists (select 1 from public.users where role = 'admin' and id <> p_user_id) then
    raise exception 'לא ניתן להסיר את מנהל המערכת האחרון.';
  end if;

  update public.users set role = p_role where id = p_user_id returning * into updated;
  return to_json(updated);
end $$;

-- First expert/admin decision on a pending material wins; the uploader is notified.
create or replace function public.review_material(
  p_material_id uuid, p_decision "MaterialApprovalStatus", p_reason text
) returns json language plpgsql security definer set search_path = public as $$
declare
  owner uuid;
  material_title text;
  reviewer uuid := auth.uid();
begin
  if not public.is_reviewer() then raise exception 'Forbidden'; end if;
  if p_decision not in ('approved', 'rejected') then raise exception 'Invalid decision.'; end if;

  select user_id, title into owner, material_title from public.materials where id = p_material_id;
  if not found then raise exception 'Material not found.'; end if;

  update public.materials
     set approval_status = p_decision, reviewed_by = reviewer, reviewed_at = now(),
         rejection_reason = case when p_decision = 'rejected' then nullif(btrim(coalesce(p_reason, '')), '') end
   where id = p_material_id and approval_status = 'pending';
  if not found then raise exception 'Material already reviewed.'; end if;

  if owner <> reviewer then
    insert into public.notifications (user_id, type, reference_type, reference_id)
      values (owner, case when p_decision = 'approved' then 'material_approved' else 'material_rejected' end::"NotificationType",
              'material', p_material_id);
  end if;

  return json_build_object('owner_id', owner, 'title', material_title);
end $$;

-- Admin hides or restores reported content.
create or replace function public.moderate_set_hidden(
  p_type "ReportTargetType", p_id uuid, p_hidden boolean
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Forbidden'; end if;

  case p_type
    when 'material' then update public.materials set is_hidden = p_hidden where id = p_id;
    when 'forum_question' then update public.forum_questions set is_hidden = p_hidden where id = p_id;
    when 'forum_answer' then update public.forum_answers set is_hidden = p_hidden where id = p_id;
    when 'recommendation' then update public.recommendations set is_hidden = p_hidden where id = p_id;
    when 'event' then update public.events set is_hidden = p_hidden where id = p_id;
    when 'professional_request' then update public.professional_requests set is_hidden = p_hidden where id = p_id;
  end case;
  if not found then raise exception 'Report target not found.'; end if;
end $$;

-- Admin permanently deletes reported content with its dependants, atomically. Returns the
-- stored file key of a deleted material so the caller can remove the file.
create or replace function public.moderate_delete_content(p_type "ReportTargetType", p_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  file_key text;
  answer_ids uuid[];
  comment_ids uuid[];
begin
  if not public.is_admin() then raise exception 'Forbidden'; end if;

  case p_type
    when 'material' then
      select file_url into file_key from public.materials where id = p_id;
      delete from public.materials_ratings where material_id = p_id;
      delete from public.entity_tags where entity_type = 'material' and entity_id = p_id;
      delete from public.materials where id = p_id;
    when 'forum_question' then
      select coalesce(array_agg(id), '{}') into answer_ids from public.forum_answers where question_id = p_id;
      delete from public.forum_likes where target_type = 'answer' and target_id = any(answer_ids);
      delete from public.forum_answers where question_id = p_id;
      delete from public.forum_likes where target_type = 'question' and target_id = p_id;
      delete from public.entity_tags where entity_type = 'forum' and entity_id = p_id;
      delete from public.forum_questions where id = p_id;
    when 'forum_answer' then
      with recursive tree as (
        select id from public.forum_answers where id = p_id
        union all
        select a.id from public.forum_answers a join tree t on a.parent_answer_id = t.id
      )
      select array_agg(id) into answer_ids from tree;
      delete from public.forum_likes where target_type = 'answer' and target_id = any(answer_ids);
      delete from public.forum_answers where id = any(answer_ids);
    when 'recommendation' then
      delete from public.recommendation_comments where recommendation_id = p_id;
      delete from public.entity_tags where entity_type = 'recommendation' and entity_id = p_id;
      delete from public.recommendations where id = p_id;
    when 'event' then
      delete from public.event_comments where event_id = p_id;
      delete from public.entity_tags where entity_type = 'event' and entity_id = p_id;
      delete from public.events where id = p_id;
    when 'professional_request' then
      delete from public.professional_request_comments where request_id = p_id;
      delete from public.entity_tags where entity_type = 'professional_request' and entity_id = p_id;
      delete from public.professional_requests where id = p_id;
  end case;

  return file_key;
end $$;

grant execute on function public.register_profile(text, text, text) to authenticated;
grant execute on function public.my_registration_state() to authenticated;
grant execute on function public.is_referral_code_required() to authenticated, anon;
grant execute on function public.admin_set_user_role(uuid, "UserRole") to authenticated;
grant execute on function public.review_material(uuid, "MaterialApprovalStatus", text) to authenticated;
grant execute on function public.moderate_set_hidden("ReportTargetType", uuid, boolean) to authenticated;
grant execute on function public.moderate_delete_content("ReportTargetType", uuid) to authenticated;
