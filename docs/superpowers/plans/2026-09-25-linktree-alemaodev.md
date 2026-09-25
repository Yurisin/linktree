# Linktree Alemão Dev Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a personalized Linktree-style page at `linktree.alemaoflow.com` with a Dark Glassmorphism design, profile header, and config-driven link list.

**Architecture:** Next.js 14 App Router with SSG — all content lives in `src/data/` config files so adding/removing links never touches component code. Components are pure presentational; data flows one-way from config → `LinktreePage` → `ProfileHeader`/`LinkCard`. Stagger animations via CSS keyframes + inline `animationDelay`.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS v3, lucide-react, next/font (Inter), Vercel

**Spec:** `docs/superpowers/specs/2026-09-25-linktree-alemaodev-design.md`

## Global Constraints

- All user-facing text and URLs must come from `src/data/` — zero hardcoded strings in components
- Icons from `lucide-react` only
- Font: Inter via `next/font/google` — no external `<link>` tags
- Background: `#0a0a0a`; card: `rgba(255,255,255,0.06)` + `backdrop-blur`
- Every link: `target="_blank" rel="noopener noreferrer"`
- Disabled links (`enabled: false`) must not render at all
- TypeScript strict mode — no `any`, no type suppressions
- `npm run build` must exit 0 before marking any task complete

## Review Focus

1. **Disabled links rendered** — a link with `enabled: false` must never appear in the DOM; if filter is applied post-render, the link flashes briefly on load.
2. **Missing `rel="noopener noreferrer"`** — external links without this are a security risk (window.opener hijack); must be on every `<a>` targeting `_blank`.
3. **Hydration mismatch on copyright year** — `new Date().getFullYear()` evaluated server-side vs client-side can differ near midnight/timezone edges; use a static year or `suppressHydrationWarning`.
4. **Avatar image 404** — when `avatarUrl` is set but the image fails to load, the fallback initials must appear; without an `onError` handler the broken-image icon shows instead.
5. **Animation jank on low-end mobile** — `backdrop-filter: blur()` on multiple elements simultaneously is GPU-intensive; if the device flag is detected (`prefers-reduced-motion`), animations must be suppressed.

---

### Task 1: Project Scaffold

**Files:**
- Create: `/root/workspace/linktree/` (Next.js project root)
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `postcss.config.mjs`

**Interfaces:**
- Produces: a working `npm run build` and `npm run dev` for an empty Next.js app

- [ ] **Step 1: Initialize Next.js project**

Run from `/root/workspace/linktree/`:
```bash
cd /root/workspace/linktree && npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --no-eslint \
  --import-alias "@/*" \
  --yes
```

