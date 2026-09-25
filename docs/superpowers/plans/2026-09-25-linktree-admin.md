# Linktree Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the static Next.js linktree into a fully configurable admin panel backed by Supabase, with Google OAuth authentication, drag-and-drop link reordering, avatar upload, and live theme customization.

**Architecture:** Supabase hosts all persistent state in a dedicated `linktree` schema (tables: `profile`, `links`; storage bucket: `linktree-avatars`). Next.js API routes (server-side, service key) handle all writes. The public page is a Server Component that fetches fresh data on every request (`dynamic = 'force-dynamic'`). The admin section is protected by NextAuth v5 Google OAuth via `src/proxy.ts` (Next.js 16 renames `middleware.ts` to `proxy.ts`; same API, new filename and export name).

**Tech Stack:** Next.js 16.3.6, React 19, TypeScript, Tailwind v4, `next-auth@5.0.0-beta`, `@supabase/supabase-js@^2`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `react-icons@^5` (already installed), `lucide-react` (already installed)

**Spec:** `docs/superpowers/specs/2026-09-25-linktree-admin-design.md`

## Global Constraints

- MUST use schema `linktree` — never touch schemas `saas`, `whatsapp`, `rag_ipm`, `drizzle`, or `public`
- Supabase project ID: `ledukavvfokxzixqexcw`
- Admin email guard: only `yuribotelho2912@gmail.com` can sign in
- `proxy.ts` (not `middleware.ts`) — Next.js 16 breaking change; export named `proxy`, not `default`
- `params` in page components is a `Promise<{...}>` — must be awaited
- `npm run build` must exit 0 before any task is marked complete
- No `any` types, no TypeScript suppressions
- All external links: `target="_blank" rel="noopener noreferrer"`
- Public page must stay visually identical — only data source changes

## Review Focus

1. **Proxy not protecting /admin routes** — if `proxy.ts` export name is wrong or matcher is missing, unauthenticated users can access admin pages directly; verify redirect to `/admin/login` when cookie is absent.
2. **Wrong Supabase schema** — if client is initialized without `{ db: { schema: 'linktree' } }`, all queries hit `public` schema and fail silently; verify table names in error messages.
3. **signIn callback not blocking non-admin emails** — if `signIn` callback returns `true` unconditionally, any Google account can access admin; test with a non-matching email env var.
4. **DnD position not persisted** — if `PUT /api/admin/links` batch update fails silently, positions reset on refresh; verify DB rows reflect the dragged order.
5. **Avatar URL not saved to profile** — upload route returning `url` but PUT /profile not called with `avatar_url` breaks the profile image; verify the full upload → save → public-page render chain.

---

### Task 0: Supabase Schema + Storage Bucket

**Files:**
- No code files — Supabase DDL run via MCP tool

**Interfaces:**
- Produces: `linktree.profile` table (id, name, bio, avatar_url, theme JSONB, updated_at), `linktree.links` table (id, label, url, icon, enabled, featured, position, created_at), storage bucket `linktree-avatars` (public read, service-key write)

- [ ] **Step 1: Create schema and tables via Supabase MCP**

Run the following SQL on project `ledukavvfokxzixqexcw` via `mcp__claude_ai_Supabase__execute_sql`:

```sql
-- Schema
CREATE SCHEMA IF NOT EXISTS linktree;

-- Profile table (single row, id always = 1)
CREATE TABLE IF NOT EXISTS linktree.profile (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  name        TEXT NOT NULL DEFAULT 'Yuri | Alemão Dev',
  bio         TEXT NOT NULL DEFAULT 'Dev & Creator · Alemão Flow',
  avatar_url  TEXT,
  theme       JSONB NOT NULL DEFAULT '{"bgColor":"#0a0a0a","accentColor":"#6366f1","cardColor":"#ffffff","textColor":"#ffffff"}',
  updated_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT only_one_row CHECK (id = 1)
);

-- Seed profile
INSERT INTO linktree.profile (id, name, bio, avatar_url)
VALUES (1, 'Yuri | Alemão Dev', 'Dev & Creator · Alemão Flow', null)
ON CONFLICT DO NOTHING;

-- Links table
CREATE TABLE IF NOT EXISTS linktree.links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT NOT NULL,
  url         TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT 'globe',
  enabled     BOOLEAN NOT NULL DEFAULT true,
  featured    BOOLEAN NOT NULL DEFAULT false,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Seed links (mirrors src/data/links.ts)
INSERT INTO linktree.links (label, url, icon, enabled, featured, position) VALUES
  ('Instagram',         'https://instagram.com/alemaodev',        'instagram', true,  true,  0),
  ('Site Oficial',      'https://dev.alemaoflow.com',             'globe',     true,  false, 1),
  ('GitHub Corporativo','https://github.com/YuriCNZ',             'github',    true,  false, 2),
  ('GitHub Pessoal',    'https://github.com/Yurisin',             'github',    true,  false, 3),
  ('LinkedIn',          'https://linkedin.com/in/yuribotelho',    'linkedin',  false, false, 4)
ON CONFLICT DO NOTHING;
```

- [ ] **Step 2: Enable RLS and policies**

```sql
-- Enable RLS
ALTER TABLE linktree.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE linktree.links ENABLE ROW LEVEL SECURITY;

-- Public read for profile
CREATE POLICY "public_read_profile" ON linktree.profile
  FOR SELECT USING (true);

-- Public read for links
CREATE POLICY "public_read_links" ON linktree.links
  FOR SELECT USING (true);
```

