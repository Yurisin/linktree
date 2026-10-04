import { expect, test, describe } from 'vitest';
import { parseUserAgent, isBot, referrerHost, extractUtm, visitorHash } from './tracking';

const UA_IG = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 302.0.0.0';
const UA_ANDROID = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const UA_IOS_SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const UA_DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const UA_BOT = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';

describe('parseUserAgent', () => {
  test('instagram webview', () => {
    const r = parseUserAgent(UA_IG);
    expect(r.in_app).toBe(true);
    expect(r.browser).toBe('Instagram');
    expect(r.device_type).toBe('mobile');
    expect(r.os).toBe('iOS');
  });
  test('android chrome', () => {
    const r = parseUserAgent(UA_ANDROID);
    expect(r.device_type).toBe('mobile');
    expect(r.browser).toBe('Chrome');
    expect(r.os).toBe('Android');
    expect(r.in_app).toBe(false);
  });
  test('ios safari', () => {
    expect(parseUserAgent(UA_IOS_SAFARI).browser).toBe('Safari');
  });
  test('desktop windows chrome', () => {
    const r = parseUserAgent(UA_DESKTOP);
    expect(r.device_type).toBe('desktop');
    expect(r.os).toBe('Windows');
  });
  test('null ua', () => {
    expect(parseUserAgent(null).device_type).toBe('desktop');
  });
});

describe('isBot', () => {
  test('facebook crawler is bot', () => expect(isBot(UA_BOT)).toBe(true));
  test('instagram webview is NOT bot', () => expect(isBot(UA_IG)).toBe(false));
  test('real browser is not bot', () => expect(isBot(UA_DESKTOP)).toBe(false));
});

describe('referrerHost', () => {
  test('strips www', () => expect(referrerHost('https://www.google.com/search?q=x')).toBe('google.com'));
  test('empty -> null', () => expect(referrerHost('')).toBeNull());
  test('self host -> null', () => expect(referrerHost('https://meusite.com/', 'meusite.com')).toBeNull());
  test('garbage -> null', () => expect(referrerHost('not a url')).toBeNull());
});

describe('extractUtm', () => {
  test('reads utm params', () => {
    const p = new URLSearchParams('utm_source=instagram&utm_medium=bio&utm_campaign=lancamento');
    expect(extractUtm(p)).toEqual({ utm_source: 'instagram', utm_medium: 'bio', utm_campaign: 'lancamento' });
  });
  test('missing -> nulls', () => {
    expect(extractUtm(new URLSearchParams(''))).toEqual({ utm_source: null, utm_medium: null, utm_campaign: null });
  });
});

describe('visitorHash', () => {
  const d = new Date('2026-10-03T12:00:00Z');
  test('deterministic same day', () => {
    expect(visitorHash('1.2.3.4', UA_DESKTOP, 'salt', d)).toBe(visitorHash('1.2.3.4', UA_DESKTOP, 'salt', d));
  });
  test('different ip -> different hash', () => {
    expect(visitorHash('1.2.3.4', UA_DESKTOP, 'salt', d)).not.toBe(visitorHash('9.9.9.9', UA_DESKTOP, 'salt', d));
  });
  test('rotates next day', () => {
    const d2 = new Date('2026-10-04T12:00:00Z');
    expect(visitorHash('1.2.3.4', UA_DESKTOP, 'salt', d)).not.toBe(visitorHash('1.2.3.4', UA_DESKTOP, 'salt', d2));
  });
  test('empty salt still works', () => {
    expect(visitorHash('1.2.3.4', UA_DESKTOP, '', d)).toHaveLength(64);
  });
});
