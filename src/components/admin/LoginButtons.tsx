// src/components/admin/LoginButtons.tsx
'use client';
import { signIn } from 'next-auth/react';
import { FaGoogle } from 'react-icons/fa';

export function LoginButtons({ devLogin }: { devLogin: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => signIn('google', { callbackUrl: '/admin/links' })}
        className="ad-btn ad-btn-primary justify-center"
      >
        <FaGoogle size={16} />
        Entrar com Google
      </button>
      {devLogin && (
        <button
          onClick={() => signIn('dev', { callbackUrl: '/admin/links' })}
          className="ad-btn ad-btn-ghost justify-center"
        >
          Entrar (dev local)
        </button>
      )}
    </div>
  );
}
