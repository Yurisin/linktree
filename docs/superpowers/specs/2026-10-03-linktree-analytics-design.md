# Linktree Analytics — Design

**Data:** 2026-10-03
**Branch:** `feat-trackeamento`
**Status:** Aprovado para spec (aguardando revisão do usuário antes do plano)

## Contexto e intento

O Linktree já está no ar (Next.js 16 + Supabase, schema `linktree`, tabelas
`links` e `profile`; admin em `/admin/*` com Google OAuth). O Linktree **não é o
produto final** — ele é uma peça da estratégia de Instagram do usuário. O
objetivo deste trabalho é transformar cada visita e cada clique em **informação
acionável para o gerenciamento do Instagram no dia a dia**.

O painel precisa responder:

- Meu tráfego vem do Instagram mesmo? De bio, stories, de um post específico?
- O que minha audiência do IG quer? (qual link clicam, qual ignoram)
- Quando estão ativos? (melhor horário/dia pra postar)
- Quem são? (celular vs desktop, país)
- Está crescendo? (um story/post deu pico?)

### Decisões já tomadas (brainstorming)

1. **Construir no Supabase**, não ferramenta externa. Dado 100% do usuário, R$0,
   nenhum serviço novo, reaproveita Supabase + `/admin` já existentes, e captura
   de clique por link precisa (que ferramentas genéricas fazem mal).
2. **Captura de clique via redirect `/go/[id]`** (não beacon). Captura 100% dos
   cliques, funciona no navegador interno do Instagram (webview), e permite
   atribuir origem/UTM ao clique.
3. **Sem cookies / LGPD-friendly** (estilo Plausible): identificador anônimo por
   hash diário, IP cru nunca gravado, sem banner de consentimento.

### Restrição crítica do Instagram

Cliques pela bio do IG abrem no webview do Instagram, que **remove o
`referrer`**. A única forma confiável de atribuir origem é **UTM na URL** da bio.
Por isso o sistema lê/grava UTMs e o painel inclui um gerador de links UTM
prontos pra colar.

## Fora de escopo (YAGNI)

Exportar CSV, comparação entre períodos, alertas/notificações, filtros
multi-dimensão. Podem ser adicionados depois sem retrabalho do modelo.

## Arquitetura

```
Página pública /                    Clique no link
  └─ <Tracker/> (client)              └─ <a href="/go/[id]">
        │ POST /api/track                    │ GET /go/[id]
        ▼                                     ▼
   /api/track (route handler) ──┐      /go/[id] (route handler)
        grava pageview          │           grava click
                                ▼           302 → url real
                        linktree.events (Supabase)
                                ▲
        /admin/analytics ───────┘  (RPCs de agregação, service key)
```

Toda escrita e leitura de `events` passa pelo **service key** (server-side). A
tabela `events` não é exposta a `anon`/`authenticated` para leitura.

## 1. Modelo de dados

Migration nova em `supabase/migrations/` (seguindo o padrão `YYYYMMDD_*.sql` já
usado no projeto).

### Tabela `linktree.events`

| coluna | tipo | notas |
|---|---|---|
| `id` | `bigint generated always as identity` PK | |
| `created_at` | `timestamptz not null default now()` | |
| `type` | `text not null` | `check (type in ('pageview','click'))` |
| `link_id` | `text` null | id do link clicado; null em pageview |
| `visitor_hash` | `text not null` | hash anônimo diário (ver §3) |
| `referrer_host` | `text` null | só o host do referrer (ex. `google.com`) |
| `utm_source` | `text` null | |
| `utm_medium` | `text` null | |
| `utm_campaign` | `text` null | |
| `device_type` | `text` null | `'mobile' \| 'tablet' \| 'desktop'` |
| `browser` | `text` null | ex. `Chrome`, `Safari` |
| `os` | `text` null | ex. `iOS`, `Android`, `Windows` |
| `country` | `text` null | ISO-2, do header `x-vercel-ip-country` |
| `in_app` | `boolean not null default false` | true se webview do Instagram |

> `link_id` é `text` porque os links do projeto usam id string (ver
> `src/types/linktree.ts`). Sem FK rígida (um link pode ser deletado e ainda
> queremos manter o histórico do clique); guardamos também um snapshot do label
> no join em tempo de query via `links`, ou mostramos o id se o link sumiu.

### Índices

- `(created_at)` — toda query filtra por período.
- `(type, created_at)` — separar pageview de click.
- `(link_id)` — agregação de cliques por link.

### Permissões

Seguir o padrão da migration existente, mas **mais restritivo**: `events` recebe
`GRANT ALL` apenas para `service_role`. Nada para `anon`/`authenticated`
(nenhum acesso direto do cliente). `GRANT USAGE, SELECT ON SEQUENCES` conforme
já feito.

