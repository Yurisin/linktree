# Linktree Alemão Dev — Design Spec

**Author:** Yuri Botelho  
**Date:** 2026-09-25  
**Status:** Approved

---

## Overview

Personal Linktree-style page for Yuri Botelho (Alemão Dev) hosted at `linktree.alemaoflow.com`. Single-page app acting as a social hub — profile card at the top, list of link buttons below, extensible via config.

## Goals

1. Fast, visually striking link hub at the subdomain
2. Zero hardcoded content — all links/profile via a single config file
3. Mobile-first, responsive, works on any screen
4. Extensible: adding a new link = one line in the config

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 14 (App Router, SSG) | Native Vercel support, SSG = static export |
| Styling | Tailwind CSS v3 | Rapid dev, glassmorphism utilities built-in |
| Language | TypeScript | Type-safe config, better DX |
| Deploy | Vercel | Domain: linktree.alemaoflow.com |
| Icons | lucide-react | Lightweight, consistent icon set |
| Font | Inter via next/font | Fast, no layout shift |

## Design System

### Colors

```
--bg:           #0a0a0a        (near-black background)
--surface:      rgba(255,255,255,0.06)   (card fill)
--border:       rgba(255,255,255,0.10)   (card border)
--border-hover: rgba(255,255,255,0.20)
--accent-from:  #6366f1        (indigo)
--accent-to:    #8b5cf6        (purple)
--text-primary: #f8fafc
--text-muted:   #94a3b8
```

### Glassmorphism Card

```css
background: rgba(255,255,255,0.06);
backdrop-filter: blur(12px);
border: 1px solid rgba(255,255,255,0.10);
border-radius: 12px;
```

### Hover State

```css
transform: scale(1.02);
border-color: rgba(255,255,255,0.20);
box-shadow: 0 0 20px rgba(99,102,241,0.25);
transition: all 0.2s ease;
```

### Typography

- Font: Inter (via `next/font/google`)
- Display name: 1.5rem, semibold
- Bio/tagline: 0.875rem, muted
- Link labels: 0.9rem, medium

## Profile Section

```
┌───────────────────────┐
│      ◉ Avatar         │  ← 80px circle, initials or image URL
│   Yuri | Alemão Dev   │  ← display name
│   [bio tagline]       │  ← configurable 1-2 line bio
└───────────────────────┘
```

- **Avatar**: configurable — image URL in profile config, fallback to styled initials
- **Background blob**: subtle radial gradient behind avatar for depth

## Links Section

Each link renders as a `LinkCard`:

```
╔══════════════════════════════════╗
║  [Icon]   Label             →   ║   ← external link opens new tab
╚══════════════════════════════════╝
```

### Initial link set (ordered):

| Order | Label | URL | Icon |
|-------|-------|-----|------|
| 1 | Instagram | https://instagram.com/alemaodev | Instagram |
| 2 | Site Oficial | https://dev.alemaoflow.com | Globe |
| 3 | GitHub Corporativo | https://github.com/YuriCNZ | Github |
| 4 | GitHub Pessoal | https://github.com/Yurisin | Github |
| 5 | LinkedIn | (placeholder — configure before publishing) | Linkedin |

### Link config shape

```typescript
interface LinkItem {
  id: string;
  label: string;
  url: string;
  icon: 'instagram' | 'globe' | 'github' | 'linkedin' | 'twitter' | 'youtube' | 'tiktok';
  enabled: boolean;          // false = hidden, not rendered
  featured?: boolean;        // optional visual highlight
}
```

## Data Architecture

```
src/
  data/
    profile.ts    ← name, bio, avatar URL
    links.ts      ← ordered array of LinkItem
```

No hardcoded content in components — zero changes needed outside `src/data/` to customize.

## Animations

- **Page load**: profile fades in, then cards stagger in (100ms delay per card, fade + translateY)
- **Hover**: scale(1.02) + border glow (CSS transition, 200ms)
- **Click/press**: scale(0.98) brief press feedback (active state)

## SEO & Meta

```html
<title>Yuri | Alemão Dev</title>
<meta name="description" content="Links de Yuri Botelho — Alemão Dev" />
<meta property="og:title" content="Yuri | Alemão Dev" />
<meta property="og:image" content="/og-image.png" />
```

## File Structure

```
/root/workspace/linktree/
├── src/
│   ├── app/
│   │   ├── layout.tsx           ← root layout, fonts, metadata
│   │   ├── page.tsx             ← main page (imports components)
│   │   └── globals.css          ← tailwind + custom utilities
│   ├── components/
│   │   ├── ProfileHeader.tsx    ← avatar + name + bio
│   │   ├── LinkCard.tsx         ← single link button
│   │   └── LinktreePage.tsx     ← page layout + stagger animation
│   └── data/
│       ├── profile.ts           ← profile config
│       └── links.ts             ← links config
├── public/
│   └── og-image.png             ← OG meta image (generated)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Deployment

1. Push repo to GitHub
2. Connect to Vercel project
3. Domain config: `linktree.alemaoflow.com` → CNAME `cname.vercel-dns.com`
4. Auto-deploy on push to `main`

## Success Criteria

- [ ] Page renders correctly on mobile (375px) and desktop (1440px)
- [ ] All 5 links open in new tab
- [ ] Animations smooth (no jank)
- [ ] Config change in `links.ts` → reflects without touching components
- [ ] Deployed to Vercel and accessible at preview URL
- [ ] Lighthouse Performance ≥ 90
