import type { AnalyticsSummary } from '@/types/analytics';

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="ad-card">
      <p className="text-[11px] font-medium uppercase tracking-[1.2px] text-ink-faint">{label}</p>
      <p className="mt-2 text-[28px] leading-8 font-bold tracking-[-0.5px] text-ink-strong">{value}</p>
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
