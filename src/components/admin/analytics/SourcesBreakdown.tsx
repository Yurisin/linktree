import type { SourceRow } from '@/types/analytics';
import { Empty } from './TrendChart';

export function SourcesBreakdown({ rows }: { rows: SourceRow[] }) {
  if (rows.length === 0) return <Empty title="Origem do tráfego" />;
  const total = rows.reduce((s, r) => s + Number(r.pageviews), 0) || 1;
  return (
    <section className="ad-card">
      <h2 className="ad-label mb-4">Origem do tráfego</h2>
      <ul className="space-y-2">
        {rows.map((r) => {
          const pct = (Number(r.pageviews) / total) * 100;
          return (
            <li key={r.source}>
              <div className="flex justify-between text-xs text-ink-soft mb-1">
                <span>{r.source}</span><span>{pct.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-bg-2 overflow-hidden">
                <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
