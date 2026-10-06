-- Let each signed-in user read only their own notifications. The app writes and reads
-- notifications through Prisma (server side, bypasses RLS); this policy exists so the
-- Supabase Realtime subscription in the browser can deliver a user's own rows.
--
-- Applied to project ywdxabrpljigkmczkgrw via the Supabase MCP on 2026-10-06
-- (version 20261006141156). Supersedes supabase/notifications-rls.sql.

create policy "Users can read their own notifications"
  on public.notifications
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- The publication was empty, so Realtime had nothing to broadcast.
alter publication supabase_realtime add table public.notifications;

-- Rollback (manual):
--   alter publication supabase_realtime drop table public.notifications;
--   drop policy "Users can read their own notifications" on public.notifications;