If the command is interactive, answer: TypeScript=Yes, ESLint=No, Tailwind=Yes, src dir=Yes, App Router=Yes, alias=@/*.

- [ ] **Step 2: Install lucide-react**

```bash
cd /root/workspace/linktree && npm install lucide-react
```

- [ ] **Step 3: Clean up generated boilerplate**

Remove the default Next.js content so the app is blank:
```bash
cd /root/workspace/linktree
# Remove default page content - we'll replace in a later task
```

Replace `src/app/page.tsx` with a minimal placeholder:
```typescript
// src/app/page.tsx
export default function Home() {
  return <main />;
}
```

- [ ] **Step 4: Verify build passes**

```bash
cd /root/workspace/linktree && npm run build
```

Expected: `✓ Compiled successfully` with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
cd /root/workspace/linktree
git add package.json package-lock.json next.config.ts tailwind.config.ts tsconfig.json postcss.config.mjs src/ public/
git commit -m "feat: scaffold Next.js 14 project with Tailwind and lucide-react

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Data Config Layer

**Files:**
- Create: `src/data/profile.ts`
- Create: `src/data/links.ts`

**Interfaces:**
- Produces:
  - `ProfileConfig` interface and `profile` constant (exported from `src/data/profile.ts`)
  - `IconName` union type, `LinkItem` interface, `links` array (exported from `src/data/links.ts`)
  - Consumed by: `ProfileHeader`, `LinkCard`, `LinktreePage`

- [ ] **Step 1: Create `src/data/profile.ts`**

```typescript
// src/data/profile.ts

export interface ProfileConfig {
  name: string;
  bio: string;
  avatarUrl?: string;
  avatarInitials: string;
}

export const profile: ProfileConfig = {
  name: 'Yuri | Alemão Dev',
  bio: 'Dev & Creator · Alemão Flow',
  avatarInitials: 'YB',
  // avatarUrl: 'https://example.com/avatar.jpg', // uncomment to use image
};
```

- [ ] **Step 2: Create `src/data/links.ts`**

```typescript
// src/data/links.ts

export type IconName =
  | 'instagram'
  | 'globe'
  | 'github'
  | 'linkedin'
  | 'twitter'
  | 'youtube'
  | 'tiktok';

export interface LinkItem {
  id: string;
  label: string;
  url: string;
  icon: IconName;
  enabled: boolean;
  featured?: boolean;
}

export const links: LinkItem[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    url: 'https://instagram.com/alemaodev',
    icon: 'instagram',
    enabled: true,
    featured: true,
  },
  {
    id: 'website',
    label: 'Site Oficial',
    url: 'https://dev.alemaoflow.com',
    icon: 'globe',
    enabled: true,
  },
  {
    id: 'github-corp',
    label: 'GitHub Corporativo',
    url: 'https://github.com/YuriCNZ',
    icon: 'github',
    enabled: true,
  },
  {
    id: 'github-personal',
    label: 'GitHub Pessoal',
    url: 'https://github.com/Yurisin',
    icon: 'github',
    enabled: true,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    url: 'https://linkedin.com/in/yuribotelho',
    icon: 'linkedin',
    enabled: false, // set enabled: true after confirming the LinkedIn URL
  },
];
```

- [ ] **Step 3: Verify TypeScript types are sound**

```bash
cd /root/workspace/linktree && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Review Focus — disabled link filter**

Open `src/data/links.ts` and confirm LinkedIn has `enabled: false`. This will be filtered server-side in `LinktreePage`, so it will never reach the DOM. Verify in Task 6 that the filter happens before rendering.

- [ ] **Step 5: Commit**

```bash
cd /root/workspace/linktree
git add src/data/
git commit -m "feat: add profile and links config data layer

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Global Styles and Layout

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/app/layout.tsx`

**Interfaces:**
- Consumes: nothing from code
- Produces: Inter font class available on `<body>`, Tailwind base styles, `animate-fade-in` and `animate-slide-up` CSS classes

- [ ] **Step 1: Replace `src/app/globals.css`**

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out both;
  }

  .animate-slide-up {
    animation: slideUp 0.4s ease-out both;
  }

  @media (prefers-reduced-motion: reduce) {
    .animate-fade-in,
    .animate-slide-up {
      animation: none;
      opacity: 1;
      transform: none;
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **Step 2: Create `src/app/layout.tsx`**

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
cd /root/workspace/linktree && npm run build
```

Expected: compiled with no errors.

- [ ] **Step 4: Commit**

```bash
cd /root/workspace/linktree
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: add global styles with glassmorphism animations and root layout

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 4: ProfileHeader Component

**Files:**
- Create: `src/components/ProfileHeader.tsx`

**Interfaces:**
- Consumes: `ProfileConfig` from `@/data/profile`
- Produces: `ProfileHeader` React component — `({ profile: ProfileConfig }) => JSX.Element`
- Consumed by: `LinktreePage`

- [ ] **Step 1: Create `src/components/ProfileHeader.tsx`**

```typescript
// src/components/ProfileHeader.tsx
import Image from 'next/image';
import { ProfileConfig } from '@/data/profile';

interface Props {
  profile: ProfileConfig;
}

export function ProfileHeader({ profile }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 mb-10">
      {/* Avatar with glow */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 blur-xl opacity-40 scale-110" />
        {profile.avatarUrl ? (
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/10">
            <Image
              src={profile.avatarUrl}
              alt={profile.name}
              fill
              className="object-cover"
              onError={(e) => {
                // Hide broken image, show initials fallback via CSS
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.parentElement?.querySelector('[data-fallback]') as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div
              data-fallback
              className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center hidden"
            >
              <span className="text-white text-xl font-semibold">{profile.avatarInitials}</span>
            </div>
          </div>
        ) : (
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-2 border-white/10">
            <span className="text-white text-xl font-semibold">{profile.avatarInitials}</span>
          </div>
        )}
      </div>

      {/* Name */}
      <h1 className="text-2xl font-semibold text-white tracking-tight">
        {profile.name}
      </h1>

      {/* Bio */}
      {profile.bio && (
        <p className="text-sm text-slate-400 text-center max-w-xs leading-relaxed">
          {profile.bio}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript is clean**

```bash
cd /root/workspace/linktree && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Review Focus — avatar image 404**

The `onError` handler above hides the broken `<img>` and shows the `data-fallback` div. Verify this logic is present. If `avatarUrl` is undefined, the initials block always renders — no fallback needed. If `avatarUrl` is set and valid, Image renders normally.

- [ ] **Step 4: Commit**

```bash
cd /root/workspace/linktree
git add src/components/ProfileHeader.tsx
git commit -m "feat: add ProfileHeader component with avatar fallback to initials

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 5: LinkCard Component

**Files:**
- Create: `src/components/LinkCard.tsx`

**Interfaces:**
- Consumes: `LinkItem`, `IconName` from `@/data/links`
- Produces: `LinkCard` React component — `({ link: LinkItem, index: number }) => JSX.Element`
- Consumed by: `LinktreePage`

- [ ] **Step 1: Create `src/components/LinkCard.tsx`**

```typescript
// src/components/LinkCard.tsx
import {
  ExternalLink,
  Instagram,
  Globe,
  Github,
  Linkedin,
  Twitter,
  Youtube,
  Music2,
} from 'lucide-react';
import { LinkItem, IconName } from '@/data/links';
import { ComponentType } from 'react';

const iconMap: Record<IconName, ComponentType<{ size?: number; className?: string }>> = {
  instagram: Instagram,
  globe: Globe,
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
  youtube: Youtube,
  tiktok: Music2, // closest lucide icon for TikTok
};

interface Props {
  link: LinkItem;
  index: number;
}

export function LinkCard({ link, index }: Props) {
  const Icon = iconMap[link.icon] ?? ExternalLink;

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
      {/* Icon badge */}
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
          link.featured
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
            : 'bg-white/10'
        }`}
      >
        <Icon size={18} className="text-white" />
      </div>

      {/* Label */}
      <span className="flex-1 text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
        {link.label}
      </span>

      {/* Arrow */}
      <ExternalLink
        size={14}
        className="text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0"
      />
    </a>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /root/workspace/linktree && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Review Focus — `rel="noopener noreferrer"`**

Confirm that every `<a>` with `target="_blank"` in `LinkCard` has `rel="noopener noreferrer"`. The attribute is on line 23 above. There are no other `<a>` tags in this component.

- [ ] **Step 4: Commit**

```bash
cd /root/workspace/linktree
git add src/components/LinkCard.tsx
git commit -m "feat: add LinkCard component with glassmorphism hover and security attributes

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 6: LinktreePage, Main Page, and Wire-Up

**Files:**
- Create: `src/components/LinktreePage.tsx`
- Modify: `src/app/page.tsx`
- Create: `public/og-image.png` (placeholder SVG renamed to PNG)

**Interfaces:**
- Consumes: `profile` from `@/data/profile`, `links` from `@/data/links`, `ProfileHeader`, `LinkCard`
- Produces: the complete page — `LinktreePage` component and default export `Home` page

- [ ] **Step 1: Create `src/components/LinktreePage.tsx`**

```typescript
// src/components/LinktreePage.tsx
import { ProfileHeader } from './ProfileHeader';
import { LinkCard } from './LinkCard';
import { profile } from '@/data/profile';
import { links } from '@/data/links';

export function LinktreePage() {
  // Filter disabled links server-side — they never reach the DOM
  const enabledLinks = links.filter((l) => l.enabled);

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-start justify-center px-4 pt-16 pb-12">
      {/* Radial glow background — purely decorative */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(99,102,241,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Content column */}
      <div className="relative w-full max-w-sm animate-fade-in">
        <ProfileHeader profile={profile} />

        {/* Link cards with stagger */}
        <div className="flex flex-col gap-3">
          {enabledLinks.map((link, index) => (
            <div
              key={link.id}
              className="animate-slide-up"
              style={{
                animationDelay: `${(index + 1) * 100}ms`,
                animationFillMode: 'both',
              }}
            >
              <LinkCard link={link} index={index} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <p
          className="mt-12 text-center text-xs text-slate-700"
          suppressHydrationWarning
        >
          © 2026 Yuri Botelho
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Update `src/app/page.tsx`**

```typescript
// src/app/page.tsx
import { LinktreePage } from '@/components/LinktreePage';

export default function Home() {
  return <LinktreePage />;
}
```

- [ ] **Step 3: Create a placeholder OG image**

Create `public/og-image.png` — use a simple SVG-as-file approach. Run:

```bash
cd /root/workspace/linktree
cat > /tmp/og.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <defs>
    <radialGradient id="g" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#0a0a0a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="600" cy="220" r="80" fill="#6366f1" opacity="0.15"/>
  <circle cx="600" cy="220" r="60" fill="url(#g2)"/>
  <defs>
    <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <circle cx="600" cy="220" r="55" fill="url(#g2)"/>
  <text x="600" y="233" text-anchor="middle" font-family="sans-serif" font-size="36" font-weight="bold" fill="white">YB</text>
  <text x="600" y="360" text-anchor="middle" font-family="sans-serif" font-size="48" font-weight="600" fill="white">Yuri | Alemão Dev</text>
  <text x="600" y="420" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#94a3b8">Dev &amp; Creator · Alemão Flow</text>
</svg>
EOF

# Convert SVG to PNG — use ImageMagick if available, otherwise copy as-is
if command -v convert &> /dev/null; then
  convert /tmp/og.svg public/og-image.png
else
  # Copy SVG renamed as og-image.png (browsers handle SVG in meta tags)
  cp /tmp/og.svg public/og-image.png
fi
```

- [ ] **Step 4: Verify full build passes**

```bash
cd /root/workspace/linktree && npm run build
```

Expected: `✓ Compiled successfully`, page `/` exported as static HTML.

- [ ] **Step 5: Run dev server and visually inspect**

```bash
cd /root/workspace/linktree && npm run dev &
sleep 3
curl -s http://localhost:3000 | grep -q "Yuri | Alemão Dev" && echo "PASS: title found" || echo "FAIL: title missing"
```

Expected: `PASS: title found`

Kill the dev server after inspection:
```bash
pkill -f "next dev" || true
```

- [ ] **Step 6: Review Focus — disabled links not in DOM**

In `LinktreePage.tsx`, confirm `links.filter((l) => l.enabled)` runs before `map`. LinkedIn has `enabled: false` in `src/data/links.ts`. After `npm run build`, check the static HTML output:

```bash
cat /root/workspace/linktree/.next/server/app/page.html | grep -i "linkedin" && echo "FAIL: disabled link found" || echo "PASS: disabled link absent"
```

Expected: `PASS: disabled link absent`

- [ ] **Step 7: Review Focus — hydration mismatch**

The copyright footer uses a static `2026` year instead of `new Date().getFullYear()`, avoiding any server/client year mismatch. The `suppressHydrationWarning` is belt-and-suspenders. No action needed — confirmed by static year.

- [ ] **Step 8: Review Focus — `prefers-reduced-motion`**

`globals.css` already includes:
```css
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in, .animate-slide-up {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```
Confirmed in Task 3. No action needed here.

- [ ] **Step 9: Commit**

```bash
cd /root/workspace/linktree
git add src/components/LinktreePage.tsx src/app/page.tsx public/og-image.png
git commit -m "feat: add LinktreePage layout with stagger animation and wire up main page

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Vercel Deployment and Browser Validation

**Files:**
- Create: `.gitignore` update (if `.vercel/` not already ignored)

**Interfaces:**
- Consumes: the built Next.js project
- Produces: a live Vercel preview URL accessible in browser

- [ ] **Step 1: Ensure `.vercel/` is gitignored**

```bash
cd /root/workspace/linktree
grep -q ".vercel" .gitignore || echo ".vercel" >> .gitignore
```

- [ ] **Step 2: Initialize git repo if not already done**

```bash
cd /root/workspace/linktree
git status || git init && git add -A && git commit -m "chore: initial commit"
```

- [ ] **Step 3: Deploy to Vercel**

Use the Vercel CLI (install if needed):
```bash
cd /root/workspace/linktree
npm install -g vercel 2>/dev/null || true
vercel --yes --prod=false
```

This creates a preview deployment. Note the preview URL from the output (format: `https://linktree-<hash>.vercel.app`).

If the CLI asks for team/project scope, accept defaults or select the correct team for `alemaoflow.com`.

- [ ] **Step 4: Record the preview URL**

```bash
vercel ls --scope=<team> 2>/dev/null | head -5
```

Note the URL — it will look like `https://linktree-xxxxxxxx.vercel.app`.

- [ ] **Step 5: Smoke-test the deployment with curl**

```bash
PREVIEW_URL="https://linktree-REPLACE-WITH-ACTUAL.vercel.app"
curl -sL "$PREVIEW_URL" | grep -q "Yuri | Alemão Dev" && echo "PASS: page title found" || echo "FAIL: page not rendering"
curl -sL "$PREVIEW_URL" | grep -q "instagram.com/alemaodev" && echo "PASS: Instagram link found" || echo "FAIL: Instagram link missing"
curl -sL "$PREVIEW_URL" | grep -q "linkedin" && echo "FAIL: disabled LinkedIn link found" || echo "PASS: disabled LinkedIn absent"
```

All three expected: PASS.

- [ ] **Step 6: Browser validation via Playwright**

Use the Playwright browser tool to navigate to the preview URL and take a screenshot. Verify:
- Background is near-black
- Profile card shows "Yuri | Alemão Dev"
- Link cards are visible with glassmorphism styling
- No layout overflow on mobile viewport (375px width)

- [ ] **Step 7: Commit and finalize**

```bash
cd /root/workspace/linktree
git add .gitignore
git commit -m "chore: add .vercel to .gitignore

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

- [ ] **Step 8: Report preview URL to user**

Output the Vercel preview URL so the user can view the live page and configure the `linktree.alemaoflow.com` subdomain CNAME to point to `cname.vercel-dns.com`.

---

## Post-Deployment: Custom Domain (Manual Step)

After deployment, the user must configure their DNS provider:

```
Type:  CNAME
Name:  linktree
Value: cname.vercel-dns.com
TTL:   auto
```

Then in the Vercel dashboard: Project → Settings → Domains → Add `linktree.alemaoflow.com`.

---

## Success Verification Checklist

- [ ] `npm run build` exits 0 with no TypeScript errors
- [ ] Profile shows "Yuri | Alemão Dev" and "YB" initials
- [ ] 4 enabled links render (Instagram, Site, GitHub Corp, GitHub Pessoal)
- [ ] LinkedIn (disabled) does not appear in DOM
- [ ] All links have `target="_blank"` and `rel="noopener noreferrer"`
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Vercel preview URL returns HTTP 200
- [ ] Page title in browser tab: "Yuri | Alemão Dev"