- [ ] **Step 3: Create storage bucket via MCP**

Run SQL to register the bucket (or use Supabase Storage API via MCP):

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('linktree-avatars', 'linktree-avatars', true)
ON CONFLICT DO NOTHING;

-- Allow public read
CREATE POLICY "public_read_avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'linktree-avatars');
```

- [ ] **Step 4: Verify tables via MCP**

Run `SELECT * FROM linktree.profile` and `SELECT * FROM linktree.links ORDER BY position` — should return 1 profile row and 5 link rows.

---

### Task 1: Install Dependencies + Env Setup

**Files:**
- Modify: `package.json`
- Create: `.env.local` (gitignored)
- Modify: `next.config.ts` (add image domain for Supabase storage)

**Interfaces:**
- Produces: `next-auth`, `@supabase/supabase-js`, `@dnd-kit/*` available for import

- [ ] **Step 1: Install packages**

```bash
cd /root/workspace/linktree
npm install next-auth@beta @supabase/supabase-js @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Get Supabase URL and keys via MCP**

Use `mcp__claude_ai_Supabase__get_project_url` and `mcp__claude_ai_Supabase__get_publishable_keys` for project `ledukavvfokxzixqexcw` to get the URL and anon key. The service key must be retrieved from the Supabase dashboard (Settings → API → service_role key).

- [ ] **Step 3: Create `.env.local`**

```bash
cat > /root/workspace/linktree/.env.local << 'EOF'
# NextAuth
NEXTAUTH_SECRET=REPLACE_WITH_openssl_rand_-base64_32_output
AUTH_GOOGLE_ID=REPLACE_WITH_GOOGLE_CLIENT_ID
AUTH_GOOGLE_SECRET=REPLACE_WITH_GOOGLE_CLIENT_SECRET
ADMIN_EMAIL=yuribotelho2912@gmail.com

# Supabase
SUPABASE_URL=https://ledukavvfokxzixqexcw.supabase.co
SUPABASE_SERVICE_KEY=REPLACE_WITH_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_URL=https://ledukavvfokxzixqexcw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=REPLACE_WITH_ANON_KEY
EOF
```

Generate a secret and fill in the Supabase keys retrieved from MCP:
```bash
openssl rand -base64 32
```

Replace the REPLACE_WITH values in `.env.local` with real values. GOOGLE credentials must be provided by the user — note them as blockers in the plan.

- [ ] **Step 4: Update `next.config.ts` to allow Supabase image domain**

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ledukavvfokxzixqexcw.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 5: Verify build still passes**

```bash
cd /root/workspace/linktree && npm run build
```

Expected: exit 0 (no new errors from adding packages).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json next.config.ts
git commit -m "feat: install next-auth, supabase, dnd-kit; configure image domains"
```

---

### Task 2: Shared Types + Supabase Clients + Icon Map

**Files:**
- Create: `src/types/linktree.ts`
- Create: `src/lib/icons.tsx`
- Create: `src/lib/supabase-server.ts`
- Modify: `src/components/LinkCard.tsx` (import from new types + icons)
- Modify: `src/components/ProfileHeader.tsx` (import from new types)

**Interfaces:**
- Produces:
  - `IconName` (12 values), `LinkItem`, `ThemeConfig`, `ProfileData` from `@/types/linktree`
  - `getIconComponent(name: IconName): ComponentType<{ size?: number; className?: string }>` from `@/lib/icons`
  - `createDbClient(): SupabaseClient` from `@/lib/supabase-server` (linktree schema, service key)
  - `createStorageClient(): SupabaseClient` from `@/lib/supabase-server` (no schema override, service key)

- [ ] **Step 1: Create `src/types/linktree.ts`**

```typescript
// src/types/linktree.ts
export type IconName =
  | 'instagram' | 'globe'    | 'github'  | 'linkedin'
  | 'twitter'   | 'youtube'  | 'tiktok'  | 'whatsapp'
  | 'telegram'  | 'discord'  | 'email'   | 'link';

export const ALL_ICONS: IconName[] = [
  'instagram', 'github', 'linkedin', 'twitter', 'youtube', 'tiktok',
  'whatsapp', 'telegram', 'discord', 'email', 'globe', 'link',
];

export interface LinkItem {
  id: string;
  label: string;
  url: string;
  icon: IconName;
  enabled: boolean;
  featured: boolean;
  position: number;
}

export interface ThemeConfig {
  bgColor: string;
  accentColor: string;
  cardColor: string;
  textColor: string;
}

export interface ProfileData {
  id: number;
  name: string;
  bio: string;
  avatar_url: string | null;
  theme: ThemeConfig;
  updated_at: string;
}
```

- [ ] **Step 2: Create `src/lib/icons.tsx`**

```tsx
// src/lib/icons.tsx
import { ComponentType } from 'react';
import { ExternalLink, Globe, Mail, Link } from 'lucide-react';
import {
  FaInstagram, FaGithub, FaLinkedin, FaTwitter,
  FaYoutube, FaTiktok, FaWhatsapp, FaTelegram, FaDiscord,
} from 'react-icons/fa';
import { IconName } from '@/types/linktree';

type IconProps = { size?: number; className?: string };

const iconMap: Record<IconName, ComponentType<IconProps>> = {
  instagram: FaInstagram as ComponentType<IconProps>,
  globe:     Globe,
  github:    FaGithub as ComponentType<IconProps>,
  linkedin:  FaLinkedin as ComponentType<IconProps>,
  twitter:   FaTwitter as ComponentType<IconProps>,
  youtube:   FaYoutube as ComponentType<IconProps>,
  tiktok:    FaTiktok as ComponentType<IconProps>,
  whatsapp:  FaWhatsapp as ComponentType<IconProps>,
  telegram:  FaTelegram as ComponentType<IconProps>,
  discord:   FaDiscord as ComponentType<IconProps>,
  email:     Mail,
  link:      Link,
};

export const ICON_LABELS: Record<IconName, string> = {
  instagram: 'Instagram', globe: 'Website',   github: 'GitHub',
  linkedin:  'LinkedIn',  twitter: 'Twitter', youtube: 'YouTube',
  tiktok:    'TikTok',    whatsapp: 'WhatsApp', telegram: 'Telegram',
  discord:   'Discord',   email: 'Email',     link: 'Link',
};

export function getIconComponent(name: IconName): ComponentType<IconProps> {
  return iconMap[name] ?? ExternalLink;
}
```

- [ ] **Step 3: Create `src/lib/supabase-server.ts`**

```typescript
// src/lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js';

export function createDbClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { db: { schema: 'linktree' } }
  );
}

export function createStorageClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}
```

- [ ] **Step 4: Update `src/components/LinkCard.tsx`**

Replace the local `iconMap` and `IconName` import with the new shared ones:

```tsx
// src/components/LinkCard.tsx
import { ExternalLink } from 'lucide-react';
import { LinkItem } from '@/types/linktree';
import { getIconComponent } from '@/lib/icons';

interface Props {
  link: LinkItem;
  index: number;
}

export function LinkCard({ link, index }: Props) {
  const Icon = getIconComponent(link.icon);

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 w-full px-5 py-4 rounded-xl
        bg-white/[0.06] backdrop-blur-sm border border-white/10
        hover:border-white/20 hover:bg-white/[0.10]
        hover:shadow-[0_0_20px_rgba(99,102,241,0.25)]
        active:scale-[0.98]
        transition-all duration-200 ease-out
        hover:scale-[1.02]
        cursor-pointer"
      aria-label={`Abrir ${link.label} em nova aba`}
      style={{ animationDelay: `${(index + 1) * 100}ms` }}
    >
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
          link.featured
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
            : 'bg-white/10'
        }`}
      >
        <Icon size={18} className="text-white" />
      </div>
      <span className="flex-1 text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
        {link.label}
      </span>
      <ExternalLink
        size={14}
        className="text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0"
      />
    </a>
  );
}
```

- [ ] **Step 5: Update `src/components/ProfileHeader.tsx`**

Replace `ProfileConfig` from `@/data/profile` with `ProfileData` from `@/types/linktree`. Compute initials from `name` (first letter of first two words):

```tsx
// src/components/ProfileHeader.tsx
import Image from 'next/image';
import { ProfileData } from '@/types/linktree';

interface Props {
  profile: ProfileData;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function ProfileHeader({ profile }: Props) {
  const initials = getInitials(profile.name);
  return (
    <div className="flex flex-col items-center gap-4 mb-10">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 blur-xl opacity-40 scale-110" />
        {profile.avatar_url ? (
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/10">
            <Image
              src={profile.avatar_url}
              alt={profile.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-2 border-white/10">
            <span className="text-white text-xl font-semibold">{initials}</span>
          </div>
        )}
      </div>
      <h1 className="text-2xl font-semibold text-white tracking-tight">
        {profile.name}
      </h1>
      {profile.bio && (
        <p className="text-sm text-slate-400 text-center max-w-xs leading-relaxed">
          {profile.bio}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Verify build**

```bash
cd /root/workspace/linktree && npm run build
```

Expected: exit 0. LinktreePage still imports from `@/data/*` at this point — that's fine, it gets updated in Task 3.

- [ ] **Step 7: Commit**

```bash
git add src/types/ src/lib/ src/components/LinkCard.tsx src/components/ProfileHeader.tsx
git commit -m "feat: add shared types, icon map, supabase server client"
```

---

### Task 3: Public Page — SSR from Supabase

**Files:**
- Modify: `src/components/LinktreePage.tsx` (accept props instead of static imports)
- Modify: `src/app/page.tsx` (SSR: fetch from Supabase, pass props)

**Interfaces:**
- Consumes: `ProfileData`, `LinkItem`, `ThemeConfig` from `@/types/linktree`; `createDbClient` from `@/lib/supabase-server`
- Produces: public page fetches live data from `linktree.profile` and `linktree.links`

- [ ] **Step 1: Update `src/components/LinktreePage.tsx`**

Accept `profile`, `links`, `theme` as props instead of importing static data:

```tsx
// src/components/LinktreePage.tsx
import { ProfileHeader } from './ProfileHeader';
import { LinkCard } from './LinkCard';
import { ProfileData, LinkItem, ThemeConfig } from '@/types/linktree';

interface Props {
  profile: ProfileData;
  links: LinkItem[];
  theme: ThemeConfig;
}

export function LinktreePage({ profile, links, theme }: Props) {
  const enabledLinks = links.filter((l) => l.enabled);

  return (
    <main
      className="min-h-screen flex items-start justify-center px-4 pt-16 pb-12"
      style={{ backgroundColor: theme.bgColor, color: theme.textColor }}
    >
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% -10%, ${theme.accentColor}26 0%, transparent 70%)`,
        }}
      />
      <div className="relative w-full max-w-sm animate-fade-in">
        <ProfileHeader profile={profile} />
        <div className="flex flex-col gap-3">
          {enabledLinks.map((link, index) => (
            <div
              key={link.id}
              className="animate-slide-up"
              style={{ animationDelay: `${(index + 1) * 100}ms`, animationFillMode: 'both' }}
            >
              <LinkCard link={link} index={index} />
            </div>
          ))}
        </div>
        <p className="mt-12 text-center text-xs text-slate-700" suppressHydrationWarning>
          © 2026 Yuri Botelho
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Update `src/app/page.tsx`**

Server Component that fetches from Supabase and passes props. `dynamic = 'force-dynamic'` ensures no caching — changes appear immediately:

```tsx
// src/app/page.tsx
import { LinktreePage } from '@/components/LinktreePage';
import { createDbClient } from '@/lib/supabase-server';
import { ProfileData, LinkItem, ThemeConfig } from '@/types/linktree';

export const dynamic = 'force-dynamic';

const DEFAULT_THEME: ThemeConfig = {
  bgColor: '#0a0a0a',
  accentColor: '#6366f1',
  cardColor: '#ffffff',
  textColor: '#ffffff',
};

export default async function Home() {
  const supabase = createDbClient();

  const [{ data: profileData }, { data: linksData }] = await Promise.all([
    supabase.from('profile').select('*').eq('id', 1).single(),
    supabase.from('links').select('*').order('position'),
  ]);

  const profile = profileData as ProfileData ?? {
    id: 1, name: 'Yuri | Alemão Dev', bio: 'Dev & Creator · Alemão Flow',
    avatar_url: null, theme: DEFAULT_THEME, updated_at: '',
  };
  const links = (linksData ?? []) as LinkItem[];
  const theme: ThemeConfig = profile.theme ?? DEFAULT_THEME;

  return <LinktreePage profile={profile} links={links} theme={theme} />;
}
```

- [ ] **Step 3: Verify build**

```bash
cd /root/workspace/linktree && npm run build
```

Expected: exit 0. The `src/data/` files still exist but are no longer imported.

- [ ] **Step 4: Quick smoke test (local dev)**

```bash
cd /root/workspace/linktree && npm run dev &
sleep 5 && curl -s http://localhost:3000 | grep -q "Yuri" && echo "OK" || echo "FAIL"
kill %1
```

Expected: "OK" — page renders with data from Supabase.

- [ ] **Step 5: Commit**

```bash
git add src/components/LinktreePage.tsx src/app/page.tsx
git commit -m "feat: public page now SSR from Supabase linktree schema"
```

---

### Task 4: Auth — NextAuth v5 + Proxy

**Files:**
- Create: `src/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/proxy.ts` (Next.js 16 equivalent of middleware.ts)
- Modify: `src/app/layout.tsx` (add SessionProvider)

**Interfaces:**
- Consumes: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `NEXTAUTH_SECRET`, `ADMIN_EMAIL` env vars
- Produces: `auth` (session getter / middleware wrapper), `handlers` (GET/POST), `signIn`, `signOut` — all from `@/auth`

- [ ] **Step 1: Create `src/auth.ts`**

```typescript
// src/auth.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async signIn({ user }) {
      return user.email === process.env.ADMIN_EMAIL;
    },
  },
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
});
```

- [ ] **Step 2: Create `src/app/api/auth/[...nextauth]/route.ts`**

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/auth';
export const { GET, POST } = handlers;
```

- [ ] **Step 3: Create `src/proxy.ts`**

Next.js 16 renamed `middleware.ts` → `proxy.ts`; export must be named `proxy` (not `default` nor `middleware`):

```typescript
// src/proxy.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const proxy = auth((req: NextRequest & { auth: unknown }) => {
  const isAdminPath = req.nextUrl.pathname.startsWith('/admin');
  const isLoginPath = req.nextUrl.pathname === '/admin/login';

  if (isAdminPath && !isLoginPath && !req.auth) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
});

export const config = {
  matcher: ['/admin/:path*'],
};
```

- [ ] **Step 4: Update `src/app/layout.tsx` — add SessionProvider**

NextAuth v5 `SessionProvider` is from `next-auth/react`:

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Yuri | Alemão Dev',
  description: 'Links de Yuri Botelho — Alemão Dev',
  openGraph: {
    title: 'Yuri | Alemão Dev',
    description: 'Links de Yuri Botelho — Alemão Dev',
    images: ['/og-image.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yuri | Alemão Dev',
    description: 'Links de Yuri Botelho — Alemão Dev',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Verify build**

```bash
cd /root/workspace/linktree && npm run build
```

Expected: exit 0. TypeScript must resolve `next-auth` types without errors.

- [ ] **Step 6: Commit**

```bash
git add src/auth.ts src/proxy.ts src/app/api/ src/app/layout.tsx
git commit -m "feat: add NextAuth v5 Google OAuth, proxy protection for /admin"
```

---

### Task 5: Admin API Routes

**Files:**
- Create: `src/app/api/admin/profile/route.ts`
- Create: `src/app/api/admin/links/route.ts`
- Create: `src/app/api/admin/links/[id]/route.ts`
- Create: `src/app/api/admin/upload/route.ts`

**Interfaces:**
- Consumes: `auth` from `@/auth`, `createDbClient`, `createStorageClient` from `@/lib/supabase-server`
- Produces:
  - `GET /api/admin/profile` → `ProfileData`
  - `PUT /api/admin/profile` → `ProfileData` (body: `{ name, bio, avatar_url, theme }`)
  - `GET /api/admin/links` → `LinkItem[]`
  - `POST /api/admin/links` → `LinkItem` (body: `{ label, url, icon, enabled, featured }`)
  - `PUT /api/admin/links` → `{ ok: true }` (body: `Array<{ id: string; position: number }>`)
  - `PUT /api/admin/links/[id]` → `LinkItem` (body: partial LinkItem fields)
  - `DELETE /api/admin/links/[id]` → `{ ok: true }`
  - `POST /api/admin/upload` → `{ url: string }` (multipart FormData with `file` field)

- [ ] **Step 1: Create `src/app/api/admin/profile/route.ts`**

```typescript
// src/app/api/admin/profile/route.ts
import { auth } from '@/auth';
import { createDbClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const GET = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createDbClient();
  const { data, error } = await supabase.from('profile').select('*').eq('id', 1).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const PUT = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const supabase = createDbClient();
  const { data, error } = await supabase
    .from('profile')
    .update({
      name: body.name,
      bio: body.bio,
      avatar_url: body.avatar_url,
      theme: body.theme,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});
```

- [ ] **Step 2: Create `src/app/api/admin/links/route.ts`**

```typescript
// src/app/api/admin/links/route.ts
import { auth } from '@/auth';
import { createDbClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const GET = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createDbClient();
  const { data, error } = await supabase.from('links').select('*').order('position');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const supabase = createDbClient();
  const { data: existing } = await supabase
    .from('links').select('position').order('position', { ascending: false }).limit(1);
  const maxPosition = (existing?.[0]?.position ?? -1) as number;
  const { data, error } = await supabase
    .from('links')
    .insert({ label: body.label, url: body.url, icon: body.icon ?? 'globe',
               enabled: body.enabled ?? true, featured: body.featured ?? false,
               position: maxPosition + 1 })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
});

// Batch position update for reorder
export const PUT = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json() as Array<{ id: string; position: number }>;
  const supabase = createDbClient();
  await Promise.all(
    body.map(({ id, position }) => supabase.from('links').update({ position }).eq('id', id))
  );
  return NextResponse.json({ ok: true });
});
```

- [ ] **Step 3: Create `src/app/api/admin/links/[id]/route.ts`**

```typescript
// src/app/api/admin/links/[id]/route.ts
import { auth } from '@/auth';
import { createDbClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const PUT = auth(async (req, ctx) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await (ctx.params as Promise<{ id: string }>);
  const body = await req.json();
  const supabase = createDbClient();
  const { data, error } = await supabase
    .from('links').update(body).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const DELETE = auth(async (req, ctx) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await (ctx.params as Promise<{ id: string }>);
  const supabase = createDbClient();
  const { error } = await supabase.from('links').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});
```

- [ ] **Step 4: Create `src/app/api/admin/upload/route.ts`**

```typescript
// src/app/api/admin/upload/route.ts
import { auth } from '@/auth';
import { createStorageClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const ext = file.name.split('.').pop() ?? 'jpg';
  const filename = `avatar-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createStorageClient();
  const { error } = await supabase.storage
    .from('linktree-avatars')
    .upload(filename, buffer, { contentType: file.type, upsert: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage
    .from('linktree-avatars')
    .getPublicUrl(filename);

  return NextResponse.json({ url: publicUrl });
});
```

- [ ] **Step 5: Verify build**

```bash
cd /root/workspace/linktree && npm run build
```

Expected: exit 0. TypeScript must accept the `auth` wrapper on route handlers.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/
git commit -m "feat: admin API routes for profile, links, upload"
```

---

### Task 6: Admin UI Components

**Files:**
- Create: `src/components/admin/IconPicker.tsx`
- Create: `src/components/admin/LinkEditor.tsx`
- Create: `src/components/admin/LinkList.tsx`
- Create: `src/components/admin/ProfileEditor.tsx`
- Create: `src/components/admin/ThemeEditor.tsx`

**Interfaces:**
- Consumes: `IconName`, `ALL_ICONS`, `LinkItem`, `ProfileData`, `ThemeConfig` from `@/types/linktree`; `getIconComponent`, `ICON_LABELS` from `@/lib/icons`
- Produces:
  - `<IconPicker value={IconName} onChange={(v: IconName) => void} />`
  - `<LinkEditor link={LinkItem | null} onSave={(data) => void} onClose={() => void} />`
  - `<LinkList links={LinkItem[]} onReorder={(ids) => void} onEdit={(link) => void} onDelete={(id) => void} onToggle={(id, enabled) => void} />`
  - `<ProfileEditor profile={ProfileData} onSave={(data) => void} />`
  - `<ThemeEditor theme={ThemeConfig} onSave={(theme: ThemeConfig) => void} />`

- [ ] **Step 1: Create `src/components/admin/IconPicker.tsx`**

```tsx
// src/components/admin/IconPicker.tsx
'use client';
import { IconName, ALL_ICONS } from '@/types/linktree';
import { getIconComponent, ICON_LABELS } from '@/lib/icons';

interface Props {
  value: IconName;
  onChange: (icon: IconName) => void;
}

export function IconPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {ALL_ICONS.map((name) => {
        const Icon = getIconComponent(name);
        return (
          <button
            key={name}
            type="button"
            onClick={() => onChange(name)}
            className={`p-2 rounded-lg border flex flex-col items-center gap-1 text-xs transition-colors
              ${value === name
                ? 'border-indigo-500 bg-indigo-500/20 text-white'
                : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-400'}`}
            title={ICON_LABELS[name]}
          >
            <Icon size={18} />
            <span className="truncate w-full text-center text-[10px]">{ICON_LABELS[name]}</span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/admin/LinkEditor.tsx`**

Modal for creating and editing a link:

```tsx
// src/components/admin/LinkEditor.tsx
'use client';
import { useState } from 'react';
import { LinkItem, IconName } from '@/types/linktree';
import { IconPicker } from './IconPicker';
import { X } from 'lucide-react';

interface Props {
  link: LinkItem | null; // null = create mode
  onSave: (data: Omit<LinkItem, 'id' | 'position'>) => void;
  onClose: () => void;
}

export function LinkEditor({ link, onSave, onClose }: Props) {
  const [label, setLabel] = useState(link?.label ?? '');
  const [url, setUrl] = useState(link?.url ?? '');
  const [icon, setIcon] = useState<IconName>(link?.icon ?? 'globe');
  const [enabled, setEnabled] = useState(link?.enabled ?? true);
  const [featured, setFeatured] = useState(link?.featured ?? false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ label, url, icon, enabled, featured });
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {link ? 'Editar Link' : 'Novo Link'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Nome</label>
            <input
              value={label} onChange={(e) => setLabel(e.target.value)} required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Ex: Instagram"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">URL</label>
            <input
              value={url} onChange={(e) => setUrl(e.target.value)} required type="url"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Ícone</label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="accent-indigo-500" />
              Ativado
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="accent-indigo-500" />
              Destaque
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/admin/LinkList.tsx`**

Drag-and-drop sortable list using `@dnd-kit`:

```tsx
// src/components/admin/LinkList.tsx
'use client';
import { useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LinkItem } from '@/types/linktree';
import { getIconComponent } from '@/lib/icons';
import { GripVertical, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';

interface RowProps {
  link: LinkItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

function SortableLinkRow({ link, onEdit, onDelete, onToggle }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: link.id });
  const Icon = getIconComponent(link.icon);
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 p-3 rounded-xl border ${
        isDragging ? 'border-indigo-500 bg-indigo-500/10 z-10' : 'border-white/10 bg-white/5'
      } transition-colors`}
    >
      <button {...attributes} {...listeners} className="text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing">
        <GripVertical size={18} />
      </button>
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-slate-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${link.enabled ? 'text-white' : 'text-slate-500'}`}>
          {link.label}
        </p>
        <p className="text-xs text-slate-600 truncate">{link.url}</p>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white" title={link.enabled ? 'Desativar' : 'Ativar'}>
          {link.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white" title="Editar">
          <Pencil size={16} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400" title="Excluir">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

interface Props {
  links: LinkItem[];
  onReorder: (newLinks: LinkItem[]) => void;
  onEdit: (link: LinkItem) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}

export function LinkList({ links, onReorder, onEdit, onDelete, onToggle }: Props) {
  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);
    onReorder(arrayMove(links, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {links.map((link) => (
            <SortableLinkRow
              key={link.id}
              link={link}
              onEdit={() => onEdit(link)}
              onDelete={() => onDelete(link.id)}
              onToggle={() => onToggle(link.id, !link.enabled)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

- [ ] **Step 4: Create `src/components/admin/ProfileEditor.tsx`**

```tsx
// src/components/admin/ProfileEditor.tsx
'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { ProfileData } from '@/types/linktree';
import { Upload } from 'lucide-react';

interface Props {
  profile: ProfileData;
  onSave: (data: { name: string; bio: string; avatar_url: string | null }) => Promise<void>;
}

export function ProfileEditor({ profile, onSave }: Props) {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json();
      setAvatarUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({ name, bio, avatar_url: avatarUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const displayImage = preview ?? avatarUrl;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex items-center gap-6">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          {displayImage && (
            <Image src={displayImage} alt="Avatar" fill className="object-cover" unoptimized={!!preview} />
          )}
          {!displayImage && (
            <span className="text-white text-xl font-semibold">
              {name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition-colors disabled:opacity-50"
          >
            <Upload size={16} />
            {uploading ? 'Enviando...' : 'Trocar foto'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Nome</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Bio</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
          rows={3} />
      </div>
      <button type="submit" disabled={saving || uploading}
        className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
        {saving ? 'Salvando...' : 'Salvar Perfil'}
      </button>
    </form>
  );
}
```

- [ ] **Step 5: Create `src/components/admin/ThemeEditor.tsx`**

```tsx
// src/components/admin/ThemeEditor.tsx
'use client';
import { useState } from 'react';
import { ThemeConfig } from '@/types/linktree';

interface Props {
  theme: ThemeConfig;
  onSave: (theme: ThemeConfig) => Promise<void>;
}

const FIELDS: Array<{ key: keyof ThemeConfig; label: string }> = [
  { key: 'bgColor',      label: 'Cor de Fundo' },
  { key: 'accentColor',  label: 'Cor de Destaque' },
  { key: 'cardColor',    label: 'Cor dos Cards' },
  { key: 'textColor',    label: 'Cor do Texto' },
];

export function ThemeEditor({ theme, onSave }: Props) {
  const [values, setValues] = useState<ThemeConfig>(theme);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: keyof ThemeConfig, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {/* Live preview */}
      <div
        className="rounded-xl p-4 border border-white/10"
        style={{ backgroundColor: values.bgColor }}
      >
        <div
          className="h-2 rounded-full mb-3"
          style={{ background: `linear-gradient(to right, ${values.accentColor}, ${values.accentColor}88)` }}
        />
        <div
          className="rounded-lg p-3 text-sm"
          style={{ backgroundColor: values.cardColor, color: values.textColor, opacity: 0.9 }}
        >
          Preview do card
        </div>
      </div>
      {FIELDS.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-4">
          <input
            type="color"
            value={values[key].startsWith('#') ? values[key] : '#6366f1'}
            onChange={(e) => update(key, e.target.value)}
            className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
          />
          <div className="flex-1">
            <label className="text-xs text-slate-400 block mb-1">{label}</label>
            <input
              value={values[key]}
              onChange={(e) => update(key, e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      ))}
      <button type="submit" disabled={saving}
        className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
        {saving ? 'Salvando...' : 'Salvar Tema'}
      </button>
    </form>
  );
}
```

- [ ] **Step 6: Verify build**

```bash
cd /root/workspace/linktree && npm run build
```

Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/
git commit -m "feat: admin UI components (IconPicker, LinkEditor, LinkList, ProfileEditor, ThemeEditor)"
```

