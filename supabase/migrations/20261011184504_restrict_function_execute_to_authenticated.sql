-- New functions are executable by PUBLIC (hence anon) unless the global default is revoked;
-- ALTER DEFAULT PRIVILEGES ... IN SCHEMA cannot remove it. Lock the app functions down explicitly.
revoke execute on all functions in schema public from public, anon;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_reviewer() to authenticated;
grant execute on function public.is_active_member() to authenticated;
grant execute on function public.owns_entity("EntityType", uuid) to authenticated;
grant execute on function public.register_profile(text, text, text) to authenticated;
grant execute on function public.my_registration_state() to authenticated;
grant execute on function public.admin_set_user_role(uuid, "UserRole") to authenticated;
grant execute on function public.review_material(uuid, "MaterialApprovalStatus", text) to authenticated;
grant execute on function public.moderate_set_hidden("ReportTargetType", uuid, boolean) to authenticated;
grant execute on function public.moderate_delete_content("ReportTargetType", uuid) to authenticated;
-- The sign-up page asks this before the visitor has an account.
grant execute on function public.is_referral_code_required() to anon, authenticated;

-- Future functions created by this role are not callable by PUBLIC by default.
alter default privileges for role postgres revoke execute on functions from public;
