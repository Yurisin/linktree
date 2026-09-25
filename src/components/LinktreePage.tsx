import { ProfileHeader } from './ProfileHeader';
import { LinkCard } from './LinkCard';
import { ProfileData, LinkItem, ThemeConfig } from '@/types/linktree';

interface Props {
  profile: ProfileData;
  links: LinkItem[];
  theme: ThemeConfig;
}

export function LinktreePage({ profile, links, theme }: Props) {
  const enabledLinks = links.filter((l) => l.enabled);

  return (
    <main
      className="min-h-screen flex items-start justify-center px-4 pt-16 pb-12"
      style={{ backgroundColor: theme.bgColor, color: theme.textColor }}
    >
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% -10%, ${theme.accentColor}26 0%, transparent 70%)`,
        }}
      />
      <div className="relative w-full max-w-sm animate-fade-in">
        <ProfileHeader profile={profile} />
        <div className="flex flex-col gap-3">
          {enabledLinks.map((link, index) => (
            <div
              key={link.id}
              className="animate-slide-up"
              style={{ animationDelay: `${(index + 1) * 100}ms`, animationFillMode: 'both' }}
            >
              <LinkCard link={link} index={index} />
            </div>
          ))}
        </div>
        <p className="mt-12 text-center text-xs text-slate-700" suppressHydrationWarning>
          © 2026 Yuri Botelho
        </p>
      </div>
    </main>
  );
}
