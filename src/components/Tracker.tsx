'use client';
import { useEffect, useRef } from 'react';

export function Tracker() {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const payload = JSON.stringify({ referrer: document.referrer, url: window.location.href });
    try {
      const blob = new Blob([payload], { type: 'application/json' });
      if (!navigator.sendBeacon('/api/track', blob)) throw new Error('beacon rejected');
    } catch {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }, []);
  return null;
}
