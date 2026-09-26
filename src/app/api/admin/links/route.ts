import { auth } from '@/auth';
import { createDbClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const GET = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createDbClient();
  const { data, error } = await supabase.from('links').select('*').order('position');
  if (error) {
    console.error('[api/admin/links GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
});

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const supabase = createDbClient();
  const { data: existing } = await supabase
    .from('links').select('position').order('position', { ascending: false }).limit(1);
  const maxPosition = (existing?.[0]?.position ?? -1) as number;
  const { data, error } = await supabase
    .from('links')
    .insert({ label: body.label, url: body.url, icon: body.icon ?? 'globe',
               enabled: body.enabled ?? true, featured: body.featured ?? false,
               position: maxPosition + 1 })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
});

// Batch position update for reorder
export const PUT = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json() as Array<{ id: string; position: number }>;
  const supabase = createDbClient();
  const results = await Promise.all(
    body.map(({ id, position }) => supabase.from('links').update({ position }).eq('id', id))
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});
