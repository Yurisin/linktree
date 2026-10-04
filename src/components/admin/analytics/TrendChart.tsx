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
    <section className="rounded-xl bg-white/[0.06] border border-white/10 p-4">
      <h2 className="text-sm font-medium text-white mb-3">Visitas e cliques por dia</h2>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40" preserveAspectRatio="none">
        <path d={path('pageviews')} fill="none" stroke="#6366f1" strokeWidth="2" />
        <path d={path('clicks')} fill="none" stroke="#22d3ee" strokeWidth="2" />
      </svg>
      <div className="flex gap-4 text-xs mt-2">
        <span className="text-indigo-400">● Visitas</span>
        <span className="text-cyan-300">● Cliques</span>
      </div>
    </section>
  );
}

export function Empty({ title }: { title: string }) {
  return (
    <section className="rounded-xl bg-white/[0.06] border border-white/10 p-4">
      <h2 className="text-sm font-medium text-white mb-3">{title}</h2>
      <p className="text-slate-500 text-sm">Sem dados no período.</p>
    </section>
  );
}
