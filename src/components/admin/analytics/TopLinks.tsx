import type { TopLinkRow, LinkLabel, AnalyticsSummary } from '@/types/analytics';
import { Empty } from './TrendChart';

export function TopLinks({ rows, links, summary }: { rows: TopLinkRow[]; links: LinkLabel[]; summary: AnalyticsSummary }) {
  if (rows.length === 0) return <Empty title="Top links" />;
  const labelOf = (id: string) => links.find((l) => l.id === id)?.label ?? id;
  return (
    <section className="ad-card">
      <h2 className="ad-label mb-4">Top links</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-ink-faint text-[11px] uppercase tracking-[1px] text-left">
            <th className="font-normal pb-2">Link</th>
            <th className="font-normal pb-2 text-right">Cliques</th>
            <th className="font-normal pb-2 text-right">CTR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.link_id} className="border-t border-line">
              <td className="py-2 text-ink">{labelOf(r.link_id)}</td>
              <td className="py-2 text-right text-ink-strong font-bold">{r.clicks.toLocaleString('pt-BR')}</td>
              <td className="py-2 text-right text-ink-soft">
                {summary.pageviews > 0 ? `${((r.clicks / summary.pageviews) * 100).toFixed(1)}%` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
