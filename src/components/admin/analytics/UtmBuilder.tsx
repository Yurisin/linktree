'use client';
import { useState } from 'react';

const MEDIUMS = ['bio', 'story', 'post', 'reels'];

export function UtmBuilder({ baseUrl }: { baseUrl: string }) {
  const [medium, setMedium] = useState('bio');
  const [campaign, setCampaign] = useState('');
  const [copied, setCopied] = useState(false);

  const url = (() => {
    const u = new URL(baseUrl);
    u.searchParams.set('utm_source', 'instagram');
    u.searchParams.set('utm_medium', medium);
    if (campaign.trim()) u.searchParams.set('utm_campaign', campaign.trim());
    return u.toString();
  })();

  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  }

  return (
    <section className="ad-card">
      <h2 className="ad-label mb-2">Gerador de link para o Instagram</h2>
      <p className="text-xs text-ink-soft mb-4">Use estes links na bio/stories pra saber de onde vem o tráfego.</p>
      <div className="ad-seg mb-3">
        {MEDIUMS.map((m) => (
          <button key={m} onClick={() => setMedium(m)}
            className={medium === m ? 'on' : undefined}>
            {m}
          </button>
        ))}
      </div>
      <input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="campanha (opcional, ex: lancamento-abril)"
        className="ad-field mb-3" />
      <div className="flex items-center gap-2">
        <code className="flex-1 min-w-0 text-xs text-brand-bright bg-bg-2 border border-line px-3 py-3 truncate">{url}</code>
        <button onClick={copy} className="ad-btn ad-btn-primary !px-4 !py-3">
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
    </section>
  );
}
