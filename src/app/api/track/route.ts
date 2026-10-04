import { NextResponse } from 'next/server';
import { createDbClient } from '@/lib/supabase-server';
import { clientIp, extractUtm, isBot, parseUserAgent, referrerHost, visitorHash } from '@/lib/tracking';

export async function POST(req: Request) {
  try {
    const ua = req.headers.get('user-agent');
    if (isBot(ua)) return new NextResponse(null, { status: 204 });

    const body = (await req.json().catch(() => ({}))) as { referrer?: string; url?: string };
    const info = parseUserAgent(ua);
    const search = body.url ? (() => { try { return new URL(body.url!).searchParams; } catch { return new URLSearchParams(); } })() : new URLSearchParams();
    const utm = extractUtm(search);

    const supabase = createDbClient();
    const { error } = await supabase.from('events').insert({
      type: 'pageview',
      visitor_hash: visitorHash(clientIp(req.headers), ua ?? '', process.env.SERVER_SALT ?? ''),
      referrer_host: referrerHost(body.referrer, req.headers.get('host')),
      ...utm,
      device_type: info.device_type,
      browser: info.browser,
      os: info.os,
      country: req.headers.get('x-vercel-ip-country'),
      in_app: info.in_app,
    });
    if (error) console.error('track insert error', error.message);
  } catch (e) {
    console.error('track error', e);
  }
  return new NextResponse(null, { status: 204 });
}
