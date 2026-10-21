// src/components/LinkCard.tsx
import { LinkItem } from '@/types/linktree';
import { getIconComponent } from '@/lib/icons';

interface Props {
  link: LinkItem;
}

export function LinkCard({ link }: Props) {
  const Icon = getIconComponent(link.icon);

  // Botão do DS (.ad-btn, chanfrado). O destaque usa o azul de ação (CTA);
  // os demais são ghost (painel + borda line).
  return (
    <a
      href={`/go/${link.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`ad-btn ${link.featured ? 'ad-btn-primary' : 'ad-btn-ghost'}
        group w-full min-h-[58px] justify-center px-12 text-center
        transition-[filter,transform] duration-200 ease-out
        hover:brightness-125 active:scale-[0.98]`}
      aria-label={`Abrir ${link.label} em nova aba`}
    >
      <Icon
        size={18}
        className={`absolute left-5 flex-shrink-0 ${link.featured ? 'text-on-action' : 'text-ink-soft'}`}
      />
      <span className="leading-snug">{link.label}</span>
      <span
        aria-hidden="true"
        className="absolute right-5 transition-transform duration-200 group-hover:translate-x-1"
      >
        →
      </span>
    </a>
  );
}
