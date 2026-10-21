import type { ActivityRow } from '@/types/analytics';
import { Empty } from './TrendChart';

const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function ActivityHeatmap({ rows }: { rows: ActivityRow[] }) {
  if (rows.length === 0) return <Empty title="Atividade por horário (BRT)" />;
  const max = Math.max(1, ...rows.map((r) => Number(r.count)));
  const at = (dow: number, hour: number) =>
    Number(rows.find((r) => r.dow === dow && r.hour === hour)?.count ?? 0);
  return (
    <section className="ad-card overflow-x-auto">
      <h2 className="ad-label mb-4">Atividade por horário (BRT)</h2>
      <div className="min-w-[640px]">
        <div className="grid" style={{ gridTemplateColumns: `32px repeat(24, 1fr)` }}>
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="text-[9px] text-ink-faint text-center">{h}</div>
          ))}
          {DOW.map((name, d) => (
            <div key={d} className="contents">
              <div className="text-[10px] text-ink-soft pr-1 flex items-center">{name}</div>
              {Array.from({ length: 24 }, (_, h) => {
                const v = at(d, h);
                const a = v === 0 ? 0 : 0.15 + 0.85 * (v / max);
                return <div key={h} className="aspect-square m-[1px]"
                  style={{ backgroundColor: v === 0 ? 'var(--bg-2)' : `rgba(50,120,255,${a})` }} title={`${name} ${h}h: ${v}`} />;
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