### Funções de agregação (RPC)

Para o painel ser rápido e simples de consumir pelo supabase-js (que não faz
`GROUP BY` direto), criar funções SQL `security definer` no schema `linktree`,
todas recebendo `p_from timestamptz, p_to timestamptz`:

- `analytics_summary(p_from, p_to)` → `(pageviews bigint, uniques bigint, clicks bigint)`.
  CTR é calculado no front (`clicks / pageviews`).
- `analytics_timeseries(p_from, p_to)` → linhas `(day date, pageviews bigint, clicks bigint)`.
- `analytics_top_links(p_from, p_to)` → `(link_id text, clicks bigint, uniques bigint)`.
  O **label** é resolvido no dashboard: a página já carrega `links` (padrão
  existente) e mapeia `link_id → label` em JS; se o link foi deletado, mostra o
  `link_id`. A função SQL não faz join, pra manter responsabilidade única.
- `analytics_sources(p_from, p_to)` → `(source text, pageviews bigint)` — deriva
  uma origem legível: `utm_source` se houver, senão `referrer_host`, senão
  `'direto'`; mais uma linha agregada de `in_app` (Instagram).
- `analytics_devices(p_from, p_to)` → `(device_type text, count bigint)`.
- `analytics_countries(p_from, p_to)` → `(country text, count bigint)` top N.
- `analytics_activity(p_from, p_to)` → `(dow int, hour int, count bigint)` para o
  mapa de horário/dia-da-semana.

`uniques` = `count(distinct visitor_hash)`.

## 2. Captura de eventos

### Pageview — `<Tracker/>` + `POST /api/track`

- Componente client `src/components/Tracker.tsx`, montado na página pública (`/`).
  No `useEffect` de montagem, envia **uma vez** por carregamento:
  `navigator.sendBeacon('/api/track', body)` com fallback para
  `fetch(..., { method:'POST', keepalive:true })`.
- Body do cliente: `{ referrer: document.referrer, utm: {...da URL} }`.
- `src/app/api/track/route.ts` (POST): lê headers no servidor
  (`user-agent`, `x-vercel-ip-country`, `x-forwarded-for`), computa
  `device_type/browser/os` (parser próprio, §4), `in_app`, `visitor_hash` (§3),
  `referrer_host` (host extraído do referrer do body). Insere pageview via
  service key. Sempre responde 204 rápido. Bots conhecidos (§4) são ignorados.

> Pageview é disparado pelo cliente (não no SSR) de propósito: evita contar
> prefetch/SSR e render de bots, e dá acesso a `document.referrer`.

### Click — `GET /go/[id]`

- `src/app/go/[id]/route.ts` (GET): busca o link por id em `linktree.links` via
  service key. Se não existir, redireciona pra `/`. Se existir:
  1. registra `click` (mesma extração de contexto do `/api/track` + `link_id` +
     UTMs da query string, se vierem).
  2. responde `redirect(url, 302)` pro destino real.
- `LinkCard` passa a usar `href="/go/{id}"` mantendo `target="_blank"` e
  `rel="noopener noreferrer"`. A URL real do link **não** aparece mais no
  `href` (fica só no banco) — aceitável; se quisermos preservar hover/preview
  da URL real, fica como melhoria futura.
- Registro de clique **não bloqueia** o redirect de forma perceptível: inserir e
  redirecionar em sequência; a inserção é um único INSERT rápido.

## 3. Privacidade / LGPD

- `visitor_hash = sha256(daily_salt + ip + user_agent)`, feito no servidor com o
  `crypto` nativo do Node.
- `daily_salt = sha256(SERVER_SALT + yyyy-mm-dd)`, onde `SERVER_SALT` é uma env
  var secreta nova. O sal muda a cada dia → impossível religar o mesmo visitante
  entre dias → cookieless e não-rastreável a longo prazo.
- **IP cru nunca é persistido.** Só entra no hash e é descartado.
- `country` vem do header da Vercel, não de lookup sobre IP armazenado.
- Sem cookies de tracking → sem necessidade de banner de consentimento.
- Documentar isso num comentário no `/api/track` e no spec de deploy.

### Env var nova

`SERVER_SALT` — string aleatória secreta. Adicionar na Vercel (todos os
ambientes). Lembrar do gotcha de env vars do projeto (valores embaralhados
causam erro; middleware inline no build). Ver `feedback_env_vars` na memória.

## 4. Helpers de servidor

`src/lib/tracking.ts` (server-only):

