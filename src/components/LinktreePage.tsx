import { ProfileHeader } from './ProfileHeader';
import { SocialRow } from './SocialRow';
import { LinkCard } from './LinkCard';
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
      style={{ background: 'var(--bg)', color: 'var(--ink)' }}
    >
      {/* Brilho radial cobalto (azul do carro) sobre o fundo escuro */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(90% 55% at 50% 0%, rgba(31,79,209,0.45) 0%, rgba(31,79,209,0.14) 34%, transparent 68%)',
        }}
      />

      <div className="relative w-full max-w-sm animate-fade-in">
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
