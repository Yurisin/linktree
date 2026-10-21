// src/app/admin/login/page.tsx
import { devLoginEnabled } from '@/auth';
import { LoginButtons } from '@/components/admin/LoginButtons';

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
        <LoginButtons devLogin={devLoginEnabled} />
      </div>
    </main>
  );
}