---

### Task 7: Admin Pages + Layout

**Files:**
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/links/page.tsx`
- Create: `src/app/admin/profile/page.tsx`
- Create: `src/app/admin/theme/page.tsx`

**Interfaces:**
- Consumes: All admin components from Task 6; API routes from Task 5; `signIn`, `signOut` from `@/auth`
- Produces: Working admin panel at `/admin` (redirects to `/admin/links`), login at `/admin/login`

- [ ] **Step 1: Create `src/app/admin/login/page.tsx`**

```tsx
// src/app/admin/login/page.tsx
'use client';
import { signIn } from 'next-auth/react';
import { FaGoogle } from 'react-icons/fa';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(99,102,241,0.15) 0%, transparent 70%)' }}
      />
      <div className="relative flex flex-col items-center gap-8 p-10 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-semibold text-white">Admin</h1>
          <p className="text-sm text-slate-400">Acesso restrito ao proprietário</p>
        </div>
        <button
          onClick={() => signIn('google', { callbackUrl: '/admin/links' })}
          className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white text-gray-900 font-medium hover:bg-gray-100 transition-colors text-sm"
        >
          <FaGoogle size={18} />
          Entrar com Google
        </button>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create `src/app/admin/layout.tsx`**

```tsx
// src/app/admin/layout.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SignOutButton } from '@/components/admin/SignOutButton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/admin/login');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="border-b border-white/10 bg-white/[0.02] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Link href="/admin/links"
              className="px-3 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors text-slate-300 hover:text-white">
              Links
            </Link>
            <Link href="/admin/profile"
              className="px-3 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors text-slate-300 hover:text-white">
              Perfil
            </Link>
            <Link href="/admin/theme"
              className="px-3 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors text-slate-300 hover:text-white">
              Tema
            </Link>
            <Link href="/" target="_blank"
              className="px-3 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors text-slate-500 hover:text-white">
              ↗ Ver página
            </Link>
          </div>
          <SignOutButton />
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/admin/SignOutButton.tsx`**

