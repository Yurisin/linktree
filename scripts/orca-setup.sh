#!/usr/bin/env bash
# Setup de worktree do Orca (orca.yaml): traz o .env.local da cópia principal e instala as dependências.
# ORCA_SETUP_ENV=obrigatorio faz o setup falhar quando a cópia principal não tem .env.local.
set -euo pipefail

principal="$(git worktree list --porcelain | sed -n '1s/^worktree //p')"
aqui="$(git rev-parse --show-toplevel)"

if [ "$aqui" != "$principal" ]; then
  if [ -f "$principal/.env.local" ]; then
    install -m 600 "$principal/.env.local" "$aqui/.env.local"
  elif [ "${ORCA_SETUP_ENV:-opcional}" = obrigatorio ]; then
    echo "orca-setup: falta .env.local na cópia principal ($principal)" >&2
    exit 1
  fi
fi

npm ci --no-audit --no-fund

# banco local: nunca o da nuvem
if [ -f supabase/config.toml ]; then
  npx supabase status >/dev/null 2>&1 || npx supabase start
fi
