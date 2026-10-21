import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev aberto pela rede (ex.: Tailscale): hosts extras em DEV_ORIGINS no .env.local, separados por vírgula
  allowedDevOrigins: ['127.0.0.1', 'desktop', ...(process.env.DEV_ORIGINS?.split(',').filter(Boolean) ?? [])],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ledukavvfokxzixqexcw.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Supabase local (npx supabase start), só em desenvolvimento
      ...(process.env.NODE_ENV === 'development'
        ? [{ protocol: 'http' as const, hostname: '127.0.0.1', port: '55321', pathname: '/storage/v1/object/public/**' }]
        : []),
    ],
  },
};

export default nextConfig;
