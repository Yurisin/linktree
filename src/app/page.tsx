import { LinktreePage } from '@/components/LinktreePage';
import { createDbClient } from '@/lib/supabase-server';
import { ProfileData, LinkItem, ThemeConfig } from '@/types/linktree';

export const dynamic = 'force-dynamic';

const DEFAULT_THEME: ThemeConfig = {
  bgColor: '#0a0a0a',
  accentColor: '#6366f1',
  cardColor: '#ffffff',
  textColor: '#ffffff',
};

export default async function Home() {
  const supabase = createDbClient();

  const [{ data: profileData }, { data: linksData }] = await Promise.all([
    supabase.from('profile').select('*').eq('id', 1).single(),
    supabase.from('links').select('*').order('position'),
  ]);

  const profile = (profileData as ProfileData) ?? {
    id: 1, name: 'Yuri | Alemão Dev', bio: 'Dev & Creator · Alemão Flow',
    avatar_url: null, theme: DEFAULT_THEME, updated_at: '',
  };
  const links = (linksData ?? []) as LinkItem[];
  const theme: ThemeConfig = profile.theme ?? DEFAULT_THEME;

  return <LinktreePage profile={profile} links={links} theme={theme} />;
}
