import type { TopLinkRow, LinkLabel, AnalyticsSummary } from '@/types/analytics';
import { Empty } from './TrendChart';

export function TopLinks({ rows, links, summary }: { rows: TopLinkRow[]; links: LinkLabel[]; summary: AnalyticsSummary }) {
  if (rows.length === 0) return <Empty title="Top links" />;
  const labelOf = (id: string) => links.find((l) => l.id === id)?.label ?? id;
  return (
    <section className="rounded-xl bg-white/[0.06] border border-white/10 p-4">
      <h2 className="text-sm font-medium text-white mb-3">Top links</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-xs text-left">
            <th className="font-normal pb-2">Link</th>
            <th className="font-normal pb-2 text-right">Cliques</th>
            <th className="font-normal pb-2 text-right">CTR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.link_id} className="border-t border-white/5">
              <td className="py-2 text-slate-200">{labelOf(r.link_id)}</td>
              <td className="py-2 text-right text-white">{r.clicks.toLocaleString('pt-BR')}</td>
              <td className="py-2 text-right text-slate-400">
                {summary.pageviews > 0 ? `${((r.clicks / summary.pageviews) * 100).toFixed(1)}%` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
