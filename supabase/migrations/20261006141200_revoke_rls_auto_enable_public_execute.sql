-- rls_auto_enable() is the ensure_rls event trigger function (it auto-enables RLS on new
-- public tables). Event triggers fire without a caller EXECUTE check, so the function does
-- not need to be callable through the REST API (/rest/v1/rpc/rls_auto_enable) by anon or
-- authenticated users. Flagged by the Supabase security advisor (lints 0028 and 0029).
--
-- Applied to project ywdxabrpljigkmczkgrw via the Supabase MCP on 2026-10-06
-- (version 20261006141200).

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Rollback (manual):
--   grant execute on function public.rls_auto_enable() to public;
