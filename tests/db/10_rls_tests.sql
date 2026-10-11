-- RLS / function tests. Run against a scratch Postgres that has 00_supabase_stub.sql,
-- 01_base_schema.sql and the data-access migration applied (see tests/db/run.sh).
\set ON_ERROR_STOP on
\set QUIET on

create table t_results (label text, expect text, actual text, pass boolean);

-- Runs `stmt` as `uid` with role `authenticated` (or anon when role_name = 'anon').
-- expect: ok | denied | error:<substring> | rows:N (SELECT) | affected:N (DML)
create or replace function t_run(label text, uid uuid, stmt text, expect text, role_name text default 'authenticated')
returns void language plpgsql as $$
declare
  n bigint;
  res text;
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid::text, ''), true);
  execute format('set local role %I', role_name);
  begin
    if expect like 'rows:%' then
      execute 'select count(*) from (' || stmt || ') s' into n;
      res := 'rows:' || n;
    else
      execute stmt;
      get diagnostics n = row_count;
      res := case when expect like 'affected:%' then 'affected:' || n else 'ok' end;
    end if;
  exception when others then
    res := 'error:' || sqlerrm;
  end;
  reset role;
  insert into t_results values (
    label, expect, res,
    case
      when expect = 'denied' then res like 'error:%'
      when expect like 'error:%' then res like '%' || substr(expect, 7) || '%'
      else res = expect
    end
  );
end $$;

-- Fixed ids. users: admin, expert, two members, one awaiting approval, one rejected, one stranger (no profile).
\set admin   '''a0000000-0000-4000-8000-000000000001'''
\set expert  '''e0000000-0000-4000-8000-000000000002'''
\set m1      '''b1000000-0000-4000-8000-000000000003'''
\set m2      '''b2000000-0000-4000-8000-000000000004'''
\set pending '''c1000000-0000-4000-8000-000000000005'''
\set rejected '''c2000000-0000-4000-8000-000000000006'''
\set stranger '''d0000000-0000-4000-8000-000000000007'''

insert into auth.users (id) values (:admin), (:expert), (:m1), (:m2), (:pending), (:rejected), (:stranger);
insert into public.users (id, full_name, role) values
  (:admin, 'Admin', 'admin'), (:expert, 'Expert', 'expert'), (:m1, 'Member One', 'user'),
  (:m2, 'Member Two', 'user'), (:pending, 'Pending', 'user'), (:rejected, 'Rejected', 'user');
insert into public.expert_approvals (expert_id, user_id, status) values
  (:expert, :m1, 'approved'), (:expert, :pending, 'pending'), (:expert, :rejected, 'rejected');
