// src/components/LinkCard.tsx
import { LinkItem } from '@/types/linktree';
import { getIconComponent } from '@/lib/icons';

interface Props {
  link: LinkItem;
  index: number;
}

export function LinkCard({ link, index }: Props) {
  const Icon = getIconComponent(link.icon);

  // Botões vazados (só contorno) sobre o fundo animado — estilo da referência.
  // O principal ganha uma borda/texto um pouco mais fortes pra se destacar.
  const surface = link.featured
    ? {
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.28)',
        color: 'var(--ink-strong)',
      }
    : {
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.14)',
        color: 'var(--ink)',
      };

  return (
    <a
      href={`/go/${link.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex items-center justify-center w-full min-h-[60px] px-14 py-4
        text-center
        transition-all duration-200 ease-out
        hover:scale-[1.02] active:scale-[0.98]
        hover:bg-white/[0.05]
        hover:shadow-[0_0_24px_rgba(31,79,209,0.35)]
        cursor-pointer"
      style={{ ...surface, borderRadius: 'var(--radius-md)' }}
      aria-label={`Abrir ${link.label} em nova aba`}
    >
      <Icon
        size={20}
        className={`absolute left-5 flex-shrink-0 ${
          link.featured ? 'text-[var(--ink-strong)]' : 'text-[var(--ink-soft)]'
        }`}
      />
      <span
        className="text-sm font-semibold tracking-wide uppercase leading-snug"
        style={{ animationDelay: `${(index + 1) * 100}ms` }}
      >
        {link.label}
      </span>
    </a>
  );
}
