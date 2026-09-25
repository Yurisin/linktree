import { auth } from '@/auth';
import { createDbClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const PUT = auth(async (req, ctx) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await (ctx.params as Promise<{ id: string }>);
  const body = await req.json();
  const supabase = createDbClient();
  const { data, error } = await supabase
    .from('links').update(body).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const DELETE = auth(async (req, ctx) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await (ctx.params as Promise<{ id: string }>);
  const supabase = createDbClient();
  const { error } = await supabase.from('links').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});
