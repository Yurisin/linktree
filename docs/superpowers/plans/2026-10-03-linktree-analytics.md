# Linktree Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capturar visitas e cliques do Linktree no Supabase e expor um painel de análise dentro do `/admin`, focado em gerenciamento de Instagram.

**Architecture:** Tabela `linktree.events` grava pageviews (via `<Tracker/>` client → `POST /api/track`) e cliques (via `/go/[id]` que registra e redireciona). Agregações por funções SQL (RPC). Dashboard server-component em `/admin/analytics` consome as RPCs. Captura sem cookies (hash diário anônimo, LGPD-friendly).

**Tech Stack:** Next.js 16 (App Router, route handlers), React 19, Supabase (schema `linktree`, service key), TypeScript, Tailwind v4, vitest (dev). Sem dependências de runtime novas; gráficos em SVG/CSS inline.

**Spec:** `docs/superpowers/specs/2026-10-03-linktree-analytics-design.md`

## Global Constraints

- Next.js 16 route handlers: ler `node_modules/next/dist/docs/` (route handlers, `headers`, `redirect`, dynamic params) ANTES de escrever — esta versão difere (AGENTS.md). `ctx.params` é `Promise` (ver `src/app/api/admin/links/[id]/route.ts`).
- Acesso ao banco só via `createDbClient()` de `src/lib/supabase-server.ts` (schema `linktree`, service key). Nunca expor service key ao cliente.
- `linktree.events`: leitura/escrita apenas por `service_role`. Nada para `anon`/`authenticated`.
- Sem dependências de runtime novas. Gráficos/barras/heatmap em SVG e CSS inline.
- Privacidade: IP cru NUNCA persiste; só entra no `visitor_hash`. Sem cookies de tracking.
- `/api/track` e `/go/[id]` nunca quebram a experiência: erro de insert é logado e engolido; `/go` sempre redireciona.
- Textos de UI em português, visual alinhado ao admin atual (dark, `bg-white/[0.06]`, bordas `white/10`, acento indigo).
- Env var nova `SERVER_SALT` (secreta). Atenção ao gotcha de env vars do projeto (valores embaralhados → 500; usar `--force` no deploy se necessário).
- Commits frequentes, um por task.

## Review Focus

- **UA do webview do Instagram** (contém `Instagram` + `Safari`): deve virar `in_app=true`, `browser='Instagram'`, e NÃO ser tratada como bot. Teste em Task 3.
- **Referrer vazio ou do próprio domínio**: `referrerHost` deve retornar `null` (não poluir "origem"). Teste em Task 3.
- **Link id inexistente em `/go/[id]`**: redireciona pra home sem gravar clique nem quebrar. Implementado na Task 5, validado na Task 8.
- **`SERVER_SALT` ausente** (dev local): `visitorHash` ainda produz string determinística no mesmo dia, sem lançar. Teste em Task 3.
- **Período sem dados** no dashboard: RPCs retornam vazio → cards mostram `0`, seções mostram estado vazio, página não quebra. Validação em Task 7/8.

---

## Task 1: Setup — deps, vitest, docs

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/__smoke__.test.ts` (removido ao fim da task)

- [ ] **Step 1: Instalar dependências do projeto**

Run: `npm ci`
Expected: `node_modules` populado, sem erros. (Se `npm ci` falhar por lockfile, usar `npm install`.)

- [ ] **Step 2: Ler os guias do Next desta versão (AGENTS.md)**

Após o install, ler os guias relevantes:
Run: `ls node_modules/next/dist/docs && find node_modules/next/dist/docs -iname '*route*' -o -iname '*redirect*' -o -iname '*header*'`
Ler route handlers, `redirect`/`NextResponse.redirect`, `headers()`, e dynamic route params. Confirmar que `NextResponse.redirect(absoluteUrl, 302)` e `ctx.params: Promise<...>` são os padrões desta versão. Anotar qualquer divergência antes de codar as Tasks 4–6.

- [ ] **Step 3: Adicionar vitest**

Run: `npm install -D vitest`

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

Em `package.json`, adicionar ao bloco `scripts`:
```json
"test": "vitest run"
```

- [ ] **Step 4: Smoke test do runner**

`src/lib/__smoke__.test.ts`:
```ts
import { expect, test } from 'vitest';
test('runner works', () => { expect(1 + 1).toBe(2); });
```
Run: `npm test`
Expected: 1 passed.

- [ ] **Step 5: Baseline build + limpar smoke test**

Run: `npm run build`
Expected: build passa (baseline, antes de qualquer mudança).
Depois: deletar `src/lib/__smoke__.test.ts`.

> Nota: `next build`/`next dev` pode reescrever o bloco de agente em `AGENTS.md`/`CLAUDE.md`. Se aparecer no diff, commitar junto (mantém a árvore limpa — ver AGENTS.md).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts AGENTS.md CLAUDE.md
git commit -m "chore: add vitest, install deps for analytics work"
```

