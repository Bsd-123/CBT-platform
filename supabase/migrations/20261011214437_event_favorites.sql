-- Members can favorite (star) events to be emailed when the organizer changes them.
-- Each member sees and edits only their own favorites. The server looks up who favorited an
-- event with the service-role key when it sends the update emails, so no member can read
-- another member's favorites.

-- The surrogate primary key is deliberate: with a composite key made of the two foreign keys,
-- PostgREST treats this as a many-to-many link between events and users, which makes every
-- `events` -> `users` embed ambiguous and breaks existing queries.
create table if not exists public.event_favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  event_id   uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create index if not exists event_favorites_event_id_idx on public.event_favorites (event_id);

alter table public.event_favorites enable row level security;

grant select, insert, delete on public.event_favorites to authenticated;

create policy event_favorites_select on public.event_favorites for select to authenticated
  using (user_id = auth.uid());

create policy event_favorites_insert on public.event_favorites for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.is_active_member()
    and exists (select 1 from public.events e where e.id = event_id and not e.is_hidden)
  );

create policy event_favorites_delete on public.event_favorites for delete to authenticated
  using (user_id = auth.uid());
