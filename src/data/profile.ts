export interface ProfileConfig {
  name: string;
  bio: string;
  avatarUrl?: string;
  avatarInitials: string;
}

export const profile: ProfileConfig = {
  name: 'Yuri | Alemão Dev',
  bio: 'Dev & Creator · Alemão Flow',
  avatarInitials: 'YB',
  avatarUrl: '/avatar.jpg',
};
