// src/types/linktree.ts
export type IconName =
  | 'instagram' | 'globe'    | 'github'  | 'linkedin'
  | 'twitter'   | 'youtube'  | 'tiktok'  | 'whatsapp'
  | 'telegram'  | 'discord'  | 'email'   | 'link'
  | 'document'  | 'blog'     | 'folder'  | 'store'   | 'clipboard';

export const ALL_ICONS: IconName[] = [
  'instagram', 'github', 'linkedin', 'twitter', 'youtube', 'tiktok',
  'whatsapp', 'telegram', 'discord', 'email', 'globe', 'link',
  'document', 'blog', 'folder', 'store', 'clipboard',
];

export interface LinkItem {
  id: string;
  label: string;
  url: string;
  icon: IconName;
  enabled: boolean;
  featured: boolean;
  /** true = ícone na fileira de redes sociais; false = card/botão grande. */
  social: boolean;
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
