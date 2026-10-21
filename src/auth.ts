// src/auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

// Login de desenvolvimento: só existe com `next dev` e AUTH_DEV_LOGIN=1 no .env.local.
// Entra como ADMIN_EMAIL sem passar pelo Google. Em produção o provider não é registrado.
export const devLoginEnabled =
  process.env.NODE_ENV === 'development' && process.env.AUTH_DEV_LOGIN === '1';

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    ...(devLoginEnabled
      ? [
          Credentials({
            id: 'dev',
            name: 'Dev',
            credentials: {},
            authorize: () => ({ id: 'dev', name: 'Dev', email: process.env.ADMIN_EMAIL }),
          }),
        ]
      : []),
  ],
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async signIn({ user }) {
      return user.email === process.env.ADMIN_EMAIL;
    },
  },
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
});
