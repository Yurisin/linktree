export type IconName =
  | 'instagram'
  | 'globe'
  | 'github'
  | 'linkedin'
  | 'twitter'
  | 'youtube'
  | 'tiktok';

export interface LinkItem {
  id: string;
  label: string;
  url: string;
  icon: IconName;
  enabled: boolean;
  featured?: boolean;
}

export const links: LinkItem[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    url: 'https://instagram.com/alemaodev',
    icon: 'instagram',
    enabled: true,
    featured: true,
  },
  {
    id: 'website',
    label: 'Site Oficial',
    url: 'https://dev.alemaoflow.com',
    icon: 'globe',
    enabled: true,
  },
  {
    id: 'github-corp',
    label: 'GitHub Corporativo',
    url: 'https://github.com/YuriCNZ',
    icon: 'github',
    enabled: true,
  },
  {
    id: 'github-personal',
    label: 'GitHub Pessoal',
    url: 'https://github.com/Yurisin',
    icon: 'github',
    enabled: true,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    url: 'https://linkedin.com/in/yuribotelho',
    icon: 'linkedin',
    enabled: false,
  },
];
