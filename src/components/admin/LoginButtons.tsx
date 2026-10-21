// src/components/admin/LoginButtons.tsx
'use client';
import { signIn } from 'next-auth/react';
import { FaGoogle } from 'react-icons/fa';

export function LoginButtons({ devLogin }: { devLogin: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={() => signIn('google', { callbackUrl: '/admin/links' })}
        className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white text-gray-900 font-medium hover:bg-gray-100 transition-colors text-sm"
      >
        <FaGoogle size={18} />
        Entrar com Google
      </button>
      {devLogin && (
        <button
          onClick={() => signIn('dev', { callbackUrl: '/admin/links' })}
          className="px-6 py-3 rounded-xl border border-white/10 text-slate-300 hover:text-white text-sm transition-colors"
        >
          Entrar (dev local)
        </button>
      )}
    </div>
  );
}
