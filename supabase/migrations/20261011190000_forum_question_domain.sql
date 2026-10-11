-- Every forum question belongs to a domain, chosen from the existing tag list.
-- The column stays nullable so questions created before this migration remain valid;
-- they are backfilled below, and new questions must carry one (enforced by the policy).

alter table public.forum_questions
  add column if not exists domain_tag_id uuid references public.tags (id) on delete set null;

create index if not exists forum_questions_domain_tag_id_idx on public.forum_questions (domain_tag_id);

-- Backfill: the alphabetically first tag already attached to each existing question.
update public.forum_questions q
   set domain_tag_id = (
     select et.tag_id
       from public.entity_tags et
       join public.tags t on t.id = et.tag_id
      where et.entity_type = 'forum' and et.entity_id = q.id
      order by t.name
      limit 1
   )
 where q.domain_tag_id is null;

-- New questions must name a domain.
drop policy if exists forum_questions_insert on public.forum_questions;
create policy forum_questions_insert on public.forum_questions for insert to authenticated
  with check (
    public.is_active_member() and user_id = auth.uid() and not is_hidden
    and domain_tag_id is not null
  );
