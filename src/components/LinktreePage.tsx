import { ProfileHeader } from './ProfileHeader';
import { LinkCard } from './LinkCard';
import { profile } from '@/data/profile';
import { links } from '@/data/links';

export function LinktreePage() {
  const enabledLinks = links.filter((l) => l.enabled);

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-start justify-center px-4 pt-16 pb-12">
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(99,102,241,0.15) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm animate-fade-in">
        <ProfileHeader profile={profile} />

        <div className="flex flex-col gap-3">
          {enabledLinks.map((link, index) => (
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

        <p
          className="mt-12 text-center text-xs text-slate-700"
          suppressHydrationWarning
        >
          © 2026 Yuri Botelho
        </p>
      </div>
    </main>
  );
}
