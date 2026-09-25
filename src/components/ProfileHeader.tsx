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
    <div className="flex flex-col items-center gap-4 mb-10">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 blur-xl opacity-40 scale-110" />
        {profile.avatar_url ? (
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/10">
            <Image
              src={profile.avatar_url}
              alt={profile.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-2 border-white/10">
            <span className="text-white text-xl font-semibold">{initials}</span>
          </div>
        )}
      </div>
      <h1 className="text-2xl font-semibold text-white tracking-tight">
        {profile.name}
      </h1>
      {profile.bio && (
        <p className="text-sm text-slate-400 text-center max-w-xs leading-relaxed">
          {profile.bio}
        </p>
      )}
    </div>
  );
}
