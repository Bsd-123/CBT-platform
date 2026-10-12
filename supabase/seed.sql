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
  ('CBT', 'slate'),
  ('חרדה', 'rose'),
  ('ילדים', 'sage'),
  ('התנהגות', 'sand'),
  ('דיכאון', 'plum'),
  ('הערכה', 'terracotta'),
  ('הורים', 'sea'),
  ('פגיעות', 'olive')
on conflict (name) do update set color = excluded.color;
