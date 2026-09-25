# Linktree Admin Configurável — Design Spec

**Data:** 2026-09-25  
**Projeto:** `/root/workspace/linktree`  
**Status:** Draft

---

## 1. Objetivo

Transformar o frontend estático em um linktree totalmente configurável com painel de administração. O usuário deve conseguir — sem tocar em código — editar foto de perfil, nome, bio, adicionar/editar/remover/reordenar cards de link, escolher ícones, personalizar cores do tema, e ver tudo refletido na página pública em tempo real.

**Sucesso:** Qualquer mudança feita no admin aparece na página pública em < 2 segundos, sem rebuild.

---

## 2. Arquitetura

```
Browser (admin)  ──POST/PUT/DELETE──▶  Next.js API Routes  ──▶  Supabase (schema: linktree)
Browser (public) ◀──SSR/fetch──────────  Next.js page.tsx   ◀──  Supabase
                                               ↑
                                    NextAuth (Google OAuth)
                                    protege /admin/*
```

### Stack adicionado
| Pacote | Versão | Uso |
|--------|--------|-----|
| `next-auth` | `^5.0.0-beta` | Google OAuth para /admin |
| `@supabase/supabase-js` | `^2` | Client DB + Storage |
| `@dnd-kit/core` + `@dnd-kit/sortable` | latest | Drag-and-drop reorder |

---

## 3. Banco de Dados (Supabase — schema `linktree`)

### 3.1 Tabela `linktree.profile`
```sql
CREATE SCHEMA IF NOT EXISTS linktree;

CREATE TABLE linktree.profile (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  name        TEXT NOT NULL DEFAULT 'Yuri | Alemão Dev',
  bio         TEXT NOT NULL DEFAULT 'Dev & Creator · Alemão Flow',
  avatar_url  TEXT,
  theme       JSONB NOT NULL DEFAULT '{"bgColor":"#0a0a0a","accentColor":"#6366f1","cardColor":"rgba(255,255,255,0.05)","textColor":"#ffffff"}',
  updated_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT only_one_row CHECK (id = 1)
);

-- Seed
INSERT INTO linktree.profile (id, name, bio, avatar_url)
VALUES (1, 'Yuri | Alemão Dev', 'Dev & Creator · Alemão Flow', '/avatar.jpg')
ON CONFLICT DO NOTHING;
```

