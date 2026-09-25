// Re-export from shared types so consumers get a single source of truth
export type { LinkItem, IconName } from '@/types/linktree';

import { LinkItem } from '@/types/linktree';

export const links: LinkItem[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    url: 'https://instagram.com/alemaodev',
    icon: 'instagram',
    enabled: true,
    featured: true,
    position: 0,
  },
  {
    id: 'website',
    label: 'Site Oficial',
    url: 'https://dev.alemaoflow.com',
    icon: 'globe',
    enabled: true,
    featured: false,
    position: 1,
  },
  {
    id: 'github-corp',
    label: 'GitHub Corporativo',
    url: 'https://github.com/YuriCNZ',
    icon: 'github',
    enabled: true,
    featured: false,
    position: 2,
  },
  {
    id: 'github-personal',
    label: 'GitHub Pessoal',
    url: 'https://github.com/Yurisin',
    icon: 'github',
    enabled: true,
    featured: false,
    position: 3,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    url: 'https://linkedin.com/in/yuribotelho',
    icon: 'linkedin',
    enabled: false,
    featured: false,
    position: 4,
  },
];
