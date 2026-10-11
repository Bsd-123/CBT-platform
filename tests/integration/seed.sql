-- Fixed-id fixture for the repository integration tests.
insert into auth.users (id) values
  ('a0000000-0000-4000-8000-000000000001'), ('e0000000-0000-4000-8000-000000000002'),
  ('b1000000-0000-4000-8000-000000000003'), ('b2000000-0000-4000-8000-000000000004'),
  ('c1000000-0000-4000-8000-000000000005'), ('d0000000-0000-4000-8000-000000000007');
insert into public.users (id, full_name, title, role) values
  ('a0000000-0000-4000-8000-000000000001', 'Admin', null, 'admin'),
  ('e0000000-0000-4000-8000-000000000002', 'Expert', 'PhD', 'expert'),
  ('b1000000-0000-4000-8000-000000000003', 'Member One', null, 'user'),
  ('b2000000-0000-4000-8000-000000000004', 'Member Two', null, 'user'),
  ('c1000000-0000-4000-8000-000000000005', 'Pending Person', 'Intern', 'user');
insert into public.expert_approvals (expert_id, user_id, status) values
  ('e0000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000003', 'approved'),
  ('e0000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000005', 'pending');
insert into public.material_types (key, label) values ('game', 'Games'), ('reading', 'Reading');
insert into public.tags (name, color) values ('anxiety', '#111111'), ('kids', '#222222');
