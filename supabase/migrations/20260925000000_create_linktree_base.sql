-- Base do schema linktree. As tabelas foram criadas direto no Supabase da nuvem e
-- não tinham migration; esta foi reconstruída a partir do código (src/types/linktree.ts
-- e chamadas em src/app). Roda antes das migrations de 26/09 em diante.
create schema if not exists linktree;

-- Perfil: linha única (id = 1), lida pela página pública e editada no admin.
create table if not exists linktree.profile (
  id          integer primary key default 1 check (id = 1),
  name        text not null default '',
  bio         text not null default '',
  avatar_url  text,
  theme       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- Links: o POST do admin não envia id, e /go/[id] e events.link_id usam texto.
-- A coluna `social` vem na migration de 05/10.
create table if not exists linktree.links (
  id        text primary key default gen_random_uuid()::text,
  label     text not null,
  url       text not null,
  icon      text not null default 'globe',
  enabled   boolean not null default true,
  featured  boolean not null default false,
  position  integer not null default 0
);

create index if not exists links_position_idx on linktree.links (position);

-- O app só acessa pela service key (ignora RLS); a leitura pública fica liberada
-- para anon, igual aos grants da migration de 26/09.
alter table linktree.profile enable row level security;
alter table linktree.links enable row level security;

create policy "leitura publica do perfil" on linktree.profile for select using (true);
create policy "leitura publica dos links" on linktree.links for select using (true);
