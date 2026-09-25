import { auth } from '@/auth';
import { createStorageClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const ext = file.name.split('.').pop() ?? 'jpg';
  const filename = `avatar-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createStorageClient();
  const { error } = await supabase.storage
    .from('linktree-avatars')
    .upload(filename, buffer, { contentType: file.type, upsert: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage
    .from('linktree-avatars')
    .getPublicUrl(filename);

  return NextResponse.json({ url: publicUrl });
});
