-- Forum questions no longer need a domain: tags are optional and picked per question (entity_tags).
-- The domain chosen under the previous migration was also stored as a regular tag on the question,
-- so dropping the column loses no information.

drop policy if exists forum_questions_insert on public.forum_questions;
create policy forum_questions_insert on public.forum_questions for insert to authenticated
  with check (public.is_active_member() and user_id = auth.uid() and not is_hidden);

drop index if exists public.forum_questions_domain_tag_id_idx;
alter table public.forum_questions drop column if exists domain_tag_id;
