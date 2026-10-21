<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Tarefas de agente

Toda tarefa nasce de uma issue e roda numa worktree criada pelo Orca no desktop (`server-desktop`).

1. Leia a issue e o código. Escreva o plano e **espere o Yuri aprovar** antes de implementar. Em mudança visual, ele aprova vendo: aplique na worktree, suba o preview (passo 4) e mostre antes de commitar.
2. Implemente em commits pequenos, na branch da worktree.
3. Antes do PR: `npm test` e `npm run build` com saída 0.
4. Mudança visual: `npx supabase start` e `npm run dev -- -H 0.0.0.0 -p <porta>`, e tire prints de antes e depois das páginas afetadas (pública e admin).
5. Rode `/codex:review --base master` e responda a cada achado (corrigir ou explicar por que não).
6. Abra o PR com `Closes #<issue>`, o resumo, o que foi testado e os prints. O preview da Vercel sai sozinho.

Desenvolvimento local:
- Banco: `npx supabase start` sobe o schema `linktree` completo (migrations + `supabase/seed.sql`). `npx supabase db reset` volta ao seed.
- Env: copie `.env.example` para `.env.local` e preencha `SUPABASE_SERVICE_KEY` com a `SERVICE_ROLE_KEY` de `npx supabase status -o env`.
- Admin sem Google: com `AUTH_DEV_LOGIN=1` e `ADMIN_EMAIL=dev@localhost`, o login mostra "Entrar (dev local)". Só existe com `next dev`.
- Preview pela rede (Tailscale): ponha o host em `DEV_ORIGINS` no `.env.local`.

Nunca: push ou merge na `master` (é produção em links.alemaodev.com), commitar `.env*` (exceto `.env.example`), apontar para o Supabase da nuvem (`ledukavvfokxzixqexcw`).
Design system: `design-system/` (ver `design-system/ORIGEM.md`).
