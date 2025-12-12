-- Social Ops Supabase schema (Ticket 001)
-- Stores social posts, templates, and hashtag sets for FB/IG copy + CSV MVP.
-- Expected env (server-side only): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
-- Allowed status values: draft | scheduled | posted | failed.
-- Allowed platforms: facebook | instagram.
-- Allowed post types: POST | REEL | STORY.

-- Ensure pgcrypto for gen_random_uuid (enabled by default on Supabase, safe to re-run).
create extension if not exists "pgcrypto";

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists social_templates (
  key text primary key,
  title text not null,
  body text not null,
  default_hashtags text[] not null default '{}'::text[],
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger social_templates_set_updated_at
before update on social_templates
for each row
execute function set_updated_at();

create table if not exists hashtag_sets (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger hashtag_sets_set_updated_at
before update on hashtag_sets
for each row
execute function set_updated_at();

create table if not exists social_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  caption text not null default '',
  hashtags text[] not null default '{}'::text[],
  cta text,
  platforms text[] not null default '{}'::text[],
  asset_urls text[] not null default '{}'::text[],
  asset_alt_texts text[] not null default '{}'::text[],
  status text not null default 'draft',
  scheduled_at timestamptz,
  posted_at timestamptz,
  template_key text references social_templates(key),
  first_comment text,
  fb_type text,
  ig_type text,
  show_reel_on_feed boolean not null default false,
  meta jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_posts_status_chk check (status in ('draft', 'scheduled', 'posted', 'failed')),
  constraint social_posts_platforms_chk check (
    platforms <@ array['facebook','instagram']::text[]
    and cardinality(platforms) >= 1
  ),
  constraint social_posts_types_chk check (
    (fb_type is null or fb_type in ('POST','REEL','STORY'))
    and (ig_type is null or ig_type in ('POST','REEL','STORY'))
  ),
  constraint social_posts_assets_len_chk check (
    cardinality(asset_urls) <= 10
    and cardinality(asset_alt_texts) <= 10
    and cardinality(asset_urls) = cardinality(asset_alt_texts)
  )
);

create trigger social_posts_set_updated_at
before update on social_posts
for each row
execute function set_updated_at();

-- Helpful indexes
create index if not exists social_posts_status_scheduled_idx on social_posts (status, scheduled_at desc);
create index if not exists social_posts_scheduled_idx on social_posts (scheduled_at desc);
create index if not exists social_posts_template_idx on social_posts (template_key);
create index if not exists social_posts_platforms_gin_idx on social_posts using gin (platforms);

-- Explicitly keep RLS off (admin-only, service role access).
alter table social_posts disable row level security;
alter table social_templates disable row level security;
alter table hashtag_sets disable row level security;

-- Prompt bank for reusable prompts
create table if not exists prompt_bank (
  id uuid primary key default gen_random_uuid(),
  key text unique,
  prompt text not null,
  crop text not null default 'square',
  alt text,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger prompt_bank_set_updated_at
before update on prompt_bank
for each row
execute function set_updated_at();

alter table prompt_bank disable row level security;