- `parseUserAgent(ua)` → `{ device_type, browser, os, in_app }`. Implementação
  leve por regex (sem dependência nova): detecta mobile/tablet/desktop, famílias
  de browser comuns (Chrome, Safari, Firefox, Edge, Samsung), OS (iOS, Android,
  Windows, macOS, Linux), e `in_app` quando UA contém `Instagram`.
- `isBot(ua)` → regex de bots conhecidos (googlebot, bingbot, facebookexternalhit,
  etc.). Eventos de bot não são gravados.
- `visitorHash(ip, ua)` → conforme §3.
- `referrerHost(referrer)` → extrai host, null se vazio/inválido/mesmo host.
- `extractUtm(params)` → `{ utm_source, utm_medium, utm_campaign }`.

Decisão: **parser próprio** em vez de `ua-parser-js` para não adicionar
dependência; só precisamos de buckets grosseiros. Se no futuro precisar de mais
precisão, trocar por lib é isolado neste arquivo.

## 5. Dashboard `/admin/analytics`

- Nova aba "Analytics" na nav do admin (`src/app/admin/(protected)/layout.tsx`).
- Página server component `src/app/admin/(protected)/analytics/page.tsx` que lê o
  período da query string (`?range=7|30|90`, default 30) e chama as RPCs via
  service key, passando os dados pros componentes de visualização.
- Componentes em `src/components/admin/analytics/`:
  - `RangePicker` (client) — troca `?range=`.
  - `KpiCards` — Visitas · Únicos · Cliques · CTR.
  - `TrendChart` — visitas e cliques por dia (SVG inline, sem lib).
  - `TopLinks` — tabela label · cliques · CTR.
  - `SourcesBreakdown` — origem (Instagram/Google/direto/campanha) + % via app IG.
  - `DeviceCountryBreakdown` — barras CSS simples.
  - `ActivityHeatmap` — grade dia-da-semana × hora (CSS grid).
  - `UtmBuilder` (client) — gera links prontos com UTM pra bio/stories/post.
- **Gráficos sem dependência nova:** SVG inline para a linha de tendência; barras
  e heatmap em CSS/grid. Mantém o bundle leve e o visual alinhado ao admin atual
  (dark, `bg-white/[0.06]`, etc.).

### UtmBuilder (bônus Instagram)

Campos: destino (`/` ou um link específico), `utm_source` (instagram),
`utm_medium` (bio/story/post/reels), `utm_campaign` (livre). Gera a URL absoluta
pronta pra copiar. Serve pra alimentar a seção "Origem do tráfego" com dados
confiáveis apesar do webview do IG apagar o referrer.

## Tratamento de erros

- `/api/track` e `/go/[id]` **nunca** devem quebrar a experiência: qualquer erro
  de insert é capturado e logado no servidor; o pageview falha em silêncio (204)
  e o `/go` redireciona mesmo que o insert falhe.
- Dashboard: se uma RPC falhar, a seção mostra estado vazio/erro isolado, sem
  derrubar a página (seguindo o padrão de error handling já adotado no admin).

## Testes

- `src/lib/tracking.ts` é lógica pura → testes unitários (parseUserAgent com UAs
  reais de iOS Safari, Android Chrome, Instagram webview, desktop, bots;
  referrerHost; extractUtm). TDD aqui.
- `/go/[id]`: teste de que redireciona pro destino e trata id inexistente.
- `/api/track`: teste de que ignora bot e responde 204.
- Agregações SQL: validação manual com dados semeados (seed) durante o
  desenvolvimento; verificar `uniques` com `distinct visitor_hash`.

## Observações de implementação

- **AGENTS.md:** antes de escrever código, ler os guias relevantes em
  `node_modules/next/dist/docs/` (route handlers, dynamic APIs/`headers()`,
  redirect) — esta versão do Next pode diferir do conhecido.
- Página pública é `force-dynamic`; headers de request estão disponíveis nos
  route handlers.
- Migration aplicada via MCP do Supabase (projeto "Pessoal",
  `ledukavvfokxzixqexcw`) e commitada em `supabase/migrations/`.

## Arquivos afetados

**Novos:**
- `supabase/migrations/20261003_create_events_and_analytics.sql`
- `src/lib/tracking.ts` (+ teste)
- `src/components/Tracker.tsx`
- `src/app/api/track/route.ts`
- `src/app/go/[id]/route.ts`
- `src/app/admin/(protected)/analytics/page.tsx`
- `src/components/admin/analytics/*` (componentes acima)

**Modificados:**
- `src/components/LinkCard.tsx` (href → `/go/[id]`)
- `src/components/LinktreePage.tsx` ou `src/app/page.tsx` (montar `<Tracker/>`)
- `src/app/admin/(protected)/layout.tsx` (aba Analytics)
- `.env` / Vercel (`SERVER_SALT`)
