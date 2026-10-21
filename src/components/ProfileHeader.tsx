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
  return (
    <div className="flex flex-col items-center gap-3 mb-7 text-center">
      {/* Avatar redondo (.ad-avatar-lg): único elemento circular junto do ponto de status */}
      <span className="ad-avatar ad-avatar-lg" style={{ boxShadow: 'var(--glow)' }}>
        {profile.avatar_url ? (
          <Image src={profile.avatar_url} alt={profile.name} width={96} height={96} preload />
        ) : (
          getInitials(profile.name)
        )}
      </span>

      <p className="ad-label ad-label--status mt-2">Online</p>

      <h1 className="font-sans font-black text-[30px] leading-[34px] tracking-[-0.75px] text-ink-strong">
        {profile.name}
      </h1>

      {profile.bio && (
        <p className="text-sm leading-[22px] max-w-xs text-ink-soft">{profile.bio}</p>
      )}
    </div>
  );
}
