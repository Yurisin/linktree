// src/types/linktree.ts
export type IconName =
  | 'instagram' | 'globe'    | 'github'  | 'linkedin'
  | 'twitter'   | 'youtube'  | 'tiktok'  | 'whatsapp'
  | 'telegram'  | 'discord'  | 'email'   | 'link';

export const ALL_ICONS: IconName[] = [
  'instagram', 'github', 'linkedin', 'twitter', 'youtube', 'tiktok',
  'whatsapp', 'telegram', 'discord', 'email', 'globe', 'link',
];

export interface LinkItem {
  id: string;
  label: string;
  url: string;
  icon: IconName;
  enabled: boolean;
  featured: boolean;
  position: number;
}

export interface ThemeConfig {
  bgColor: string;
  accentColor: string;
  cardColor: string;
  textColor: string;
}

export interface ProfileData {
  id: number;
  name: string;
  bio: string;
  avatar_url: string | null;
  theme: ThemeConfig;
  updated_at: string;
}