This is a Client Component needed because `signOut` is a client action:

```tsx
// src/components/admin/SignOutButton.tsx
'use client';
import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="text-xs text-slate-500 hover:text-white transition-colors"
    >
      Sair
    </button>
  );
}
```

- [ ] **Step 4: Create `src/app/admin/page.tsx`**

```tsx
// src/app/admin/page.tsx
import { redirect } from 'next/navigation';
export default function AdminPage() {
  redirect('/admin/links');
}
```

- [ ] **Step 5: Create `src/app/admin/links/page.tsx`**

Full CRUD + drag-to-reorder:

```tsx
// src/app/admin/links/page.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { LinkItem } from '@/types/linktree';
import { LinkList } from '@/components/admin/LinkList';
import { LinkEditor } from '@/components/admin/LinkEditor';
import { Plus } from 'lucide-react';

export default function LinksAdminPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [editing, setEditing] = useState<LinkItem | null | 'new'>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    const res = await fetch('/api/admin/links');
    if (res.ok) setLinks(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  async function handleSave(data: Omit<LinkItem, 'id' | 'position'>) {
    setError(null);
    if (editing === 'new') {
      const res = await fetch('/api/admin/links', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (!res.ok) { setError('Erro ao criar link'); return; }
      const newLink = await res.json();
      setLinks((prev) => [...prev, newLink]);
    } else if (editing) {
      const res = await fetch(`/api/admin/links/${editing.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (!res.ok) { setError('Erro ao atualizar link'); return; }
      const updated = await res.json();
      setLinks((prev) => prev.map((l) => l.id === updated.id ? updated : l));
    }
    setEditing(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este link?')) return;
    const res = await fetch(`/api/admin/links/${id}`, { method: 'DELETE' });
    if (res.ok) setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  async function handleToggle(id: string, enabled: boolean) {
    const res = await fetch(`/api/admin/links/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled }),
    });
    if (res.ok) {
      const updated = await res.json();
      setLinks((prev) => prev.map((l) => l.id === updated.id ? updated : l));
    }
  }

  async function handleReorder(newLinks: LinkItem[]) {
    setLinks(newLinks); // optimistic
    await fetch('/api/admin/links', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLinks.map((l, i) => ({ id: l.id, position: i }))),
    });
  }

  if (loading) return <p className="text-slate-400">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Links</h1>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Novo Link
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {links.length === 0 ? (
        <p className="text-slate-500 text-sm">Nenhum link ainda. Crie um!</p>
      ) : (
        <LinkList
          links={links}
          onReorder={handleReorder}
          onEdit={setEditing}
          onDelete={handleDelete}
          onToggle={handleToggle}
        />
      )}
      {(editing === 'new' || (editing && editing !== 'new')) && (
        <LinkEditor
          link={editing === 'new' ? null : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create `src/app/admin/profile/page.tsx`**

```tsx
// src/app/admin/profile/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { ProfileData } from '@/types/linktree';
import { ProfileEditor } from '@/components/admin/ProfileEditor';

export default function ProfileAdminPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/profile').then((r) => r.json()).then(setProfile);
  }, []);

  async function handleSave(data: { name: string; bio: string; avatar_url: string | null }) {
    if (!profile) return;
    const res = await fetch('/api/admin/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...profile, ...data }),
    });
    if (!res.ok) throw new Error('Failed to save');
    const updated = await res.json();
    setProfile(updated);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  if (!profile) return <p className="text-slate-400">Carregando...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">Perfil</h1>
      {success && <p className="text-green-400 text-sm">Perfil salvo com sucesso!</p>}
      <ProfileEditor profile={profile} onSave={handleSave} />
    </div>
  );
}
```

- [ ] **Step 7: Create `src/app/admin/theme/page.tsx`**

```tsx
// src/app/admin/theme/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { ProfileData, ThemeConfig } from '@/types/linktree';
import { ThemeEditor } from '@/components/admin/ThemeEditor';

