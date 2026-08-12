-- BeatBox additive content-type expansion.
-- Existing rows remain valid; private original paths and access-mode checks are unchanged.

alter table public.beats
  drop constraint if exists beats_content_type_check;

alter table public.beats
  add constraint beats_content_type_check
  check (content_type in ('audio','video','movie','software','app','digital_product'));

alter table public.content_items
  drop constraint if exists content_items_content_type_check;

alter table public.content_items
  add constraint content_items_content_type_check
  check (content_type in ('audio','video','movie','software','app','digital_product'));

comment on column public.beats.content_type is 'Published media type: audio, video, movie, software, app, or digital_product.';
comment on column public.content_items.content_type is 'Protected creator content type: audio, video, movie, software, app, or digital_product.';
