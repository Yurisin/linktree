import { getAnalytics } from '@/lib/analytics';
import { ANALYTICS_RANGES, type AnalyticsRange } from '@/types/analytics';
import { headers } from 'next/headers';
import { RangePicker } from '@/components/admin/analytics/RangePicker';
import { KpiCards } from '@/components/admin/analytics/KpiCards';
import { TrendChart } from '@/components/admin/analytics/TrendChart';
import { TopLinks } from '@/components/admin/analytics/TopLinks';
import { SourcesBreakdown } from '@/components/admin/analytics/SourcesBreakdown';
import { DeviceCountryBreakdown } from '@/components/admin/analytics/DeviceCountryBreakdown';
import { ActivityHeatmap } from '@/components/admin/analytics/ActivityHeatmap';
import { UtmBuilder } from '@/components/admin/analytics/UtmBuilder';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const sp = await searchParams;
  const parsed = Number(sp.range);
  const range = (ANALYTICS_RANGES.includes(parsed as AnalyticsRange) ? parsed : 30) as AnalyticsRange;
  const data = await getAnalytics(range);

  const h = await headers();
  const host = h.get('host') ?? 'localhost:3000';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  const baseUrl = `${proto}://${host}/`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Analytics</h1>
        <RangePicker current={range} />
      </div>
      <KpiCards summary={data.summary} />
      <TrendChart data={data.timeseries} />
      <div className="grid md:grid-cols-2 gap-3">
        <TopLinks rows={data.topLinks} links={data.links} summary={data.summary} />
        <SourcesBreakdown rows={data.sources} />
      </div>
      <DeviceCountryBreakdown devices={data.devices} countries={data.countries} />
      <ActivityHeatmap rows={data.activity} />
      <UtmBuilder baseUrl={baseUrl} />
    </div>
  );
}
