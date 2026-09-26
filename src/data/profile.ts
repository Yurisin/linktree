// Re-export from shared types so consumers get a single source of truth
export type { ProfileData as ProfileConfig } from '@/types/linktree';

import { ProfileData } from '@/types/linktree';

export const profile: ProfileData = {
  id: 1,
  name: 'Yuri | Alemão Dev',
  bio: 'Dev & Creator · Alemão Flow',
  avatar_url: '/avatar.jpg',
  theme: {
    bgColor: '#0a0a0a',
    accentColor: '#6366f1',
    cardColor: 'rgba(255,255,255,0.06)',
    textColor: '#ffffff',
  },
  updated_at: new Date().toISOString(),
};
