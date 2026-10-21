// src/components/SocialRow.tsx
import { LinkItem } from '@/types/linktree';
import { getIconComponent } from '@/lib/icons';

interface Props {
  socials: LinkItem[];
}

export function SocialRow({ socials }: Props) {
  if (socials.length === 0) return null;

  return (
    <div className="flex items-center justify-center flex-wrap gap-2.5 mb-8">
      {socials.map((social) => {
        const Icon = getIconComponent(social.icon);
        return (
          <a
            key={social.id}
            href={`/go/${social.id}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            title={social.label}
            className="ad-cut-sm grid place-items-center w-11 h-11 bg-panel border border-line text-ink-soft
              transition-colors duration-200 hover:text-brand-bright hover:border-line-strong
              focus-visible:outline-2 focus-visible:outline-signal"
          >
            <Icon size={19} />
          </a>
        );
      })}
    </div>
  );
}
