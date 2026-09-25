// src/components/LinkCard.tsx
import { ExternalLink } from 'lucide-react';
import { LinkItem } from '@/types/linktree';
import { getIconComponent } from '@/lib/icons';

interface Props {
  link: LinkItem;
  index: number;
}

export function LinkCard({ link, index }: Props) {
  const Icon = getIconComponent(link.icon);

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 w-full px-5 py-4 rounded-xl
        bg-white/[0.06] backdrop-blur-sm border border-white/10
        hover:border-white/20 hover:bg-white/[0.10]
        hover:shadow-[0_0_20px_rgba(99,102,241,0.25)]
        active:scale-[0.98]
        transition-all duration-200 ease-out
        hover:scale-[1.02]
        cursor-pointer"
      aria-label={`Abrir ${link.label} em nova aba`}
      style={{ animationDelay: `${(index + 1) * 100}ms` }}
    >
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
          link.featured
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
            : 'bg-white/10'
        }`}
      >
        <Icon size={18} className="text-white" />
      </div>
      <span className="flex-1 text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
        {link.label}
      </span>
      <ExternalLink
        size={14}
        className="text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0"
      />
    </a>
  );
}
