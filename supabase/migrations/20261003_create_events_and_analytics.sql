-- Analytics events for the public linktree page
create table if not exists linktree.events (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  type         text not null check (type in ('pageview','click')),
  link_id      text,
  visitor_hash text not null,
  referrer_host text,
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  device_type  text,
  browser      text,
  os           text,
  country      text,
  in_app       boolean not null default false
);

create index if not exists events_created_at_idx      on linktree.events (created_at);
create index if not exists events_type_created_at_idx on linktree.events (type, created_at);
create index if not exists events_link_id_idx         on linktree.events (link_id);

-- Service role only (all writes/reads go through the server service key)
grant all on linktree.events to service_role;
grant usage, select on all sequences in schema linktree to service_role;

-- Aggregation RPCs. Local timezone (America/Sao_Paulo) for human-meaningful buckets.
create or replace function linktree.analytics_summary(p_from timestamptz, p_to timestamptz)
returns table(pageviews bigint, uniques bigint, clicks bigint)
language sql security definer set search_path = linktree as $$
  select
    count(*)                        filter (where type='pageview'),
    count(distinct visitor_hash)    filter (where type='pageview'),
    count(*)                        filter (where type='click')
  from linktree.events
  where created_at >= p_from and created_at < p_to;
$$;

create or replace function linktree.analytics_timeseries(p_from timestamptz, p_to timestamptz)
returns table(day date, pageviews bigint, clicks bigint)
language sql security definer set search_path = linktree as $$
  select (created_at at time zone 'America/Sao_Paulo')::date as day,
    count(*) filter (where type='pageview'),
    count(*) filter (where type='click')
  from linktree.events
  where created_at >= p_from and created_at < p_to
  group by 1 order by 1;
$$;

create or replace function linktree.analytics_top_links(p_from timestamptz, p_to timestamptz)
returns table(link_id text, clicks bigint, uniques bigint)
language sql security definer set search_path = linktree as $$
  select link_id, count(*), count(distinct visitor_hash)
  from linktree.events
  where type='click' and link_id is not null
    and created_at >= p_from and created_at < p_to
  group by link_id order by count(*) desc;
$$;

create or replace function linktree.analytics_sources(p_from timestamptz, p_to timestamptz)
returns table(source text, pageviews bigint)
language sql security definer set search_path = linktree as $$
  select coalesce(
           case when in_app then 'Instagram' else null end,
           initcap(utm_source),
           referrer_host,
           'Direto'
         ) as source,
         count(*)
  from linktree.events
  where type='pageview' and created_at >= p_from and created_at < p_to
  group by 1 order by 2 desc;
$$;

create or replace function linktree.analytics_devices(p_from timestamptz, p_to timestamptz)
returns table(device_type text, count bigint)
language sql security definer set search_path = linktree as $$
  select coalesce(device_type,'unknown'), count(*)
  from linktree.events
  where type='pageview' and created_at >= p_from and created_at < p_to
  group by 1 order by 2 desc;
$$;

create or replace function linktree.analytics_countries(p_from timestamptz, p_to timestamptz)
returns table(country text, count bigint)
language sql security definer set search_path = linktree as $$
  select coalesce(country,'??'), count(*)
  from linktree.events
  where type='pageview' and created_at >= p_from and created_at < p_to
  group by 1 order by 2 desc limit 20;
$$;

create or replace function linktree.analytics_activity(p_from timestamptz, p_to timestamptz)
returns table(dow int, hour int, count bigint)
language sql security definer set search_path = linktree as $$
  select extract(dow  from created_at at time zone 'America/Sao_Paulo')::int,
         extract(hour from created_at at time zone 'America/Sao_Paulo')::int,
         count(*)
  from linktree.events
  where created_at >= p_from and created_at < p_to
  group by 1,2;
$$;

grant execute on all functions in schema linktree to service_role;

-- Harden: Postgres grants EXECUTE on new functions to PUBLIC by default.
-- These are SECURITY DEFINER, so restrict them to service_role only.
revoke execute on all functions in schema linktree from public, anon, authenticated;

-- Defense in depth: strip any default table privileges and enable RLS.
-- (service_role bypasses RLS; the app accesses events only via the service key.)
revoke all on linktree.events from anon, authenticated;
alter table linktree.events enable row level security;
