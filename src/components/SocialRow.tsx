// src/components/SocialRow.tsx
import { LinkItem } from '@/types/linktree';
import { getIconComponent } from '@/lib/icons';

interface Props {
  socials: LinkItem[];
}

export function SocialRow({ socials }: Props) {
  if (socials.length === 0) return null;

  return (
    <div className="flex items-center justify-center flex-wrap gap-6 mb-9">
      {socials.map((social) => {
        const Icon = getIconComponent(social.icon);
        return (
          <a
            key={social.id}
            href={`/go/${social.id}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            className="group transition-transform duration-200 ease-out hover:scale-110"
            style={{ color: 'var(--ink-soft)' }}
          >
            <Icon
              size={22}
              className="transition-colors duration-200 group-hover:text-[var(--accent-cyan)]"
            />
          </a>
        );
      })}
    </div>
  );
}
