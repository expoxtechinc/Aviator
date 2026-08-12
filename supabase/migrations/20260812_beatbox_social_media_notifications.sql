-- BeatBox social media storage and activity notifications.
-- Additive and idempotent; no payment or authentication behavior is changed.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('social-media', 'social-media', false, 52428800, array['image/jpeg','image/png','image/webp','audio/mpeg','audio/wav','audio/mp4','video/mp4','video/webm'])
on conflict (id) do nothing;

drop policy if exists "BeatBox users manage own social media" on storage.objects;
create policy "BeatBox users manage own social media" on storage.objects
for all to authenticated
using (bucket_id = 'social-media' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'social-media' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.notify_social_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient uuid;
  actor_name text;
  activity_type text;
  activity_title text;
  activity_message text;
  activity_metadata jsonb;
begin
  if tg_table_name = 'social_friend_requests' then
    recipient := new.receiver_id;
    activity_type := 'friend_request';
    activity_title := 'New friend request';
    activity_message := 'A BeatBox member sent you a friend request.';
    activity_metadata := jsonb_build_object('friend_request_id', new.id, 'sender_id', new.sender_id);
  elsif tg_table_name = 'producer_follows' then
    recipient := new.producer_id;
    activity_type := 'new_follower';
    activity_title := 'New follower';
    activity_message := 'Someone followed your BeatBox creator profile.';
    activity_metadata := jsonb_build_object('follower_id', new.follower_id, 'producer_id', new.producer_id);
  elsif tg_table_name = 'social_post_likes' then
    select author_id into recipient from public.social_posts where id = new.post_id;
    activity_type := 'post_like';
    activity_title := 'Your post received a like';
    activity_message := 'Someone liked your BeatBox community post.';
    activity_metadata := jsonb_build_object('post_id', new.post_id, 'user_id', new.user_id);
  elsif tg_table_name = 'social_post_comments' then
    select author_id into recipient from public.social_posts where id = new.post_id;
    activity_type := 'post_comment';
    activity_title := 'New comment on your post';
    activity_message := 'Someone commented on your BeatBox community post.';
    activity_metadata := jsonb_build_object('post_id', new.post_id, 'comment_id', new.id);
  elsif tg_table_name = 'social_reposts' then
    select author_id into recipient from public.social_posts where id = new.post_id;
    activity_type := 'post_repost';
    activity_title := 'Your post was reposted';
    activity_message := 'Someone reposted your BeatBox community post.';
    activity_metadata := jsonb_build_object('post_id', new.post_id, 'user_id', new.user_id);
  end if;
  if recipient is not null and recipient <> auth.uid() then
    insert into public.notifications (user_id, type, title, message, metadata)
    values (recipient, activity_type, activity_title, activity_message, activity_metadata);
  end if;
  return new;
end;
$$;

drop trigger if exists social_friend_request_notification on public.social_friend_requests;
create trigger social_friend_request_notification after insert on public.social_friend_requests
for each row execute function public.notify_social_activity();
drop trigger if exists producer_follow_notification on public.producer_follows;
create trigger producer_follow_notification after insert on public.producer_follows
for each row execute function public.notify_social_activity();
drop trigger if exists social_post_like_notification on public.social_post_likes;
create trigger social_post_like_notification after insert on public.social_post_likes
for each row execute function public.notify_social_activity();
drop trigger if exists social_post_comment_notification on public.social_post_comments;
create trigger social_post_comment_notification after insert on public.social_post_comments
for each row execute function public.notify_social_activity();
drop trigger if exists social_repost_notification on public.social_reposts;
create trigger social_repost_notification after insert on public.social_reposts
for each row execute function public.notify_social_activity();

grant execute on function public.notify_social_activity() to authenticated;
