import type { TimeseriesPoint } from '@/types/analytics';

export function TrendChart({ data }: { data: TimeseriesPoint[] }) {
  if (data.length === 0) {
    return <Empty title="Visitas e cliques por dia" />;
  }
  const W = 640, H = 160, pad = 24;
  const max = Math.max(1, ...data.map((d) => Math.max(d.pageviews, d.clicks)));
  const x = (i: number) => pad + (i * (W - 2 * pad)) / Math.max(1, data.length - 1);
  const y = (v: number) => H - pad - (v * (H - 2 * pad)) / max;
  const path = (key: 'pageviews' | 'clicks') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ');

  return (
    <section className="ad-card">
      <h2 className="ad-label mb-4">Visitas e cliques por dia</h2>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40" preserveAspectRatio="none">
        <path d={path('pageviews')} fill="none" stroke="var(--brand)" strokeWidth="2" />
        <path d={path('clicks')} fill="none" stroke="var(--signal)" strokeWidth="2" />
      </svg>
      <div className="flex gap-4 text-[11px] uppercase tracking-[1px] mt-2">
        <span className="text-brand-bright">● Visitas</span>
        <span className="text-signal">● Cliques</span>
      </div>
    </section>
  );
}

export function Empty({ title }: { title: string }) {
  return (
    <section className="ad-card">
      <h2 className="ad-label mb-4">{title}</h2>
      <p className="text-ink-faint text-sm">Sem dados no período.</p>
    </section>
  );
}
