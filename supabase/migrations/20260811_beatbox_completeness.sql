-- BeatBox completion migration: secure tag attachment and non-payment activity notifications.

create or replace function public.attach_tags_to_beat(p_beat_id uuid, p_tags text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  tag_name text;
  tag_slug text;
  tag_id uuid;
begin
  if auth.uid() is null or not exists (
    select 1 from public.beats
    where id = p_beat_id and seller_id = auth.uid()
  ) then
    raise exception 'Only the seller may tag this beat';
  end if;

  foreach tag_name in array coalesce(p_tags, array[]::text[]) loop
    tag_name := left(trim(regexp_replace(tag_name, '\s+', ' ', 'g')), 48);
    if tag_name = '' then
      continue;
    end if;

    tag_slug := lower(regexp_replace(tag_name, '[^a-zA-Z0-9]+', '-', 'g'));
    tag_slug := trim(both '-' from tag_slug);
    if tag_slug = '' then
      continue;
    end if;

    insert into public.tags (name, slug)
    values (tag_name, tag_slug)
    on conflict (slug) do update set name = excluded.name
    returning id into tag_id;

    insert into public.beat_tags (beat_id, tag_id)
    values (p_beat_id, tag_id)
    on conflict do nothing;
  end loop;
end;
$$;

grant execute on function public.attach_tags_to_beat(uuid, text[]) to authenticated;

create or replace function public.notify_report_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, type, title, message, metadata)
    select id, 'report_received', 'New content report', 'A BeatBox member submitted content for review.', jsonb_build_object('report_id', new.id)
    from public.profiles
    where role = 'admin' and account_status = 'active';
  elsif new.status is distinct from old.status then
    insert into public.notifications (user_id, type, title, message, metadata)
    values (new.reporter_id, 'report_update', 'Report updated', 'Your content report has been ' || replace(new.status::text, '_', ' ') || '.', jsonb_build_object('report_id', new.id, 'status', new.status));
  end if;
  return new;
end;
$$;

drop trigger if exists beatbox_notify_report_activity on public.reports;
create trigger beatbox_notify_report_activity
after insert or update of status on public.reports
for each row execute function public.notify_report_activity();

create or replace function public.notify_moderation_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and new.status = 'removed' then
    insert into public.notifications (user_id, type, title, message, metadata)
    values (new.seller_id, 'listing_moderated', 'Listing removed', 'One of your BeatBox listings was removed by moderation.', jsonb_build_object('beat_id', new.id));
  end if;
  return new;
end;
$$;

drop trigger if exists beatbox_notify_moderation_activity on public.beats;
create trigger beatbox_notify_moderation_activity
after update of status on public.beats
for each row execute function public.notify_moderation_activity();

create or replace function public.notify_download_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, message, metadata)
  values (new.user_id, 'download_ready', 'Secure download issued', 'Your private BeatBox download link was issued and will expire automatically.', jsonb_build_object('download_id', new.id, 'beat_id', new.beat_id));
  return new;
end;
$$;

drop trigger if exists beatbox_notify_download_activity on public.downloads;
create trigger beatbox_notify_download_activity
after insert on public.downloads
for each row execute function public.notify_download_activity();
