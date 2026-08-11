-- BeatBox final trigger hardening: all referenced app objects are schema-qualified.
alter function public.handle_new_user() set search_path = '';
