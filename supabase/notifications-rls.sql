-- Row Level Security for notifications, safe to apply BEFORE enabling deny-all RLS
-- on the other tables (see ACTION_PLAN.md INF-05).
--
-- The app reads and writes notifications through Prisma (server-side, bypasses RLS).
-- The only browser access is the Supabase Realtime subscription in
-- src/components/notifications/NotificationsBell.tsx, which uses the anon key plus
-- the logged-in user's JWT. Realtime evaluates RLS per subscriber, so each user must
-- be allowed to SELECT their own rows - and nothing else.

alter table public.notifications enable row level security;

drop policy if exists "Users can read their own notifications" on public.notifications;
create policy "Users can read their own notifications"
  on public.notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

-- No insert/update/delete policies: the browser must never write notifications.

-- Make sure the table is part of the Realtime publication (no-op if already added).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
