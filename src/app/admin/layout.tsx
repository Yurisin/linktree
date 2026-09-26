// src/app/admin/layout.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SignOutButton } from '@/components/admin/SignOutButton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/admin/login');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="border-b border-white/10 bg-white/[0.02] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Link href="/admin/links"
              className="px-3 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors text-slate-300 hover:text-white">
              Links
            </Link>
            <Link href="/admin/profile"
              className="px-3 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors text-slate-300 hover:text-white">
              Perfil
            </Link>
            <Link href="/admin/theme"
              className="px-3 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors text-slate-300 hover:text-white">
              Tema
            </Link>
            <Link href="/" target="_blank"
              className="px-3 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors text-slate-500 hover:text-white">
              ↗ Ver página
            </Link>
          </div>
          <SignOutButton />
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
