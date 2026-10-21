import { ProfileHeader } from './ProfileHeader';
import { SocialRow } from './SocialRow';
import { LinkCard } from './LinkCard';
import { DarkVeilBackground } from './DarkVeilBackground';
import { ProfileData, LinkItem, ThemeConfig } from '@/types/linktree';

interface Props {
  profile: ProfileData;
  links: LinkItem[];
  theme: ThemeConfig;
}

export function LinktreePage({ profile, links }: Props) {
  // `social` é configurado no admin: true = ícone na fileira do topo,
  // false = card/botão grande. Visual fixo do design system Alemão Dev v2.
  const enabled = links.filter((l) => l.enabled);
  const socials = enabled.filter((l) => l.social);
  const buttons = enabled.filter((l) => !l.social);

  return (
    <main className="relative min-h-screen flex items-start justify-center px-4 pt-14 pb-10">
      {/* Fundo animado cobalto (shader WebGL "DarkVeil"). Fica atrás do
          conteúdo; o <body> com grid do DS é o fallback sem WebGL. */}
      <DarkVeilBackground />

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        <ProfileHeader profile={profile} />

        <SocialRow socials={socials} />

        <div className="flex flex-col gap-3">
          {buttons.map((link, index) => (
            <div
              key={link.id}
              className="animate-slide-up"
              style={{
                animationDelay: `${(index + 1) * 100}ms`,
                animationFillMode: 'both',
              }}
            >
              <LinkCard link={link} />
            </div>
          ))}
        </div>

        <footer className="mt-14 flex flex-col items-center gap-2">
          <span className="text-[11px] uppercase tracking-[1.2px] text-ink-faint">Desenvolvido por</span>
          <span className="ad-wordmark">
            <span>
              Alemão <span className="ad-dev">Dev</span>
            </span>
          </span>
        </footer>
      </div>
    </main>
  );
}
