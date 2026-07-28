-- Promote two or more users to admin (Supabase SQL Editor or psql).
-- Replace the UUIDs with Supabase Auth User UIDs (must exist in `users` table).
--
-- See supabase/ADMIN_SETUP.md for full instructions.

UPDATE users
SET role = 'admin'
WHERE id IN (
  'FIRST-USER-UUID-HERE',
  'SECOND-USER-UUID-HERE'
);
