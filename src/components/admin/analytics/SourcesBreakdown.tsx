import type { SourceRow } from '@/types/analytics';
import { Empty } from './TrendChart';

export function SourcesBreakdown({ rows }: { rows: SourceRow[] }) {
  if (rows.length === 0) return <Empty title="Origem do tráfego" />;
  const total = rows.reduce((s, r) => s + Number(r.pageviews), 0) || 1;
  return (
    <section className="rounded-xl bg-white/[0.06] border border-white/10 p-4">
      <h2 className="text-sm font-medium text-white mb-3">Origem do tráfego</h2>
      <ul className="space-y-2">
        {rows.map((r) => {
          const pct = (Number(r.pageviews) / total) * 100;
          return (
            <li key={r.source}>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>{r.source}</span><span>{pct.toFixed(0)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
