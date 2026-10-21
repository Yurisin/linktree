// src/components/admin/AdminNav.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/links', label: 'Links' },
  { href: '/admin/profile', label: 'Perfil' },
  { href: '/admin/theme', label: 'Tema' },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="ad-nav min-w-0 flex-1 sm:flex-none overflow-x-auto">
      {ITEMS.map(({ href, label }) => (
        <Link key={href} href={href} className={`whitespace-nowrap ${pathname.startsWith(href) ? 'on' : ''}`}>
          {label}
        </Link>
      ))}
      <Link href="/" target="_blank" className="whitespace-nowrap">
        Ver página ↗
      </Link>
    </div>
  );
}
