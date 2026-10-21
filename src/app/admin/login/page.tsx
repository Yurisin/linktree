// src/app/admin/login/page.tsx
import { devLoginEnabled } from '@/auth';
import { LoginButtons } from '@/components/admin/LoginButtons';

export default function LoginPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-4">
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: 'var(--cobalt-glow)' }}
      />
      <div className="ad-card relative w-full max-w-sm flex flex-col gap-6 !p-8">
        <div className="flex flex-col gap-3">
          <p className="ad-label">Admin</p>
          <span className="ad-wordmark ad-wordmark-lg ad-no-mark">
            <span>
              Alemão <span className="ad-dev">Dev</span>
            </span>
          </span>
          <p className="text-sm text-ink-soft">Acesso restrito ao proprietário.</p>
        </div>
        <LoginButtons devLogin={devLoginEnabled} />
      </div>
    </main>
  );
}
