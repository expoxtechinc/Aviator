-- BeatBox durable engagement counters for creator content and community posts.
-- Additive and idempotent; counters are maintained by database triggers.

create or replace function public.sync_content_engagement_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'content_likes' then
    update public.content_items set like_count = greatest(0, like_count + case when tg_op = 'INSERT' then 1 else -1 end), updated_at = now() where id = coalesce(new.content_id, old.content_id);
  elsif tg_table_name = 'content_comments' then
    update public.content_items set comment_count = greatest(0, comment_count + case when tg_op = 'INSERT' then 1 else -1 end), updated_at = now() where id = coalesce(new.content_id, old.content_id);
  elsif tg_table_name = 'content_shares' then
    update public.content_items set share_count = share_count + 1, updated_at = now() where id = new.content_id;
  elsif tg_table_name = 'social_post_likes' then
    update public.social_posts set like_count = greatest(0, like_count + case when tg_op = 'INSERT' then 1 else -1 end), updated_at = now() where id = coalesce(new.post_id, old.post_id);
  elsif tg_table_name = 'social_post_comments' then
    update public.social_posts set comment_count = greatest(0, comment_count + case when tg_op = 'INSERT' then 1 else -1 end), updated_at = now() where id = coalesce(new.post_id, old.post_id);
  elsif tg_table_name = 'social_reposts' then
    update public.social_posts set share_count = share_count + 1, updated_at = now() where id = new.post_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists content_like_count on public.content_likes;
create trigger content_like_count after insert or delete on public.content_likes for each row execute function public.sync_content_engagement_count();
drop trigger if exists content_comment_count on public.content_comments;
create trigger content_comment_count after insert or delete on public.content_comments for each row execute function public.sync_content_engagement_count();
drop trigger if exists content_share_count on public.content_shares;
create trigger content_share_count after insert on public.content_shares for each row execute function public.sync_content_engagement_count();
drop trigger if exists social_post_like_count on public.social_post_likes;
create trigger social_post_like_count after insert or delete on public.social_post_likes for each row execute function public.sync_content_engagement_count();
drop trigger if exists social_post_comment_count on public.social_post_comments;
create trigger social_post_comment_count after insert or delete on public.social_post_comments for each row execute function public.sync_content_engagement_count();
drop trigger if exists social_repost_count on public.social_reposts;
create trigger social_repost_count after insert on public.social_reposts for each row execute function public.sync_content_engagement_count();

grant execute on function public.sync_content_engagement_count() to authenticated;
