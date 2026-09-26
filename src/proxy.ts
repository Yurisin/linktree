// src/proxy.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const proxy = auth((req: NextRequest & { auth: unknown }) => {
  const isAdminPath = req.nextUrl.pathname.startsWith('/admin');
  const isLoginPath = req.nextUrl.pathname === '/admin/login';

  if (isAdminPath && !isLoginPath && !req.auth) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
});

export const config = {
  matcher: ['/admin/:path*'],
};