---

## Task 2: Migration — tabela events + índices + grants + RPCs

**Files:**
- Create: `supabase/migrations/20261003_create_events_and_analytics.sql`

**Interfaces:**
- Produces: tabela `linktree.events` e RPCs `analytics_summary/timeseries/top_links/sources/devices/countries/activity(p_from timestamptz, p_to timestamptz)`, consumidas pela Task 7.

- [ ] **Step 1: Escrever o SQL da migration**

`supabase/migrations/20261003_create_events_and_analytics.sql`:
```sql
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
```

- [ ] **Step 2: Aplicar a migration no Supabase**

Aplicar via MCP do Supabase (`apply_migration`, projeto `ledukavvfokxzixqexcw`, name `create_events_and_analytics`) com o conteúdo do arquivo.

- [ ] **Step 3: Verificar schema e RPCs**

Via MCP (`list_tables` no schema `linktree`, ou `execute_sql`):
```sql
select count(*) from linktree.events;                              -- 0
select * from linktree.analytics_summary(now() - interval '7 day', now()); -- (0,0,0)
```
Expected: tabela existe, RPC retorna uma linha `(0,0,0)` sem erro.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20261003_create_events_and_analytics.sql
git commit -m "feat: events table and analytics RPCs migration"
```

---

## Task 3: Helpers de tracking (TDD, pure logic)

**Files:**
- Create: `src/lib/tracking.ts`
- Test: `src/lib/tracking.test.ts`

**Interfaces:**
- Produces (consumidos pelas Tasks 4 e 5):
  - `parseUserAgent(ua: string | null | undefined): { device_type: 'mobile'|'tablet'|'desktop'; browser: string; os: string; in_app: boolean }`
  - `isBot(ua: string | null | undefined): boolean`
  - `referrerHost(referrer: string | null | undefined, selfHost?: string | null): string | null`
  - `extractUtm(params: URLSearchParams): { utm_source: string|null; utm_medium: string|null; utm_campaign: string|null }`
  - `visitorHash(ip: string, ua: string, serverSalt: string, date?: Date): string`
  - `clientIp(headers: Headers): string`

- [ ] **Step 1: Escrever os testes (falhando)**

`src/lib/tracking.test.ts`:
```ts
import { expect, test, describe } from 'vitest';
import { parseUserAgent, isBot, referrerHost, extractUtm, visitorHash } from './tracking';

const UA_IG = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 302.0.0.0';
const UA_ANDROID = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const UA_IOS_SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const UA_DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const UA_BOT = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';

describe('parseUserAgent', () => {
  test('instagram webview', () => {
    const r = parseUserAgent(UA_IG);
    expect(r.in_app).toBe(true);
    expect(r.browser).toBe('Instagram');
    expect(r.device_type).toBe('mobile');
    expect(r.os).toBe('iOS');
  });
  test('android chrome', () => {
    const r = parseUserAgent(UA_ANDROID);
    expect(r.device_type).toBe('mobile');
    expect(r.browser).toBe('Chrome');
    expect(r.os).toBe('Android');
    expect(r.in_app).toBe(false);
  });
  test('ios safari', () => {
    expect(parseUserAgent(UA_IOS_SAFARI).browser).toBe('Safari');
  });
  test('desktop windows chrome', () => {
    const r = parseUserAgent(UA_DESKTOP);
    expect(r.device_type).toBe('desktop');
    expect(r.os).toBe('Windows');
  });
  test('null ua', () => {
    expect(parseUserAgent(null).device_type).toBe('desktop');
  });
});

describe('isBot', () => {
  test('facebook crawler is bot', () => expect(isBot(UA_BOT)).toBe(true));
  test('instagram webview is NOT bot', () => expect(isBot(UA_IG)).toBe(false));
  test('real browser is not bot', () => expect(isBot(UA_DESKTOP)).toBe(false));
});

describe('referrerHost', () => {
  test('strips www', () => expect(referrerHost('https://www.google.com/search?q=x')).toBe('google.com'));
  test('empty -> null', () => expect(referrerHost('')).toBeNull());
  test('self host -> null', () => expect(referrerHost('https://meusite.com/', 'meusite.com')).toBeNull());
  test('garbage -> null', () => expect(referrerHost('not a url')).toBeNull());
});

describe('extractUtm', () => {
  test('reads utm params', () => {
    const p = new URLSearchParams('utm_source=instagram&utm_medium=bio&utm_campaign=lancamento');
    expect(extractUtm(p)).toEqual({ utm_source: 'instagram', utm_medium: 'bio', utm_campaign: 'lancamento' });
  });
  test('missing -> nulls', () => {
    expect(extractUtm(new URLSearchParams(''))).toEqual({ utm_source: null, utm_medium: null, utm_campaign: null });
  });
});

