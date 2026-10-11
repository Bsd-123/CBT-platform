#!/usr/bin/env bash
# Integration tests: the real repositories against PostgREST + a scratch Postgres with the
# migration applied. Needs Docker and the images postgres:16 and postgrest/postgrest.
# Usage: tests/integration/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
PG=rls-test; REST=rls-postgrest; NET=rlsnet; DB=apitest
JWT_SECRET="integration-test-secret-integration-test-secret"

docker network inspect $NET >/dev/null 2>&1 || docker network create $NET >/dev/null
docker ps --format '{{.Names}}' | grep -qx $PG || docker run -d --name $PG -e POSTGRES_PASSWORD=test -p 54329:5432 postgres:16 >/dev/null
docker network connect $NET $PG 2>/dev/null || true
for i in $(seq 1 30); do docker exec $PG pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done

docker rm -f $REST >/dev/null 2>&1 || true
psql() { docker exec -i $PG psql -U postgres -v ON_ERROR_STOP=1 -q "$@"; }
docker exec $PG psql -U postgres -q -c "drop database if exists $DB with (force)" -c "create database $DB" >/dev/null
docker exec $PG psql -U postgres -tAc "select 1 from pg_roles where rolname='anon'" | grep -q 1 || \
  docker exec $PG psql -U postgres -q -c "create role anon nologin" -c "create role authenticated nologin" -c "create role service_role nologin bypassrls"
docker exec $PG psql -U postgres -tAc "select 1 from pg_roles where rolname='authenticator'" | grep -q 1 || \
  docker exec $PG psql -U postgres -q -c "create role authenticator login noinherit password 'auth'"
docker exec $PG psql -U postgres -q -c "grant anon, authenticated to authenticator"

sed -e '/^create role/d' tests/db/00_supabase_stub.sql | psql -d $DB
psql -d $DB < tests/db/01_base_schema.sql
psql -d $DB < supabase/migrations/20261011120000_data_access_without_prisma.sql
psql -d $DB < supabase/migrations/20261011184504_restrict_function_execute_to_authenticated.sql
psql -d $DB < tests/integration/seed.sql

docker run -d --name $REST --network $NET -p 54330:3000 \
  -e PGRST_DB_URI="postgres://authenticator:auth@$PG:5432/$DB" \
  -e PGRST_DB_SCHEMAS=public -e PGRST_DB_ANON_ROLE=anon \
  -e PGRST_JWT_SECRET="$JWT_SECRET" postgrest/postgrest:v12.2.12 >/dev/null
for i in $(seq 1 30); do curl -s -o /dev/null http://localhost:54330/ && break; sleep 1; done

POSTGREST_URL=http://localhost:54330 POSTGREST_JWT_SECRET="$JWT_SECRET" \
  npx vitest run --config vitest.integration.config.mts "$@"
