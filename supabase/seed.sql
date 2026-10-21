-- Dados de exemplo para desenvolvimento local (npx supabase db reset).
-- Espelha src/data/profile.ts e src/data/links.ts.
insert into linktree.profile (id, name, bio, avatar_url, theme) values (
  1, 'Yuri | Alemão Dev', 'Dev & Creator · Alemão Flow', '/avatar-mirante.jpg',
  '{"bgColor":"#00050b","accentColor":"#3278ff","cardColor":"rgba(255,255,255,0.06)","textColor":"#ffffff"}'
) on conflict (id) do nothing;

insert into linktree.links (id, label, url, icon, enabled, featured, social, position) values
  ('instagram',       'Instagram',          'https://instagram.com/alemaodev',     'instagram', true, false, true,  0),
  ('website',         'Site Oficial',       'https://alemaodev.com',               'globe',     true, true,  false, 1),
  ('conteudos',       'Materiais gratuitos','https://alemaodev.com/conteudos',     'folder',    true, false, false, 2),
  ('whatsapp',        'Quero um agente',    'https://wa.me/5500000000000',         'whatsapp',  true, false, false, 3),
  ('github-corp',     'GitHub Corporativo', 'https://github.com/YuriCNZ',          'github',    true, false, true,  4),
  ('github-personal', 'GitHub Pessoal',     'https://github.com/Yurisin',          'github',    true, false, true,  5),
  ('linkedin',        'LinkedIn',           'https://linkedin.com/in/yuribotelho', 'linkedin',  true, false, true,  6),
  ('rascunho',        'Link desativado',    'https://example.com',                 'link',      false, false, false, 7)
on conflict (id) do nothing;

-- Eventos dos últimos 30 dias para o analytics ter o que mostrar.
insert into linktree.events (created_at, type, link_id, visitor_hash, referrer_host, utm_source, device_type, browser, os, country, in_app)
select
  now() - (random() * interval '30 days'),
  case when random() < 0.65 then 'pageview' else 'click' end,
  (array['website','conteudos','whatsapp','instagram','linkedin'])[1 + floor(random() * 5)::int],
  md5((floor(random() * 400))::text),
  (array[null, 'google.com', 'alemaodev.com', 't.co'])[1 + floor(random() * 4)::int],
  (array[null, null, 'instagram', 'youtube'])[1 + floor(random() * 4)::int],
  (array['mobile','mobile','mobile','desktop','tablet'])[1 + floor(random() * 5)::int],
  (array['Chrome','Safari','Instagram','Firefox'])[1 + floor(random() * 4)::int],
  (array['iOS','Android','Windows','macOS'])[1 + floor(random() * 4)::int],
  (array['BR','BR','BR','BR','PT','US','DE'])[1 + floor(random() * 7)::int],
  random() < 0.4
from generate_series(1, 1200);

-- Pageviews não têm link_id.
update linktree.events set link_id = null where type = 'pageview';
