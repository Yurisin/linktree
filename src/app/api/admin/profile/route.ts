import { auth } from '@/auth';
import { createDbClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const GET = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createDbClient();
  const { data, error } = await supabase.from('profile').select('*').eq('id', 1).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const PUT = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const supabase = createDbClient();
  const { data, error } = await supabase
    .from('profile')
    .update({
      name: body.name,
      bio: body.bio,
      avatar_url: body.avatar_url,
      theme: body.theme,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});
