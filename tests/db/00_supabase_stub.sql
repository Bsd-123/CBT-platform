-- Minimal stand-in for the Supabase pieces the policies depend on (local testing only).
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant usage on schema public to anon, authenticated;
create schema auth;
create table auth.users (id uuid primary key);
-- PostgREST sets request.jwt.claims (JSON); the SQL tests set request.jwt.claim.sub directly.
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')
  )::uuid
$$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
