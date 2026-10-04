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
    <section className="rounded-xl bg-white/[0.06] border border-white/10 p-4">
      <h2 className="text-sm font-medium text-white mb-1">Gerador de link para o Instagram</h2>
      <p className="text-xs text-slate-400 mb-3">Use estes links na bio/stories pra saber de onde vem o tráfego.</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {MEDIUMS.map((m) => (
          <button key={m} onClick={() => setMedium(m)}
            className={`px-3 py-1.5 rounded-lg text-sm ${medium === m ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
            {m}
          </button>
        ))}
      </div>
      <input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="campanha (opcional, ex: lancamento-abril)"
        className="w-full mb-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500" />
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs text-slate-300 bg-black/30 rounded-lg px-3 py-2 truncate">{url}</code>
        <button onClick={copy} className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm">
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
    </section>
  );
}