export default function ThemeAdminPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/profile').then((r) => r.json()).then(setProfile);
  }, []);

  async function handleSave(theme: ThemeConfig) {
    if (!profile) return;
    const res = await fetch('/api/admin/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...profile, theme }),
    });
    if (!res.ok) throw new Error('Failed to save');
    const updated = await res.json();
    setProfile(updated);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  if (!profile) return <p className="text-slate-400">Carregando...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">Tema</h1>
      {success && <p className="text-green-400 text-sm">Tema salvo!</p>}
      <ThemeEditor theme={profile.theme} onSave={handleSave} />
    </div>
  );
}
```

- [ ] **Step 8: Verify build**

```bash
cd /root/workspace/linktree && npm run build
```

Expected: exit 0.

- [ ] **Step 9: Commit**

```bash
git add src/app/admin/ src/components/admin/SignOutButton.tsx
git commit -m "feat: admin pages and layout (links, profile, theme)"
```

---

### Task 8: Deploy to Vercel + Browser Test

**Files:**
- No code files — Vercel env vars via MCP + git push

**Interfaces:**
- Produces: live deployment at `dev.alemaoflow.com` with working admin panel

- [ ] **Step 1: Add non-secret env vars to Vercel via MCP**

Use `mcp__claude_ai_Vercel__create_project_env` for project `prj_OFKmF7cX7Qs7YGXZ85jQJJJRvZQQ` to add:
- `SUPABASE_URL` = `https://ledukavvfokxzixqexcw.supabase.co` (production)
- `NEXT_PUBLIC_SUPABASE_URL` = `https://ledukavvfokxzixqexcw.supabase.co` (production)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<anon key from MCP>` (production)
- `ADMIN_EMAIL` = `yuribotelho2912@gmail.com` (production)
- `SUPABASE_SERVICE_KEY` = retrieved from `.env.local` (production, sensitive)
- `NEXTAUTH_SECRET` = retrieved from `.env.local` (production, sensitive)
- `AUTH_GOOGLE_ID` = user must provide (production, sensitive) — **BLOCKER: user must set up Google OAuth**
- `AUTH_GOOGLE_SECRET` = user must provide (production, sensitive) — **BLOCKER**

**Note for user:** To get Google OAuth credentials:
1. Go to https://console.cloud.google.com/apis/credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Authorized redirect URIs: `https://dev.alemaoflow.com/api/auth/callback/google`
4. Add `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` to Vercel environment variables

