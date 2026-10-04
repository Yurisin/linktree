import { NextResponse, after } from 'next/server';
import { createDbClient } from '@/lib/supabase-server';
import { clientIp, extractUtm, isBot, parseUserAgent, referrerHost, visitorHash } from '@/lib/tracking';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const origin = new URL(req.url).origin;

  try {
    const supabase = createDbClient();

    const { data: link } = await supabase.from('links').select('url').eq('id', id).single();
    if (!link?.url) return NextResponse.redirect(origin, 302);

    const ua = req.headers.get('user-agent');
    if (!isBot(ua)) {
      after(async () => {
        try {
          const info = parseUserAgent(ua);
          const utm = extractUtm(new URL(req.url).searchParams);
          const { error } = await supabase.from('events').insert({
            type: 'click',
            link_id: id,
            visitor_hash: visitorHash(clientIp(req.headers), ua ?? '', process.env.SERVER_SALT ?? ''),
            referrer_host: referrerHost(req.headers.get('referer'), req.headers.get('host')),
            ...utm,
            device_type: info.device_type,
            browser: info.browser,
            os: info.os,
            country: req.headers.get('x-vercel-ip-country'),
            in_app: info.in_app,
          });
          if (error) console.error('click insert error', error.message);
        } catch (e) {
          console.error('click track error', e);
        }
      });
    }

    return NextResponse.redirect(link.url, 302);
  } catch (e) {
    console.error('redirect error', e);
    return NextResponse.redirect(origin, 302);
  }
}
