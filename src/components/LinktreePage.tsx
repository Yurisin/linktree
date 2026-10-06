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
  // false = card/botão grande. Visual fixo do design system Alemão Dev.
  const enabled = links.filter((l) => l.enabled);
  const socials = enabled.filter((l) => l.social);
  const buttons = enabled.filter((l) => !l.social);

  return (
    <main
      className="min-h-screen flex items-start justify-center px-4 pt-16 pb-12"
      style={{ color: 'var(--ink)' }}
    >
      {/* Fundo animado cobalto (shader WebGL "DarkVeil"). Fica atrás do
          conteúdo; o <body> escuro é o fallback sem WebGL. */}
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
              <LinkCard link={link} index={index} />
            </div>
          ))}
        </div>

        <footer className="mt-12 text-center text-xs" style={{ color: 'var(--ink-soft)' }}>
          Desenvolvido por{' '}
          <span className="font-bold" style={{ color: 'var(--ink-strong)' }}>
            Alemão
          </span>{' '}
          Dev
        </footer>
      </div>
    </main>
  );
}