describe('visitorHash', () => {
  const d = new Date('2026-10-03T12:00:00Z');
  test('deterministic same day', () => {
    expect(visitorHash('1.2.3.4', UA_DESKTOP, 'salt', d)).toBe(visitorHash('1.2.3.4', UA_DESKTOP, 'salt', d));
  });
  test('different ip -> different hash', () => {
    expect(visitorHash('1.2.3.4', UA_DESKTOP, 'salt', d)).not.toBe(visitorHash('9.9.9.9', UA_DESKTOP, 'salt', d));
  });
  test('rotates next day', () => {
    const d2 = new Date('2026-10-04T12:00:00Z');
    expect(visitorHash('1.2.3.4', UA_DESKTOP, 'salt', d)).not.toBe(visitorHash('1.2.3.4', UA_DESKTOP, 'salt', d2));
  });
  test('empty salt still works', () => {
    expect(visitorHash('1.2.3.4', UA_DESKTOP, '', d)).toHaveLength(64);
  });
});
```

- [ ] **Step 2: Rodar os testes (devem falhar)**

Run: `npm test`
Expected: FAIL (`tracking.ts` não existe / exports ausentes).

- [ ] **Step 3: Implementar `src/lib/tracking.ts`**

```ts
import { createHash } from 'crypto';

export interface UaInfo {
  device_type: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  in_app: boolean;
}

