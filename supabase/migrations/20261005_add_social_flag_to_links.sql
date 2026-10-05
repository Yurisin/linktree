-- Adiciona o campo `social` aos links: true = ícone na fileira de redes
-- sociais (topo), false = card/botão grande. Configurável pelo painel admin.
alter table linktree.links
  add column if not exists social boolean not null default false;

-- Backfill: marca como social os links de rede social já existentes,
-- preservando o layout atual da página pública.
update linktree.links
set social = true
where icon in (
  'instagram', 'github', 'linkedin', 'twitter',
  'youtube', 'tiktok', 'whatsapp', 'telegram', 'discord'
);
