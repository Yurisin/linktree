// src/lib/icons.tsx
import { ComponentType } from 'react';
import {
  ExternalLink, Globe, Mail, Link,
  FileText, Newspaper, Folder, ShoppingBag, ClipboardList,
} from 'lucide-react';
import {
  FaInstagram, FaGithub, FaLinkedin, FaTwitter,
  FaYoutube, FaTiktok, FaWhatsapp, FaTelegram, FaDiscord,
} from 'react-icons/fa';
import { IconName } from '@/types/linktree';

type IconProps = { size?: number; className?: string };

const iconMap: Record<IconName, ComponentType<IconProps>> = {
  instagram: FaInstagram as ComponentType<IconProps>,
  globe:     Globe,
  github:    FaGithub as ComponentType<IconProps>,
  linkedin:  FaLinkedin as ComponentType<IconProps>,
  twitter:   FaTwitter as ComponentType<IconProps>,
  youtube:   FaYoutube as ComponentType<IconProps>,
  tiktok:    FaTiktok as ComponentType<IconProps>,
  whatsapp:  FaWhatsapp as ComponentType<IconProps>,
  telegram:  FaTelegram as ComponentType<IconProps>,
  discord:   FaDiscord as ComponentType<IconProps>,
  email:     Mail,
  link:      Link,
  document:  FileText,
  blog:      Newspaper,
  folder:    Folder,
  store:     ShoppingBag,
  clipboard: ClipboardList,
};

export const ICON_LABELS: Record<IconName, string> = {
  instagram: 'Instagram', globe: 'Website',   github: 'GitHub',
  linkedin:  'LinkedIn',  twitter: 'Twitter', youtube: 'YouTube',
  tiktok:    'TikTok',    whatsapp: 'WhatsApp', telegram: 'Telegram',
  discord:   'Discord',   email: 'Email',     link: 'Link',
  document:  'Documento', blog: 'Blog',       folder: 'Materiais',
  store:     'Loja',      clipboard: 'Checklist',
};

export function getIconComponent(name: IconName): ComponentType<IconProps> {
  return iconMap[name] ?? ExternalLink;
}
