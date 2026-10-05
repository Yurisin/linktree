import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: 'Yuri | Alemão Dev',
  description: 'Links de Yuri Botelho — Alemão Dev',
  openGraph: {
    title: 'Yuri | Alemão Dev',
    description: 'Links de Yuri Botelho — Alemão Dev',
    images: ['/og-image.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yuri | Alemão Dev',
    description: 'Links de Yuri Botelho — Alemão Dev',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={geist.variable}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
