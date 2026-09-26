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
