import { auth } from '@/auth';
import { createDbClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const PUT = auth(async (req, ctx) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await (ctx.params as Promise<{ id: string }>);
  const body = await req.json();
  const { label, url, icon, enabled, featured } = body;
  const update: Record<string, unknown> = {};
  if (label !== undefined) update.label = label;
  if (url !== undefined) update.url = url;
  if (icon !== undefined) update.icon = icon;
  if (enabled !== undefined) update.enabled = enabled;
  if (featured !== undefined) update.featured = featured;
  const supabase = createDbClient();
  const { data, error } = await supabase
    .from('links').update(update).eq('id', id).select().single();
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
