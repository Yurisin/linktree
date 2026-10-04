import { createHash } from 'crypto';

export interface UaInfo {
  device_type: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  in_app: boolean;
}

export function parseUserAgent(ua: string | null | undefined): UaInfo {
  const s = ua ?? '';
  const in_app = /Instagram/i.test(s);
  const isTablet = /iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(s);
  const isMobile = /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(s);
  const device_type: UaInfo['device_type'] = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  let os = 'Unknown';
  if (/iPhone|iPad|iPod/i.test(s)) os = 'iOS';
  else if (/Android/i.test(s)) os = 'Android';
  else if (/Windows/i.test(s)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(s)) os = 'macOS';
  else if (/Linux/i.test(s)) os = 'Linux';

  let browser = 'Unknown';
  if (in_app) browser = 'Instagram';
  else if (/Edg\//i.test(s)) browser = 'Edge';
  else if (/SamsungBrowser/i.test(s)) browser = 'Samsung Internet';
  else if (/Firefox\//i.test(s)) browser = 'Firefox';
  else if (/Chrome\//i.test(s) && !/Chromium/i.test(s)) browser = 'Chrome';
  else if (/Safari\//i.test(s) && /Version\//i.test(s)) browser = 'Safari';

  return { device_type, browser, os, in_app };
}

const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|facebookcatalog|whatsapp|telegram|discordbot|twitterbot|linkedinbot|googlebot|bingbot|preview|headless|lighthouse|monitor|ia_archiver/i;
export function isBot(ua: string | null | undefined): boolean {
  return BOT_RE.test(ua ?? '');
}

export function referrerHost(referrer: string | null | undefined, selfHost?: string | null): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    if (selfHost && host === selfHost.replace(/^www\./, '')) return null;
    return host || null;
  } catch {
    return null;
  }
}

export function extractUtm(params: URLSearchParams) {
  const g = (k: string) => {
    const v = params.get(k);
    return v && v.length ? v.slice(0, 100) : null;
  };
  return { utm_source: g('utm_source'), utm_medium: g('utm_medium'), utm_campaign: g('utm_campaign') };
}

function dailySalt(serverSalt: string, date: Date): string {
  const day = date.toISOString().slice(0, 10);
  return createHash('sha256').update(serverSalt + '|' + day).digest('hex');
}

export function visitorHash(ip: string, ua: string, serverSalt: string, date: Date = new Date()): string {
  return createHash('sha256').update(dailySalt(serverSalt, date) + '|' + ip + '|' + ua).digest('hex');
}

export function clientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return headers.get('x-real-ip') || '0.0.0.0';
}
