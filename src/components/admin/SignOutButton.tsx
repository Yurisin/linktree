// src/components/admin/SignOutButton.tsx
'use client';
import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="text-[11px] font-bold uppercase tracking-[1px] text-ink-faint hover:text-ink transition-colors"
    >
      Sair
    </button>
  );
}
