// src/components/LinkCard.tsx
import { LinkItem } from '@/types/linktree';
import { getIconComponent } from '@/lib/icons';

interface Props {
  link: LinkItem;
  index: number;
}

export function LinkCard({ link, index }: Props) {
  const Icon = getIconComponent(link.icon);

  // Botão principal: preenchimento sólido cobalto (o "me chama" do DS).
  // Demais: vidro com borda em degradê de marca (padrão ad-card).
  const surface = link.featured
    ? {
        background: 'var(--action)',
        border: '1px solid transparent',
        color: 'var(--on-action)',
      }
    : {
        background:
          'linear-gradient(var(--glass), var(--glass)) padding-box, var(--gradient-border) border-box',
        backgroundColor: 'var(--bg)',
        border: '1px solid transparent',
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
        hover:shadow-[0_0_24px_rgba(31,79,209,0.35)]
        cursor-pointer"
      style={{ ...surface, borderRadius: 'var(--radius-md)' }}
      aria-label={`Abrir ${link.label} em nova aba`}
    >
      <Icon
        size={20}
        className={`absolute left-5 flex-shrink-0 ${
          link.featured ? 'text-[var(--on-action)]' : 'text-[var(--ink-soft)]'
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
