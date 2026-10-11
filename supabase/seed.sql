-- Reference data (replaces the old Prisma seed). Safe to run repeatedly in the Supabase SQL
-- editor: existing rows are updated, nothing is deleted. Admins are promoted separately with
-- supabase/promote-admins.sql.

insert into public.material_types (key, label, icon) values
  ('game', 'משחק', null),
  ('reading', 'קריאה', null),
  ('worksheet', 'דף עבודה', null),
  ('treatment_plan', 'תוכנית טיפול', null),
  ('presentation', 'מצגת', null),
  ('video', 'וידאו', null)
on conflict (key) do update set label = excluded.label, icon = excluded.icon;

insert into public.tags (name, color) values
  ('CBT', '#6366f1'),
  ('חרדה', '#ec4899'),
  ('ילדים', '#14b8a6'),
  ('התנהגות', '#f59e0b'),
  ('דיכאון', '#8b5cf6'),
  ('הערכה', '#ef4444'),
  ('הורים', '#0ea5e9'),
  ('פגיעות', '#84cc16')
on conflict (name) do update set color = excluded.color;