export function parseUserAgent(ua: string | null | undefined): UaInfo {
  const s = ua ?? '';
  const in_app = /Instagram/i.test(s);
  const isTablet = /iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(s);
  const isMobile = /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(s);
  const device_type: UaInfo['device_type'] = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  let os = 'Unknown';
  if (/iPhone|iPad|iPod/i.test(s)) os = 'iOS';
  else if (/Android/i.test(s)) os = 'Android';
  else if (/Windows/i.test(s)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(s)) os = 'macOS';
  else if (/Linux/i.test(s)) os = 'Linux';

  let browser = 'Unknown';
  if (in_app) browser = 'Instagram';
  else if (/Edg\//i.test(s)) browser = 'Edge';
  else if (/SamsungBrowser/i.test(s)) browser = 'Samsung Internet';
  else if (/Firefox\//i.test(s)) browser = 'Firefox';
  else if (/Chrome\//i.test(s) && !/Chromium/i.test(s)) browser = 'Chrome';
  else if (/Safari\//i.test(s) && /Version\//i.test(s)) browser = 'Safari';

  return { device_type, browser, os, in_app };
}

const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|facebookcatalog|whatsapp|telegram|discordbot|twitterbot|linkedinbot|googlebot|bingbot|preview|headless|lighthouse|monitor|ia_archiver/i;
export function isBot(ua: string | null | undefined): boolean {
  return BOT_RE.test(ua ?? '');
}

export function referrerHost(referrer: string | null | undefined, selfHost?: string | null): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    if (selfHost && host === selfHost.replace(/^www\./, '')) return null;
    return host || null;
  } catch {
    return null;
  }
}

export function extractUtm(params: URLSearchParams) {
  const g = (k: string) => {
    const v = params.get(k);
    return v && v.length ? v.slice(0, 100) : null;
  };
  return { utm_source: g('utm_source'), utm_medium: g('utm_medium'), utm_campaign: g('utm_campaign') };
}

function dailySalt(serverSalt: string, date: Date): string {
  const day = date.toISOString().slice(0, 10);
  return createHash('sha256').update(serverSalt + '|' + day).digest('hex');
}

export function visitorHash(ip: string, ua: string, serverSalt: string, date: Date = new Date()): string {
  return createHash('sha256').update(dailySalt(serverSalt, date) + '|' + ip + '|' + ua).digest('hex');
}

export function clientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return headers.get('x-real-ip') || '0.0.0.0';
}
```

- [ ] **Step 4: Rodar os testes (devem passar)**

Run: `npm test`
Expected: todos passam.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tracking.ts src/lib/tracking.test.ts
git commit -m "feat: tracking helpers (UA parse, bot filter, visitor hash, utm)"
```

---

## Task 4: Captura de pageview — `/api/track` + `<Tracker/>`

**Files:**
- Create: `src/app/api/track/route.ts`
- Create: `src/components/Tracker.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: helpers da Task 3.
- `POST /api/track` body: `{ referrer?: string; url?: string }`. Responde sempre `204`.

- [ ] **Step 1: Route handler `src/app/api/track/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { createDbClient } from '@/lib/supabase-server';
import { clientIp, extractUtm, isBot, parseUserAgent, referrerHost, visitorHash } from '@/lib/tracking';

export async function POST(req: Request) {
  try {
    const ua = req.headers.get('user-agent');
    if (isBot(ua)) return new NextResponse(null, { status: 204 });

    const body = (await req.json().catch(() => ({}))) as { referrer?: string; url?: string };
    const info = parseUserAgent(ua);
    const search = body.url ? (() => { try { return new URL(body.url!).searchParams; } catch { return new URLSearchParams(); } })() : new URLSearchParams();
    const utm = extractUtm(search);

    const supabase = createDbClient();
    const { error } = await supabase.from('events').insert({
      type: 'pageview',
      visitor_hash: visitorHash(clientIp(req.headers), ua ?? '', process.env.SERVER_SALT ?? ''),
      referrer_host: referrerHost(body.referrer, req.headers.get('host')),
      ...utm,
      device_type: info.device_type,
      browser: info.browser,
      os: info.os,
      country: req.headers.get('x-vercel-ip-country'),
      in_app: info.in_app,
    });
    if (error) console.error('track insert error', error.message);
  } catch (e) {
    console.error('track error', e);
  }
  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 2: Componente `src/components/Tracker.tsx`**

```tsx
'use client';
import { useEffect, useRef } from 'react';

export function Tracker() {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const payload = JSON.stringify({ referrer: document.referrer, url: window.location.href });
    try {
      const blob = new Blob([payload], { type: 'application/json' });
      if (!navigator.sendBeacon('/api/track', blob)) throw new Error('beacon rejected');
    } catch {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }, []);
  return null;
}
```

- [ ] **Step 3: Montar o Tracker na página pública**

Em `src/app/page.tsx`, importar e renderizar `<Tracker/>` junto do `<LinktreePage/>`:
```tsx
import { Tracker } from '@/components/Tracker';
// ...
  return (
    <>
      <Tracker />
      <LinktreePage profile={profile} links={links} theme={theme} />
    </>
  );
```

- [ ] **Step 4: Verificar build e typecheck**

Run: `npm run build`
Expected: compila sem erros de tipo.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/track/route.ts src/components/Tracker.tsx src/app/page.tsx
git commit -m "feat: pageview capture via Tracker + /api/track"
```

---

## Task 5: Captura de clique — `/go/[id]` + LinkCard

**Files:**
- Create: `src/app/go/[id]/route.ts`
- Modify: `src/components/LinkCard.tsx`

**Interfaces:**
- Consumes: helpers da Task 3; tabela `links` (coluna `url`).
- `GET /go/:id` → grava click, `302` pro destino; id inexistente → `302` pra `/`.

- [ ] **Step 1: Route handler `src/app/go/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { createDbClient } from '@/lib/supabase-server';
import { clientIp, extractUtm, isBot, parseUserAgent, referrerHost, visitorHash } from '@/lib/tracking';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const origin = new URL(req.url).origin;
  const supabase = createDbClient();

  const { data: link } = await supabase.from('links').select('url').eq('id', id).single();
  if (!link?.url) return NextResponse.redirect(origin, 302);

  try {
    const ua = req.headers.get('user-agent');
    if (!isBot(ua)) {
      const info = parseUserAgent(ua);
      const utm = extractUtm(new URL(req.url).searchParams);
      const { error } = await supabase.from('events').insert({
        type: 'click',
        link_id: id,
        visitor_hash: visitorHash(clientIp(req.headers), ua ?? '', process.env.SERVER_SALT ?? ''),
        referrer_host: referrerHost(req.headers.get('referer'), req.headers.get('host')),
        ...utm,
        device_type: info.device_type,
        browser: info.browser,
        os: info.os,
        country: req.headers.get('x-vercel-ip-country'),
        in_app: info.in_app,
      });
      if (error) console.error('click insert error', error.message);
    }
  } catch (e) {
    console.error('click track error', e);
  }

  return NextResponse.redirect(link.url, 302);
}
```

- [ ] **Step 2: Apontar o LinkCard pro redirect**

Em `src/components/LinkCard.tsx`, trocar o `href`:
```tsx
href={`/go/${link.id}`}
```
Manter `target="_blank"`, `rel="noopener noreferrer"` e todo o resto igual.

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: compila sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/app/go/[id]/route.ts src/components/LinkCard.tsx
git commit -m "feat: click capture via /go/[id] redirect"
```

---

## Task 6: Data layer do dashboard

**Files:**
- Create: `src/types/analytics.ts`
- Create: `src/lib/analytics.ts`

**Interfaces:**
- Consumes: RPCs da Task 2.
- Produces (consumido pela Task 7):
  - tipos em `src/types/analytics.ts`
  - `getAnalytics(range: 7|30|90): Promise<AnalyticsData>` e `ANALYTICS_RANGES = [7,30,90]`.

- [ ] **Step 1: Tipos `src/types/analytics.ts`**

```ts
export type AnalyticsRange = 7 | 30 | 90;
export const ANALYTICS_RANGES: AnalyticsRange[] = [7, 30, 90];

export interface AnalyticsSummary { pageviews: number; uniques: number; clicks: number; }
export interface TimeseriesPoint { day: string; pageviews: number; clicks: number; }
export interface TopLinkRow { link_id: string; clicks: number; uniques: number; }
export interface SourceRow { source: string; pageviews: number; }
export interface DeviceRow { device_type: string; count: number; }
export interface CountryRow { country: string; count: number; }
export interface ActivityRow { dow: number; hour: number; count: number; }
export interface LinkLabel { id: string; label: string; }

export interface AnalyticsData {
  range: AnalyticsRange;
  summary: AnalyticsSummary;
  timeseries: TimeseriesPoint[];
  topLinks: TopLinkRow[];
  sources: SourceRow[];
  devices: DeviceRow[];
  countries: CountryRow[];
  activity: ActivityRow[];
  links: LinkLabel[];
}
```

- [ ] **Step 2: Data layer `src/lib/analytics.ts`**

```ts
import { createDbClient } from './supabase-server';
import type { AnalyticsData, AnalyticsRange } from '@/types/analytics';

export async function getAnalytics(range: AnalyticsRange): Promise<AnalyticsData> {
  const to = new Date();
  const from = new Date(to.getTime() - range * 24 * 60 * 60 * 1000);
  const p = { p_from: from.toISOString(), p_to: to.toISOString() };
  const supabase = createDbClient();

  const [summary, timeseries, topLinks, sources, devices, countries, activity, links] = await Promise.all([
    supabase.rpc('analytics_summary', p),
    supabase.rpc('analytics_timeseries', p),
    supabase.rpc('analytics_top_links', p),
    supabase.rpc('analytics_sources', p),
    supabase.rpc('analytics_devices', p),
    supabase.rpc('analytics_countries', p),
    supabase.rpc('analytics_activity', p),
    supabase.from('links').select('id,label'),
  ]);

  return {
    range,
    summary: (summary.data?.[0] as AnalyticsData['summary']) ?? { pageviews: 0, uniques: 0, clicks: 0 },
    timeseries: timeseries.data ?? [],
    topLinks: topLinks.data ?? [],
    sources: sources.data ?? [],
    devices: devices.data ?? [],
    countries: countries.data ?? [],
    activity: activity.data ?? [],
    links: links.data ?? [],
  };
}
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: compila (supabase rpc data é `any` → tipagem via cast está ok).

- [ ] **Step 4: Commit**

```bash
git add src/types/analytics.ts src/lib/analytics.ts
git commit -m "feat: analytics data layer (RPC fetch + types)"
```

---

## Task 7: Dashboard `/admin/analytics` — página + componentes

**Files:**
- Create: `src/app/admin/(protected)/analytics/page.tsx`
- Create: `src/components/admin/analytics/RangePicker.tsx`
- Create: `src/components/admin/analytics/KpiCards.tsx`
- Create: `src/components/admin/analytics/TrendChart.tsx`
- Create: `src/components/admin/analytics/TopLinks.tsx`
- Create: `src/components/admin/analytics/SourcesBreakdown.tsx`
- Create: `src/components/admin/analytics/DeviceCountryBreakdown.tsx`
- Create: `src/components/admin/analytics/ActivityHeatmap.tsx`
- Create: `src/components/admin/analytics/UtmBuilder.tsx`
- Modify: `src/app/admin/(protected)/layout.tsx` (aba "Analytics")

**Interfaces:**
- Consumes: `getAnalytics`, tipos da Task 6.

- [ ] **Step 1: RangePicker (client)**

`src/components/admin/analytics/RangePicker.tsx`:
```tsx
'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { ANALYTICS_RANGES } from '@/types/analytics';

export function RangePicker({ current }: { current: number }) {
  const router = useRouter();
  const params = useSearchParams();
  function set(r: number) {
    const p = new URLSearchParams(params.toString());
    p.set('range', String(r));
    router.push(`/admin/analytics?${p.toString()}`);
  }
  return (
    <div className="flex gap-1 rounded-xl bg-white/[0.06] border border-white/10 p-1">
      {ANALYTICS_RANGES.map((r) => (
        <button key={r} onClick={() => set(r)}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            current === r ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
          {r}d
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: KpiCards**

`src/components/admin/analytics/KpiCards.tsx`:
```tsx
import type { AnalyticsSummary } from '@/types/analytics';

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.06] border border-white/10 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

export function KpiCards({ summary }: { summary: AnalyticsSummary }) {
  const ctr = summary.pageviews > 0 ? (summary.clicks / summary.pageviews) * 100 : 0;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card label="Visitas" value={summary.pageviews.toLocaleString('pt-BR')} />
      <Card label="Visitantes únicos" value={summary.uniques.toLocaleString('pt-BR')} />
      <Card label="Cliques" value={summary.clicks.toLocaleString('pt-BR')} />
      <Card label="CTR" value={`${ctr.toFixed(1)}%`} />
    </div>
  );
}
```

- [ ] **Step 3: TrendChart (SVG inline)**

`src/components/admin/analytics/TrendChart.tsx`:
```tsx
import type { TimeseriesPoint } from '@/types/analytics';

export function TrendChart({ data }: { data: TimeseriesPoint[] }) {
  if (data.length === 0) {
    return <Empty title="Visitas e cliques por dia" />;
  }
  const W = 640, H = 160, pad = 24;
  const max = Math.max(1, ...data.map((d) => Math.max(d.pageviews, d.clicks)));
  const x = (i: number) => pad + (i * (W - 2 * pad)) / Math.max(1, data.length - 1);
  const y = (v: number) => H - pad - (v * (H - 2 * pad)) / max;
  const path = (key: 'pageviews' | 'clicks') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ');

  return (
    <section className="rounded-xl bg-white/[0.06] border border-white/10 p-4">
      <h2 className="text-sm font-medium text-white mb-3">Visitas e cliques por dia</h2>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40" preserveAspectRatio="none">
        <path d={path('pageviews')} fill="none" stroke="#6366f1" strokeWidth="2" />
        <path d={path('clicks')} fill="none" stroke="#22d3ee" strokeWidth="2" />
      </svg>
      <div className="flex gap-4 text-xs mt-2">
        <span className="text-indigo-400">● Visitas</span>
        <span className="text-cyan-300">● Cliques</span>
      </div>
    </section>
  );
}

export function Empty({ title }: { title: string }) {
  return (
    <section className="rounded-xl bg-white/[0.06] border border-white/10 p-4">
      <h2 className="text-sm font-medium text-white mb-3">{title}</h2>
      <p className="text-slate-500 text-sm">Sem dados no período.</p>
    </section>
  );
}
```

- [ ] **Step 4: TopLinks (resolve label no front)**

`src/components/admin/analytics/TopLinks.tsx`:
```tsx
import type { TopLinkRow, LinkLabel, AnalyticsSummary } from '@/types/analytics';
import { Empty } from './TrendChart';

export function TopLinks({ rows, links, summary }: { rows: TopLinkRow[]; links: LinkLabel[]; summary: AnalyticsSummary }) {
  if (rows.length === 0) return <Empty title="Top links" />;
  const labelOf = (id: string) => links.find((l) => l.id === id)?.label ?? id;
  return (
    <section className="rounded-xl bg-white/[0.06] border border-white/10 p-4">
      <h2 className="text-sm font-medium text-white mb-3">Top links</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-xs text-left">
            <th className="font-normal pb-2">Link</th>
            <th className="font-normal pb-2 text-right">Cliques</th>
            <th className="font-normal pb-2 text-right">CTR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.link_id} className="border-t border-white/5">
              <td className="py-2 text-slate-200">{labelOf(r.link_id)}</td>
              <td className="py-2 text-right text-white">{r.clicks.toLocaleString('pt-BR')}</td>
              <td className="py-2 text-right text-slate-400">
                {summary.pageviews > 0 ? `${((r.clicks / summary.pageviews) * 100).toFixed(1)}%` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
```

- [ ] **Step 5: SourcesBreakdown + DeviceCountryBreakdown (barras CSS)**

`src/components/admin/analytics/SourcesBreakdown.tsx`:
```tsx
import type { SourceRow } from '@/types/analytics';
import { Empty } from './TrendChart';

export function SourcesBreakdown({ rows }: { rows: SourceRow[] }) {
  if (rows.length === 0) return <Empty title="Origem do tráfego" />;
  const total = rows.reduce((s, r) => s + Number(r.pageviews), 0) || 1;
  return (
    <section className="rounded-xl bg-white/[0.06] border border-white/10 p-4">
      <h2 className="text-sm font-medium text-white mb-3">Origem do tráfego</h2>
      <ul className="space-y-2">
        {rows.map((r) => {
          const pct = (Number(r.pageviews) / total) * 100;
          return (
            <li key={r.source}>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>{r.source}</span><span>{pct.toFixed(0)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

`src/components/admin/analytics/DeviceCountryBreakdown.tsx`:
```tsx
import type { DeviceRow, CountryRow } from '@/types/analytics';

function Bars({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  const total = rows.reduce((s, r) => s + Number(r.count), 0) || 1;
  return (
    <section className="rounded-xl bg-white/[0.06] border border-white/10 p-4">
      <h2 className="text-sm font-medium text-white mb-3">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-slate-500 text-sm">Sem dados no período.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => {
            const pct = (Number(r.count) / total) * 100;
            return (
              <li key={r.label}>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>{r.label}</span><span>{Number(r.count).toLocaleString('pt-BR')}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const DEVICE_LABEL: Record<string, string> = { mobile: 'Celular', tablet: 'Tablet', desktop: 'Desktop', unknown: 'Desconhecido' };

export function DeviceCountryBreakdown({ devices, countries }: { devices: DeviceRow[]; countries: CountryRow[] }) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <Bars title="Dispositivo" rows={devices.map((d) => ({ label: DEVICE_LABEL[d.device_type] ?? d.device_type, count: Number(d.count) }))} />
      <Bars title="País" rows={countries.map((c) => ({ label: c.country, count: Number(c.count) }))} />
    </div>
  );
}
```

- [ ] **Step 6: ActivityHeatmap (CSS grid)**

`src/components/admin/analytics/ActivityHeatmap.tsx`:
```tsx
import type { ActivityRow } from '@/types/analytics';
import { Empty } from './TrendChart';

const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function ActivityHeatmap({ rows }: { rows: ActivityRow[] }) {
  if (rows.length === 0) return <Empty title="Atividade por horário (BRT)" />;
  const max = Math.max(1, ...rows.map((r) => Number(r.count)));
  const at = (dow: number, hour: number) =>
    Number(rows.find((r) => r.dow === dow && r.hour === hour)?.count ?? 0);
  return (
    <section className="rounded-xl bg-white/[0.06] border border-white/10 p-4 overflow-x-auto">
      <h2 className="text-sm font-medium text-white mb-3">Atividade por horário (BRT)</h2>
      <div className="min-w-[640px]">
        <div className="grid" style={{ gridTemplateColumns: `32px repeat(24, 1fr)` }}>
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="text-[9px] text-slate-500 text-center">{h}</div>
          ))}
          {DOW.map((name, d) => (
            <div key={d} className="contents">
              <div className="text-[10px] text-slate-400 pr-1 flex items-center">{name}</div>
              {Array.from({ length: 24 }, (_, h) => {
                const v = at(d, h);
                const a = v === 0 ? 0 : 0.15 + 0.85 * (v / max);
                return <div key={h} className="aspect-square m-[1px] rounded-sm"
                  style={{ backgroundColor: `rgba(99,102,241,${a})` }} title={`${name} ${h}h: ${v}`} />;
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: UtmBuilder (client)**

`src/components/admin/analytics/UtmBuilder.tsx`:
```tsx
'use client';
import { useState } from 'react';

const MEDIUMS = ['bio', 'story', 'post', 'reels'];

export function UtmBuilder({ baseUrl }: { baseUrl: string }) {
  const [medium, setMedium] = useState('bio');
  const [campaign, setCampaign] = useState('');
  const [copied, setCopied] = useState(false);

  const url = (() => {
    const u = new URL(baseUrl);
    u.searchParams.set('utm_source', 'instagram');
    u.searchParams.set('utm_medium', medium);
    if (campaign.trim()) u.searchParams.set('utm_campaign', campaign.trim());
    return u.toString();
  })();

  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  }

  return (
    <section className="rounded-xl bg-white/[0.06] border border-white/10 p-4">
      <h2 className="text-sm font-medium text-white mb-1">Gerador de link para o Instagram</h2>
      <p className="text-xs text-slate-400 mb-3">Use estes links na bio/stories pra saber de onde vem o tráfego.</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {MEDIUMS.map((m) => (
          <button key={m} onClick={() => setMedium(m)}
            className={`px-3 py-1.5 rounded-lg text-sm ${medium === m ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
            {m}
          </button>
        ))}
      </div>
      <input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="campanha (opcional, ex: lancamento-abril)"
        className="w-full mb-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500" />
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs text-slate-300 bg-black/30 rounded-lg px-3 py-2 truncate">{url}</code>
        <button onClick={copy} className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm">
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 8: Página `src/app/admin/(protected)/analytics/page.tsx`**

```tsx
import { getAnalytics } from '@/lib/analytics';
import { ANALYTICS_RANGES, type AnalyticsRange } from '@/types/analytics';
import { headers } from 'next/headers';
import { RangePicker } from '@/components/admin/analytics/RangePicker';
import { KpiCards } from '@/components/admin/analytics/KpiCards';
import { TrendChart } from '@/components/admin/analytics/TrendChart';
import { TopLinks } from '@/components/admin/analytics/TopLinks';
import { SourcesBreakdown } from '@/components/admin/analytics/SourcesBreakdown';
import { DeviceCountryBreakdown } from '@/components/admin/analytics/DeviceCountryBreakdown';
import { ActivityHeatmap } from '@/components/admin/analytics/ActivityHeatmap';
import { UtmBuilder } from '@/components/admin/analytics/UtmBuilder';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const sp = await searchParams;
  const parsed = Number(sp.range);
  const range = (ANALYTICS_RANGES.includes(parsed as AnalyticsRange) ? parsed : 30) as AnalyticsRange;
  const data = await getAnalytics(range);

  const h = await headers();
  const host = h.get('host') ?? 'localhost:3000';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  const baseUrl = `${proto}://${host}/`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Analytics</h1>
        <RangePicker current={range} />
      </div>
      <KpiCards summary={data.summary} />
      <TrendChart data={data.timeseries} />
      <div className="grid md:grid-cols-2 gap-3">
        <TopLinks rows={data.topLinks} links={data.links} summary={data.summary} />
        <SourcesBreakdown rows={data.sources} />
      </div>
      <DeviceCountryBreakdown devices={data.devices} countries={data.countries} />
      <ActivityHeatmap rows={data.activity} />
      <UtmBuilder baseUrl={baseUrl} />
    </div>
  );
}
```

- [ ] **Step 9: Aba "Analytics" na nav**

Em `src/app/admin/(protected)/layout.tsx`, adicionar um `<Link>` pra `/admin/analytics` no bloco de navegação, no mesmo estilo dos existentes (primeiro item, antes de "Links", ou após — manter o padrão visual):
```tsx
<Link href="/admin/analytics"
  className="px-3 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors text-slate-300 hover:text-white">
  Analytics
</Link>
```

- [ ] **Step 10: Verificar build**

Run: `npm run build`
Expected: compila sem erros de tipo.

- [ ] **Step 11: Commit**

```bash
git add src/app/admin/\(protected\)/analytics src/components/admin/analytics src/app/admin/\(protected\)/layout.tsx
git commit -m "feat: analytics dashboard (KPIs, trend, sources, devices, activity, UTM builder)"
```

---

## Task 8: Integração e validação end-to-end

**Files:** nenhum (configuração + validação). Correções pontuais onde necessário.

- [ ] **Step 1: Gerar e configurar `SERVER_SALT`**

Gerar valor aleatório:
Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Local: adicionar `SERVER_SALT=<valor>` ao `.env` (ou `.env.local` conforme o projeto já usa).
- Vercel: criar env var `SERVER_SALT` (Production/Preview/Development) via MCP da Vercel no projeto correto (ver memória: `linktree-alemaodev` é o prod git-connected). Cuidado com o gotcha de env (valores embaralhados → 500).

- [ ] **Step 2: Rodar a suíte completa + build**

Run: `npm test && npm run build`
Expected: testes passam, build ok.

- [ ] **Step 3: Validar captura localmente (ou em preview)**

Subir a app (`npm run dev` ou deploy de preview na Vercel). Com o browser (agente de browser da Vercel):
1. Abrir a home `/?utm_source=instagram&utm_medium=bio`.
2. Clicar em um link (abre nova aba via `/go/[id]`).
3. Confirmar no Supabase (MCP `execute_sql`):
```sql
select type, link_id, utm_source, device_type, browser, country, in_app
from linktree.events order by created_at desc limit 10;
```
Expected: 1 `pageview` (utm_source=instagram) + 1 `click` com `link_id` correto.

- [ ] **Step 4: Validar o dashboard**

No browser, logar no `/admin` e abrir `/admin/analytics`:
- Cards mostram números coerentes (Visitas ≥1, Cliques ≥1, CTR calculado).
- Trocar período 7/30/90 atualiza.
- Top links mostra o link clicado com label correto.
- Origem mostra "Instagram".
- UTM builder gera link e copia.
- Tirar screenshot pra entrega.

- [ ] **Step 5: Validar período vazio**

Abrir `/admin/analytics?range=7` num ambiente sem eventos recentes (ou checar via dados): seções mostram "Sem dados no período", cards em `0`, página não quebra.

- [ ] **Step 6: Commit final (se houve ajustes)**

```bash
git add -A
git commit -m "chore: analytics e2e validation fixes"
```

---

## Notas de execução

- **Paralelização (dispatching-parallel-agents):** Task 2 (migration) e Task 3 (helpers) são independentes → podem rodar em paralelo. Depois, Task 4 e Task 5 são independentes entre si (ambas dependem só da Task 3) → paralelizáveis. Task 6 depende da Task 2; Task 7 depende da 6. Task 8 é sequencial no fim.
- **Ordem segura sem paralelismo:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8.
- A tabela `events` e o `/admin` já têm auth no layout `(protected)`, então o dashboard não precisa de checagem extra de sessão.