-- m2 has no approval row at all => active (matches the app's "none" status).

insert into public.material_types (key, label) values ('game', 'Games');
insert into public.tags (name) values ('anxiety');

-- Seed content as postgres (bypasses RLS).
insert into public.materials (id, user_id, title, description, file_url, material_type_id, approval_status, reviewed_by) values
  ('11111111-0000-4000-8000-000000000001', :m1, 'Approved by m1', 'd', 'materials/b1000000-0000-4000-8000-000000000003/1-a.pdf',
     (select id from public.material_types limit 1), 'approved', :expert),
  ('11111111-0000-4000-8000-000000000002', :m1, 'Pending by m1', 'd', 'materials/b1000000-0000-4000-8000-000000000003/2-b.pdf',
     (select id from public.material_types limit 1), 'pending', null);
insert into public.materials (id, user_id, title, description, file_url, material_type_id, approval_status, is_hidden) values
  ('11111111-0000-4000-8000-000000000003', :m1, 'Hidden approved', 'd', 'materials/x/3-c.pdf',
     (select id from public.material_types limit 1), 'approved', true);
insert into public.forum_questions (id, user_id, title, content) values
  ('22222222-0000-4000-8000-000000000001', :expert, 'Q by expert', 'c');
insert into public.forum_questions (id, user_id, title, content, is_hidden) values
  ('22222222-0000-4000-8000-000000000002', :m1, 'Hidden Q', 'c', true);
insert into public.recommendations (id, user_id, content) values
  ('33333333-0000-4000-8000-000000000001', :m1, 'rec');
insert into public.events (id, user_id, title, description) values
  ('44444444-0000-4000-8000-000000000001', :m1, 'Event', 'd');
insert into public.professional_requests (id, user_id, title, description) values
  ('55555555-0000-4000-8000-000000000001', :m1, 'Req', 'd');
insert into public.material_requests (id, user_id, title, description) values
  ('66666666-0000-4000-8000-000000000001', :m1, 'MReq', 'd');
insert into public.notifications (user_id, type) values (:m1, 'forum_answer'), (:m2, 'forum_answer');

-- ===================== anonymous / no profile =====================
select t_run('anon cannot read users', null, 'select * from public.users', 'denied', 'anon');
select t_run('anon cannot read materials', null, 'select * from public.materials', 'denied', 'anon');
select t_run('anon can read referral-required flag', null, 'select public.is_referral_code_required()', 'ok', 'anon');
select t_run('stranger (no profile) sees no users', :stranger, 'select * from public.users', 'rows:0');
select t_run('stranger sees no materials', :stranger, 'select * from public.materials', 'rows:0');
select t_run('stranger cannot post a question', :stranger,
  format($q$insert into public.forum_questions (user_id, title, content) values (%L, 't', 'c')$q$, :stranger), 'denied');
select t_run('authenticated cannot TRUNCATE', :m1, 'truncate public.tags', 'denied');

-- ===================== users =====================
select t_run('member sees all profiles', :m1, 'select * from public.users', 'rows:6');
select t_run('pending member sees only self', :pending, 'select * from public.users', 'rows:1');
select t_run('rejected member sees only self', :rejected, 'select * from public.users', 'rows:1');
select t_run('member edits own title', :m1, format('update public.users set title = ''Dr'' where id = %L', :m1), 'affected:1');
select t_run('member cannot change own role', :m1, format('update public.users set role = ''admin'' where id = %L', :m1), 'denied');
select t_run('member cannot edit someone else', :m1, format('update public.users set title = ''x'' where id = %L', :m2), 'affected:0');
select t_run('member cannot insert a profile', :m1, format($q$insert into public.users (id, full_name, role) values (gen_random_uuid(), 'x', 'admin')$q$), 'denied');
select t_run('member cannot delete a profile', :m1, format('delete from public.users where id = %L', :m2), 'denied');
select t_run('member cannot call admin_set_user_role', :m1, format('select public.admin_set_user_role(%L, ''admin'')', :m1), 'error:Forbidden');
select t_run('admin promotes member to expert', :admin, format('select public.admin_set_user_role(%L, ''expert'')', :m2), 'ok');
select t_run('admin demotes it back', :admin, format('select public.admin_set_user_role(%L, ''user'')', :m2), 'ok');
select t_run('last admin cannot be demoted', :admin, format('select public.admin_set_user_role(%L, ''user'')', :admin), 'error:מנהל המערכת האחרון');

-- ===================== expert approvals =====================
select t_run('uninvolved member sees no approvals', :m2, 'select * from public.expert_approvals', 'rows:0');
select t_run('expert sees own referrals', :expert, 'select * from public.expert_approvals', 'rows:3');
select t_run('pending user sees own approval row', :pending, 'select * from public.expert_approvals', 'rows:1');
select t_run('admin sees all approvals', :admin, 'select * from public.expert_approvals', 'rows:3');
select t_run('user cannot approve self', :pending, format('update public.expert_approvals set status = ''approved'' where user_id = %L', :pending), 'affected:0');
select t_run('expert cannot set pending', :expert, format('update public.expert_approvals set status = ''pending'' where user_id = %L', :rejected), 'denied');
select t_run('expert approves referral', :expert, format('update public.expert_approvals set status = ''approved'' where user_id = %L', :pending), 'affected:1');
select t_run('approved user now sees everyone', :pending, 'select * from public.users', 'rows:6');
select t_run('user cannot insert an approval row', :m2, format($q$insert into public.expert_approvals (expert_id, user_id, status) values (%L, %L, 'approved')$q$, :m2, :m2), 'denied');
update public.expert_approvals set status = 'pending' where user_id = :pending;  -- restore for later tests

-- ===================== materials =====================
select t_run('member sees approved + own pending (hidden excluded)', :m1, 'select * from public.materials', 'rows:2');
select t_run('other member sees approved only', :m2, 'select * from public.materials', 'rows:1');
select t_run('pending-approval user sees no materials', :pending, 'select * from public.materials', 'rows:0');
select t_run('expert sees approved + pending', :expert, 'select * from public.materials', 'rows:2');
select t_run('admin sees hidden too', :admin, 'select * from public.materials', 'rows:3');
select t_run('member uploads as pending', :m2,
  format($q$insert into public.materials (user_id, title, description, file_url, material_type_id, approval_status)
    values (%L, 't', 'd', 'materials/b2000000-0000-4000-8000-000000000004/9-z.pdf', (select id from public.material_types limit 1), 'pending')$q$, :m2), 'ok');
select t_run('member cannot self-approve on upload', :m2,
  format($q$insert into public.materials (user_id, title, description, file_url, material_type_id, approval_status, reviewed_by)
    values (%L, 't', 'd', 'materials/b2000000-0000-4000-8000-000000000004/9-y.pdf', (select id from public.material_types limit 1), 'approved', %L)$q$, :m2, :m2), 'denied');
select t_run('member cannot upload as someone else', :m2,
  format($q$insert into public.materials (user_id, title, description, file_url, material_type_id)
    values (%L, 't', 'd', 'materials/b1000000-0000-4000-8000-000000000003/9-x.pdf', (select id from public.material_types limit 1))$q$, :m1), 'denied');
select t_run('file key must be under own prefix', :m2,
  format($q$insert into public.materials (user_id, title, description, file_url, material_type_id, approval_status)
    values (%L, 't', 'd', 'materials/b1000000-0000-4000-8000-000000000003/stolen.pdf', (select id from public.material_types limit 1), 'pending')$q$, :m2), 'denied');
select t_run('expert auto-approved upload ok', :expert,
  format($q$insert into public.materials (user_id, title, description, file_url, material_type_id, approval_status, reviewed_by, reviewed_at)
    values (%L, 't', 'd', 'materials/e0000000-0000-4000-8000-000000000002/1-e.pdf', (select id from public.material_types limit 1), 'approved', %L, now())$q$, :expert, :expert), 'ok');
select t_run('expert cannot forge another reviewer', :expert,
  format($q$insert into public.materials (user_id, title, description, file_url, material_type_id, approval_status, reviewed_by)
    values (%L, 't', 'd', 'materials/e0000000-0000-4000-8000-000000000002/2-e.pdf', (select id from public.material_types limit 1), 'approved', %L)$q$, :expert, :admin), 'denied');
select t_run('inactive user cannot upload', :pending,
  format($q$insert into public.materials (user_id, title, description, file_url, material_type_id, approval_status)
    values (%L, 't', 'd', 'materials/c1000000-0000-4000-8000-000000000005/1.pdf', (select id from public.material_types limit 1), 'pending')$q$, :pending), 'denied');
select t_run('owner cannot edit material directly', :m1, format('update public.materials set title = ''x'' where id = %L', '11111111-0000-4000-8000-000000000001'), 'denied');
select t_run('owner cannot approve own material directly', :m1, format('update public.materials set approval_status = ''approved'' where id = %L', '11111111-0000-4000-8000-000000000002'), 'denied');
select t_run('member cannot delete material', :m1, format('delete from public.materials where id = %L', '11111111-0000-4000-8000-000000000001'), 'denied');
select t_run('member cannot review', :m1, format('select public.review_material(%L, ''approved'', null)', '11111111-0000-4000-8000-000000000002'), 'error:Forbidden');
select t_run('expert approves pending material', :expert, format('select public.review_material(%L, ''approved'', null)', '11111111-0000-4000-8000-000000000002'), 'ok');
select t_run('second review loses', :admin, format('select public.review_material(%L, ''rejected'', ''late'')', '11111111-0000-4000-8000-000000000002'), 'error:already reviewed');
select t_run('uploader notified of approval', :m1, $q$select * from public.notifications where type = 'material_approved'$q$, 'rows:1');

-- ===================== ratings =====================
select t_run('member rates approved material', :m2, format('insert into public.materials_ratings (material_id, user_id, rating) values (%L, %L, 5)', '11111111-0000-4000-8000-000000000001', :m2), 'ok');
select t_run('rating above 5 rejected', :m1, format('insert into public.materials_ratings (material_id, user_id, rating) values (%L, %L, 6)', '11111111-0000-4000-8000-000000000001', :m1), 'denied');
select t_run('cannot rate hidden material', :m1, format('insert into public.materials_ratings (material_id, user_id, rating) values (%L, %L, 3)', '11111111-0000-4000-8000-000000000003', :m1), 'denied');
select t_run('cannot rate as someone else', :m1, format('insert into public.materials_ratings (material_id, user_id, rating) values (%L, %L, 3)', '11111111-0000-4000-8000-000000000001', :m2), 'denied');
select t_run('owner updates own rating', :m2, format('update public.materials_ratings set rating = 4 where user_id = %L', :m2), 'affected:1');
select t_run('cannot update others rating', :m1, format('update public.materials_ratings set rating = 1 where user_id = %L', :m2), 'affected:0');

-- ===================== forum + notifications + depth rules =====================
select t_run('member sees visible question only', :m1, 'select * from public.forum_questions', 'rows:1');
select t_run('admin sees hidden question', :admin, 'select * from public.forum_questions', 'rows:2');
select t_run('member posts question', :m1, format($q$insert into public.forum_questions (user_id, title, content) values (%L, 't', 'c')$q$, :m1), 'ok');
select t_run('cannot post as someone else', :m1, format($q$insert into public.forum_questions (user_id, title, content) values (%L, 't', 'c')$q$, :m2), 'denied');
select t_run('cannot post pre-hidden', :m1, format($q$insert into public.forum_questions (user_id, title, content, is_hidden) values (%L, 't', 'c', true)$q$, :m1), 'denied');
select t_run('cannot answer hidden question', :m1, format($q$insert into public.forum_answers (question_id, user_id, content) values (%L, %L, 'a')$q$, '22222222-0000-4000-8000-000000000002', :m1), 'denied');
select t_run('answer ok', :m1, format($q$insert into public.forum_answers (id, question_id, user_id, content) values ('77777777-0000-4000-8000-000000000001', %L, %L, 'a')$q$, '22222222-0000-4000-8000-000000000001', :m1), 'ok');
select t_run('question owner notified of answer', :expert, $q$select * from public.notifications where type = 'forum_answer'$q$, 'rows:1');
select t_run('answering own question does not notify', :expert, format($q$insert into public.forum_answers (question_id, user_id, content) values (%L, %L, 'self')$q$, '22222222-0000-4000-8000-000000000001', :expert), 'ok');
select t_run('still one notification for expert', :expert, $q$select * from public.notifications where type = 'forum_answer'$q$, 'rows:1');
select t_run('reply level 2 ok', :m2, format($q$insert into public.forum_answers (id, question_id, user_id, content, parent_answer_id) values ('77777777-0000-4000-8000-000000000002', %L, %L, 'r1', '77777777-0000-4000-8000-000000000001')$q$, '22222222-0000-4000-8000-000000000001', :m2), 'ok');
select t_run('reply level 3 ok', :m2, format($q$insert into public.forum_answers (id, question_id, user_id, content, parent_answer_id) values ('77777777-0000-4000-8000-000000000003', %L, %L, 'r2', '77777777-0000-4000-8000-000000000002')$q$, '22222222-0000-4000-8000-000000000001', :m2), 'ok');
select t_run('reply level 4 rejected', :m2, format($q$insert into public.forum_answers (question_id, user_id, content, parent_answer_id) values (%L, %L, 'r3', '77777777-0000-4000-8000-000000000003')$q$, '22222222-0000-4000-8000-000000000001', :m2), 'error:Maximum reply depth');
select t_run('parent from another question rejected', :m2, format($q$insert into public.forum_answers (question_id, user_id, content, parent_answer_id) values (%L, %L, 'x', '77777777-0000-4000-8000-000000000001')$q$, (select id from public.forum_questions where title = 't' limit 1), :m2), 'error:Invalid parent answer');
select t_run('like ok', :m2, format($q$insert into public.forum_likes (user_id, target_type, target_id) values (%L, 'question', %L)$q$, :m2, '22222222-0000-4000-8000-000000000001'), 'ok');
select t_run('duplicate like blocked', :m2, format($q$insert into public.forum_likes (user_id, target_type, target_id) values (%L, 'question', %L)$q$, :m2, '22222222-0000-4000-8000-000000000001'), 'denied');
select t_run('like on behalf of another denied', :m2, format($q$insert into public.forum_likes (user_id, target_type, target_id) values (%L, 'answer', %L)$q$, :m1, '77777777-0000-4000-8000-000000000001'), 'denied');
select t_run('cannot remove others like', :m1, format('delete from public.forum_likes where user_id = %L', :m2), 'affected:0');
select t_run('remove own like', :m2, format('delete from public.forum_likes where user_id = %L', :m2), 'affected:1');

-- ===================== recommendations =====================
select t_run('comment ok', :m2, format($q$insert into public.recommendation_comments (id, recommendation_id, user_id, content, depth) values ('88888888-0000-4000-8000-000000000001', %L, %L, 'c', 5)$q$, '33333333-0000-4000-8000-000000000001', :m2), 'ok');
select t_run('depth is forced by the database', :m2, $q$select * from public.recommendation_comments where id = '88888888-0000-4000-8000-000000000001' and depth = 0$q$, 'rows:1');
select t_run('reply to comment ok', :m1, format($q$insert into public.recommendation_comments (id, recommendation_id, user_id, content, parent_comment_id) values ('88888888-0000-4000-8000-000000000002', %L, %L, 'r', '88888888-0000-4000-8000-000000000001')$q$, '33333333-0000-4000-8000-000000000001', :m1), 'ok');
select t_run('reply to reply rejected', :m2, format($q$insert into public.recommendation_comments (recommendation_id, user_id, content, parent_comment_id) values (%L, %L, 'rr', '88888888-0000-4000-8000-000000000002')$q$, '33333333-0000-4000-8000-000000000001', :m2), 'error:one reply level');

-- ===================== events / professional requests / material requests =====================
select t_run('owner edits event', :m1, format('update public.events set title = ''New'' where id = %L', '44444444-0000-4000-8000-000000000001'), 'affected:1');
select t_run('other member cannot edit event', :m2, format('update public.events set title = ''Hijack'' where id = %L', '44444444-0000-4000-8000-000000000001'), 'affected:0');
select t_run('admin edits any event', :admin, format('update public.events set is_cancelled = true where id = %L', '44444444-0000-4000-8000-000000000001'), 'affected:1');
select t_run('owner cannot hide own event', :m1, format('update public.events set is_hidden = true where id = %L', '44444444-0000-4000-8000-000000000001'), 'denied');
select t_run('event comment notifies owner', :m2, format($q$insert into public.event_comments (event_id, user_id, content) values (%L, %L, 'hi')$q$, '44444444-0000-4000-8000-000000000001', :m2), 'ok');
select t_run('event owner got notification', :m1, $q$select * from public.notifications where type = 'comment_on_content' and reference_type = 'event'$q$, 'rows:1');
select t_run('pro-request comment ok', :m2, format($q$insert into public.professional_request_comments (id, request_id, user_id, content) values ('99999999-0000-4000-8000-000000000001', %L, %L, 'c')$q$, '55555555-0000-4000-8000-000000000001', :m2), 'ok');
select t_run('material response needs text or file', :m2, format($q$insert into public.material_responses (request_id, user_id) values (%L, %L)$q$, '66666666-0000-4000-8000-000000000001', :m2), 'denied');
select t_run('response file under own prefix ok', :m2, format($q$insert into public.material_responses (request_id, user_id, file_url) values (%L, %L, 'material-responses/b2000000-0000-4000-8000-000000000004/1-r.pdf')$q$, '66666666-0000-4000-8000-000000000001', :m2), 'ok');
select t_run('response file under another prefix denied', :m2, format($q$insert into public.material_responses (request_id, user_id, file_url) values (%L, %L, 'material-responses/b1000000-0000-4000-8000-000000000003/1-r.pdf')$q$, '66666666-0000-4000-8000-000000000001', :m2), 'denied');
select t_run('request owner notified of response', :m1, $q$select * from public.notifications where type = 'material_request_response'$q$, 'rows:1');

-- ===================== tags =====================
select t_run('member creates tag', :m1, $q$insert into public.tags (name) values ('mindfulness')$q$, 'ok');
select t_run('overlong tag rejected', :m1, format($q$insert into public.tags (name) values (%L)$q$, repeat('x', 41)), 'denied');
select t_run('member cannot delete tag', :m1, $q$delete from public.tags where name = 'mindfulness'$q$, 'affected:0');
select t_run('owner attaches tag', :m1, format($q$insert into public.entity_tags (tag_id, entity_type, entity_id) values ((select id from public.tags where name = 'anxiety'), 'material', %L)$q$, '11111111-0000-4000-8000-000000000001'), 'ok');
select t_run('non-owner cannot attach tag', :m2, format($q$insert into public.entity_tags (tag_id, entity_type, entity_id) values ((select id from public.tags where name = 'anxiety'), 'material', %L)$q$, '11111111-0000-4000-8000-000000000002'), 'denied');
select t_run('non-owner cannot detach tag', :m2, $q$delete from public.entity_tags$q$, 'affected:0');
select t_run('material type managed by admin only', :m1, $q$insert into public.material_types (key, label) values ('video', 'v')$q$, 'denied');
select t_run('admin adds material type', :admin, $q$insert into public.material_types (key, label) values ('video', 'v')$q$, 'ok');

-- ===================== notifications =====================
select t_run('user reads only own notifications', :m2, 'select * from public.notifications', 'rows:1');
select t_run('user marks own as read', :m2, 'update public.notifications set is_read = true', 'affected:1');
select t_run('user cannot touch others', :m1, format('update public.notifications set is_read = true where user_id = %L', :m2), 'affected:0');
select t_run('user cannot reassign a notification', :m2, format('update public.notifications set user_id = %L', :m1), 'denied');
select t_run('user cannot forge a notification', :m1, format($q$insert into public.notifications (user_id, type) values (%L, 'forum_answer')$q$, :m2), 'denied');
select t_run('user cannot delete notifications', :m2, 'delete from public.notifications', 'denied');

-- ===================== reports =====================
select t_run('member files report', :m1, format($q$insert into public.reports (user_id, target_type, target_id, reason) values (%L, 'event', %L, 'spam')$q$, :m1, '44444444-0000-4000-8000-000000000001'), 'ok');
select t_run('cannot file as someone else', :m1, format($q$insert into public.reports (user_id, target_type, target_id, reason) values (%L, 'event', %L, 'x')$q$, :m2, '44444444-0000-4000-8000-000000000001'), 'denied');
select t_run('cannot file pre-resolved', :m1, format($q$insert into public.reports (user_id, target_type, target_id, reason, status) values (%L, 'event', %L, 'x', 'resolved')$q$, :m1, '44444444-0000-4000-8000-000000000001'), 'denied');
select t_run('member sees only own reports', :m2, 'select * from public.reports', 'rows:0');
select t_run('admin sees reports', :admin, 'select * from public.reports', 'rows:1');
select t_run('member cannot change report status', :m1, 'update public.reports set status = ''resolved''', 'affected:0');
select t_run('admin resolves report', :admin, 'update public.reports set status = ''resolved''', 'affected:1');

-- ===================== moderation =====================
select t_run('member cannot hide content', :m1, format('select public.moderate_set_hidden(''event'', %L, true)', '44444444-0000-4000-8000-000000000001'), 'error:Forbidden');
select t_run('member cannot delete content', :m1, format('select public.moderate_delete_content(''event'', %L)', '44444444-0000-4000-8000-000000000001'), 'error:Forbidden');
select t_run('admin hides event', :admin, format('select public.moderate_set_hidden(''event'', %L, true)', '44444444-0000-4000-8000-000000000001'), 'ok');
select t_run('hidden event disappears for members', :m2, 'select * from public.events', 'rows:0');
select t_run('hide unknown target errors', :admin, format('select public.moderate_set_hidden(''event'', %L, true)', 'ffffffff-0000-4000-8000-000000000001'), 'error:not found');
select t_run('admin deletes forum question with answers and likes', :admin, format('select public.moderate_delete_content(''forum_question'', %L)', '22222222-0000-4000-8000-000000000001'), 'ok');
select t_run('answers are gone', :admin, $q$select * from public.forum_answers where id::text like '77777777%'$q$, 'rows:0');
select t_run('admin deletes material and gets its file key', :admin, format('select public.moderate_delete_content(''material'', %L)', '11111111-0000-4000-8000-000000000001'), 'ok');

-- ===================== registration =====================
select t_run('new user with expert code registers', :stranger, $q$select public.register_profile('New Person', 'Therapist', '#E0000000')$q$, 'ok');
select t_run('new profile is a plain user', :admin, format($q$select * from public.users where id = %L and role = 'user'$q$, :stranger), 'rows:1');
select t_run('pending approval was created', :admin, format($q$select * from public.expert_approvals where user_id = %L and status = 'pending' and expert_id = %L$q$, :stranger, :expert), 'rows:1');
select t_run('registering again is idempotent', :stranger, $q$select public.register_profile('Other Name', null, null)$q$, 'ok');
insert into auth.users (id) values ('d1000000-0000-4000-8000-000000000008'), ('d2000000-0000-4000-8000-000000000009'), ('d3000000-0000-4000-8000-00000000000a');
select t_run('code required once experts exist', 'd1000000-0000-4000-8000-000000000008', $q$select public.register_profile('X', null, null)$q$, 'error:Expert referral code required');
select t_run('bad code format rejected', 'd1000000-0000-4000-8000-000000000008', $q$select public.register_profile('X', null, 'nope')$q$, 'error:Invalid expert code format');
select t_run('unknown code rejected', 'd1000000-0000-4000-8000-000000000008', $q$select public.register_profile('X', null, '#12345678')$q$, 'error:Invalid expert referral');
select t_run('non-expert uuid rejected', 'd1000000-0000-4000-8000-000000000008', format($q$select public.register_profile('X', null, %L)$q$, :m1), 'error:Invalid expert referral');
select t_run('referral by expert uuid works', 'd2000000-0000-4000-8000-000000000009', format($q$select public.register_profile('Y', null, %L)$q$, :expert), 'ok');
select t_run('blank name rejected', 'd3000000-0000-4000-8000-00000000000a', $q$select public.register_profile('   ', null, '#E0000000')$q$, 'error:Full name required');
select t_run('unauthenticated cannot register', null, $q$select public.register_profile('Z', null, '#E0000000')$q$, 'denied', 'anon');

-- ===================== registration state (pending user) =====================
select t_run('pending user sees expert name through my_registration_state', :pending, 'select public.my_registration_state()', 'ok');
select t_run('state names the referring expert', :pending, $q$select * from (select (public.my_registration_state()->>'expert_name') as n) s where n = 'Expert'$q$, 'rows:1');
select t_run('user without approval gets no state', :m2, $q$select * from (select public.my_registration_state() as s) x where s is not null$q$, 'rows:0');

-- ===================== function execute privileges =====================
select t_run('anon cannot call moderate_delete_content', null, format($q$select public.moderate_delete_content('event', %L)$q$, '44444444-0000-4000-8000-000000000001'), 'error:permission denied', 'anon');
select t_run('anon cannot call is_admin', null, 'select public.is_admin()', 'error:permission denied', 'anon');
select t_run('anon cannot call register_profile', null, $q$select public.register_profile('x', null, null)$q$, 'error:permission denied', 'anon');
select t_run('anon can still ask whether a referral code is required', null, 'select public.is_referral_code_required()', 'ok', 'anon');
select t_run('trigger functions cannot be called directly', :m1, 'select public.notify_on_insert()', 'error:permission denied');

-- ===================== event favorites =====================
insert into public.events (id, user_id, title, description) values
  ('44444444-0000-4000-8000-000000000009', :m1, 'Fav event', 'd');
insert into public.events (id, user_id, title, description, is_hidden) values
  ('44444444-0000-4000-8000-000000000008', :m1, 'Hidden fav event', 'd', true);
select t_run('member favorites an event', :m2, format($q$insert into public.event_favorites (user_id, event_id) values (%L, %L)$q$, :m2, '44444444-0000-4000-8000-000000000009'), 'ok');
select t_run('favoriting twice is rejected', :m2, format($q$insert into public.event_favorites (user_id, event_id) values (%L, %L)$q$, :m2, '44444444-0000-4000-8000-000000000009'), 'denied');
select t_run('cannot favorite as someone else', :m2, format($q$insert into public.event_favorites (user_id, event_id) values (%L, %L)$q$, :m1, '44444444-0000-4000-8000-000000000009'), 'denied');
select t_run('cannot favorite a hidden event', :m2, format($q$insert into public.event_favorites (user_id, event_id) values (%L, %L)$q$, :m2, '44444444-0000-4000-8000-000000000008'), 'denied');
select t_run('pending member cannot favorite', :pending, format($q$insert into public.event_favorites (user_id, event_id) values (%L, %L)$q$, :pending, '44444444-0000-4000-8000-000000000009'), 'denied');
select t_run('anon cannot favorite', null, format($q$insert into public.event_favorites (user_id, event_id) values (%L, %L)$q$, :m2, '44444444-0000-4000-8000-000000000009'), 'denied', 'anon');
select t_run('member reads their own favorites', :m2, 'select * from public.event_favorites', 'rows:1');
select t_run('other members cannot read favorites', :m1, 'select * from public.event_favorites', 'rows:0');
select t_run('even admins cannot read others favorites through the API', :admin, 'select * from public.event_favorites', 'rows:0');
select t_run('cannot remove someone elses favorite', :m1, format($q$delete from public.event_favorites where event_id = %L$q$, '44444444-0000-4000-8000-000000000009'), 'affected:0');
select t_run('member unfavorites', :m2, format($q$delete from public.event_favorites where event_id = %L$q$, '44444444-0000-4000-8000-000000000009'), 'affected:1');
select t_run('favorites cannot be edited', :m2, $q$update public.event_favorites set created_at = now()$q$, 'denied');
select t_run('re-favorite after removal works', :m2, format($q$insert into public.event_favorites (user_id, event_id) values (%L, %L)$q$, :m2, '44444444-0000-4000-8000-000000000009'), 'ok');
select t_run('deleting an event removes its favorites', :admin, format($q$select public.moderate_delete_content('event', %L)$q$, '44444444-0000-4000-8000-000000000009'), 'ok');
select t_run('favorites are gone with the event', :m2, 'select * from public.event_favorites', 'rows:0');

-- ===================== service role (email lookups) =====================
select t_run('service role can read the content the email code looks up', null, 'select * from public.recommendations', 'rows:1', 'service_role');
select t_run('service role can read users', null, 'select id, full_name from public.users', 'ok', 'service_role');
select t_run('service role can read event favorites', null, 'select user_id from public.event_favorites', 'ok', 'service_role');
select t_run('service role is read-only: no insert', null, format($q$insert into public.event_favorites (user_id, event_id) values (%L, %L)$q$, :m1, '44444444-0000-4000-8000-000000000001'), 'denied', 'service_role');
select t_run('service role is read-only: no update', null, $q$update public.users set full_name = 'x'$q$, 'denied', 'service_role');
select t_run('service role is read-only: no delete', null, 'delete from public.events', 'denied', 'service_role');
select t_run('service role cannot read tables the emails do not need', null, 'select * from public.notifications', 'denied', 'service_role');

-- ===================== report =====================
\echo
\echo === FAILURES ===
select label, expect, actual from t_results where not pass order by label;
\echo === SUMMARY ===
select count(*) filter (where pass) as passed, count(*) filter (where not pass) as failed, count(*) as total from t_results;
