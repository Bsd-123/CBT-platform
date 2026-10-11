#!/usr/bin/env bash
# Applies the schema + migration to a throwaway database in a local Postgres container and
# runs the RLS tests. Usage: tests/db/run.sh [container]   (default container: rls-test)
set -euo pipefail
C="${1:-rls-test}"
cd "$(dirname "$0")/../.."
psql() { docker exec -i "$C" psql -U postgres -v ON_ERROR_STOP=1 -q "$@"; }
docker exec "$C" psql -U postgres -q -c "drop database if exists rlstest" -c "create database rlstest" >/dev/null
# roles are cluster-wide: create once
docker exec "$C" psql -U postgres -tAc "select 1 from pg_roles where rolname='anon'" | grep -q 1 || \
  docker exec -i "$C" psql -U postgres -q -c "create role anon nologin" -c "create role authenticated nologin" -c "create role service_role nologin bypassrls"
sed -e '/^create role/d' tests/db/00_supabase_stub.sql | psql -d rlstest
psql -d rlstest < tests/db/01_base_schema.sql
for f in supabase/migrations/20261011120000_data_access_without_prisma.sql supabase/migrations/20261011184504_restrict_function_execute_to_authenticated.sql supabase/migrations/20261011192205_forum_question_domain.sql supabase/migrations/20261011200642_forum_question_tags_optional.sql supabase/migrations/20261011214437_event_favorites.sql; do psql -d rlstest < "$f"; done
psql -d rlstest < tests/db/10_rls_tests.sql