- [ ] **Step 2: Push to GitHub to trigger deploy**

```bash
cd /root/workspace/linktree && git push origin master
```

- [ ] **Step 3: Wait for Vercel deployment to complete**

Use `mcp__claude_ai_Vercel__list_deployments` to check the deployment status for project `prj_OFKmF7cX7Qs7YGXZ85jQJJJRvZQQ`.

- [ ] **Step 4: Test public page with Playwright browser agent**

Navigate to `https://dev.alemaoflow.com` and verify:
- Page loads with profile name "Yuri | Alemão Dev"
- Links are visible and clickable
- Visual design matches the original glassmorphism style
- No console errors

- [ ] **Step 5: Test admin login flow (if Google OAuth is configured)**

Navigate to `https://dev.alemaoflow.com/admin` and verify:
- Redirects to `/admin/login`
- Google sign-in button is visible
- After login, redirects to `/admin/links`
- Links page shows all 5 seeded links

- [ ] **Step 6: Test admin CRUD with Playwright**

On `/admin/links`:
- Click "Novo Link" → modal opens → fill in form → save → link appears in list
- Click edit → update label → save → list updates
- Drag a link to reorder → verify new order persists after page refresh
- Click toggle (eye icon) → link disables → verify it disappears from public page
- Click delete → confirm → link removed

On `/admin/profile`:
- Update name → save → verify on public page

On `/admin/theme`:
- Change accent color → save → verify on public page

- [ ] **Step 7: Final commit (update any fixes)**

```bash
cd /root/workspace/linktree && git add -A && git status
# Review changes, then:
git commit -m "fix: post-deploy fixes from browser test"
git push origin master
```