### 3.2 Tabela `linktree.links`
```sql
CREATE TABLE linktree.links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT NOT NULL,
  url         TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT 'globe',
  enabled     BOOLEAN NOT NULL DEFAULT true,
  featured    BOOLEAN NOT NULL DEFAULT false,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### 3.3 Storage bucket `linktree-avatars`
- Bucket público de leitura, escrita autenticada via service key.
- Política: apenas o servidor (service role) pode escrever; leitura pública.

### 3.4 RLS
- `linktree.profile`: leitura pública (`SELECT`), escrita apenas service role.
- `linktree.links`: leitura pública, escrita apenas service role.

---

## 4. Autenticação

**NextAuth v5 com Google OAuth.**

- Apenas o email do proprietário pode acessar `/admin` (configurado via env `ADMIN_EMAIL`).
- Middleware protege todo o prefixo `/admin/*`.
- Sessão JWT, duração 24h.

**Env vars necessárias:**
```
NEXTAUTH_SECRET=<random>
AUTH_GOOGLE_ID=<google-client-id>
AUTH_GOOGLE_SECRET=<google-client-secret>
ADMIN_EMAIL=yuribotelho2912@gmail.com
SUPABASE_URL=https://ledukavvfokxzixqexcw.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>
NEXT_PUBLIC_SUPABASE_URL=https://ledukavvfokxzixqexcw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

---

## 5. Estrutura de Arquivos

```
src/
  auth.ts                          ← NextAuth config (Google + email guard)
  proxy.ts                         ← Protege /admin/*, redireciona para /admin/login (Next.js 16: middleware.ts renamed to proxy.ts)
  app/
    page.tsx                       ← SSR: busca profile+links do Supabase, aplica tema via CSS vars
    layout.tsx                     ← Adiciona <SessionProvider>
    admin/
      layout.tsx                   ← Layout admin (sidebar/nav)
      page.tsx                     ← Dashboard (redirect para /admin/links)
      links/page.tsx               ← Gerenciar cards
      profile/page.tsx             ← Editar perfil + avatar
      theme/page.tsx               ← Personalizar cores
      login/page.tsx               ← Tela de login Google
    api/
      auth/[...nextauth]/route.ts  ← NextAuth handler
      admin/
        profile/route.ts           ← GET/PUT
        links/route.ts             ← GET/POST
        links/[id]/route.ts        ← PUT/DELETE
        upload/route.ts            ← POST avatar → Supabase Storage
  components/
    LinktreePage.tsx               ← Recebe props (profile, links, theme) em vez de importar estático
    ProfileHeader.tsx              ← Sem mudança
    LinkCard.tsx                   ← Sem mudança
    admin/
      ProfileEditor.tsx            ← Form: nome, bio, avatar upload
      LinkList.tsx                 ← Lista DnD com @dnd-kit
      LinkEditor.tsx               ← Modal add/edit (label, url, icon, enabled, featured)
      ThemeEditor.tsx              ← Color pickers para 3 vars de tema
      IconPicker.tsx               ← Grid de ícones disponíveis
  lib/
    supabase-server.ts             ← createClient com service key (server-only)
    supabase-public.ts             ← createClient com anon key (público)
```

---

## 6. Ícones disponíveis

```
instagram, github, linkedin, twitter, youtube, tiktok,
globe, whatsapp, telegram, discord, email, link (genérico)
```

Todos via `react-icons` já instalado.

---

## 7. Tema (CSS Variables)

A página pública aplica o tema via `style` inline no `<body>` ou no componente raiz:
```tsx
style={{
  '--bg': theme.bgColor,
  '--accent': theme.accentColor,
  '--card': theme.cardColor,
  '--text': theme.textColor,
} as React.CSSProperties}
```

O admin tem um preview ao vivo enquanto o usuário ajusta as cores.

---

## 8. Drag-and-Drop (reorder)

- `@dnd-kit/core` + `@dnd-kit/sortable`
- Ao soltar, faz `PUT /api/admin/links` com array de `{id, position}`
- Atualização otimista no client + revalidação

---

## 9. Página Pública — SSR

`app/page.tsx` vira um Server Component que:
1. Chama Supabase com anon key para buscar `linktree.profile` e `linktree.links`
2. Passa props para `<LinktreePage profile={...} links={...} theme={...} />`
3. `revalidate = 0` (sempre fresh) ou `revalidate = 60` (ISR 1 min) — preferimos `0` para mudanças imediatas

---

## 10. Fluxo de upload de avatar

1. Admin escolhe imagem → preview local
2. `POST /api/admin/upload` com `FormData`
3. API route faz upload para Supabase Storage bucket `linktree-avatars`
4. Retorna URL pública
5. `PUT /api/admin/profile` com `avatar_url` = URL pública

---

## 11. O que NÃO muda

- Design visual da página pública (glassmorphism, animações, cards)
- `LinkCard.tsx` e `ProfileHeader.tsx` — apenas recebem props
- `.gitignore`, `next.config.ts`, `tsconfig.json`

---

## 12. Seed inicial

Ao criar as tabelas, popular `linktree.links` com os 5 links atualmente em `src/data/links.ts`, preservando a experiência atual.

---

## 13. Deploy

Após implementação:
1. Adicionar env vars na Vercel (via MCP ou dashboard)
2. Push para GitHub → auto-deploy
3. Configurar Google OAuth: adicionar `https://dev.alemaoflow.com` como redirect URI autorizado
