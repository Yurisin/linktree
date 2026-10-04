import type { AnalyticsSummary } from '@/types/analytics';

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.06] border border-white/10 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

export function KpiCards({ summary }: { summary: AnalyticsSummary }) {
  const ctr = summary.pageviews > 0 ? (summary.clicks / summary.pageviews) * 100 : 0;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card label="Visitas" value={summary.pageviews.toLocaleString('pt-BR')} />
      <Card label="Visitantes únicos" value={summary.uniques.toLocaleString('pt-BR')} />
      <Card label="Cliques" value={summary.clicks.toLocaleString('pt-BR')} />
      <Card label="CTR" value={`${ctr.toFixed(1)}%`} />
    </div>
  );
}
