-- The notification emails (src/lib/email/lookup.ts) look up who wrote a piece of content and who
-- favorited an event with the service-role key. In this database service_role holds no table
-- privileges (only REFERENCES/TRIGGER/TRUNCATE), so those reads failed with
-- "permission denied" and no email could be sent. Grant it read-only access to exactly the
-- tables the email code reads; it can still not write anywhere.

grant select on
  public.users,
  public.materials,
  public.material_requests,
  public.forum_questions,
  public.forum_answers,
  public.recommendations,
  public.events,
  public.professional_requests,
  public.event_favorites
to service_role;
