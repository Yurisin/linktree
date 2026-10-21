// src/app/admin/layout.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin/AdminNav';
import { SignOutButton } from '@/components/admin/SignOutButton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/admin/login');

  return (
    <div className="min-h-screen text-ink">
      <nav className="border-b border-line bg-bg/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 min-h-14 py-2 flex items-center justify-between gap-4">
          <span className="ad-wordmark hidden sm:inline-flex">
            <span>
              Alemão <span className="ad-dev">Dev</span>
            </span>
          </span>
          <AdminNav />
          <SignOutButton />
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
