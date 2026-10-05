// src/components/ProfileHeader.tsx
import Image from 'next/image';
import { ProfileData } from '@/types/linktree';

interface Props {
  profile: ProfileData;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function ProfileHeader({ profile }: Props) {
  const initials = getInitials(profile.name);

  return (
    <div className="flex flex-col items-center gap-4 mb-5">
      {/* Avatar com anel em degradê de marca (padrão ad-hl-ring) */}
      <div
        className="relative rounded-full p-[3px]"
        style={{ background: 'var(--gradient-text)', boxShadow: 'var(--glow)' }}
      >
        <div
          className="relative w-24 h-24 rounded-full overflow-hidden"
          style={{ background: 'var(--bg)', border: '2px solid var(--bg)' }}
        >
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.name}
              fill
              className="object-cover rounded-full"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center rounded-full"
              style={{ background: 'var(--glass)' }}
            >
              <span className="text-2xl font-black" style={{ color: 'var(--ink-strong)' }}>
                {initials}
              </span>
            </div>
          )}
        </div>
      </div>

      <h1
        className="text-2xl font-black tracking-tight text-center"
        style={{ color: 'var(--ink-strong)' }}
      >
        {profile.name}
      </h1>

      {profile.bio && (
        <p
          className="text-sm text-center max-w-xs leading-relaxed"
          style={{ color: 'var(--ink-soft)' }}
        >
          {profile.bio}
        </p>
      )}
    </div>
  );
}
