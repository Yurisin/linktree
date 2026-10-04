import { createDbClient } from './supabase-server';
import type { AnalyticsData, AnalyticsRange } from '@/types/analytics';

export async function getAnalytics(range: AnalyticsRange): Promise<AnalyticsData> {
  const to = new Date();
  const from = new Date(to.getTime() - range * 24 * 60 * 60 * 1000);
  const p = { p_from: from.toISOString(), p_to: to.toISOString() };
  const supabase = createDbClient();

  const [summary, timeseries, topLinks, sources, devices, countries, activity, links] = await Promise.all([
    supabase.rpc('analytics_summary', p),
    supabase.rpc('analytics_timeseries', p),
    supabase.rpc('analytics_top_links', p),
    supabase.rpc('analytics_sources', p),
    supabase.rpc('analytics_devices', p),
    supabase.rpc('analytics_countries', p),
    supabase.rpc('analytics_activity', p),
    supabase.from('links').select('id,label'),
  ]);

  return {
    range,
    summary: (summary.data?.[0] as AnalyticsData['summary']) ?? { pageviews: 0, uniques: 0, clicks: 0 },
    timeseries: timeseries.data ?? [],
    topLinks: topLinks.data ?? [],
    sources: sources.data ?? [],
    devices: devices.data ?? [],
    countries: countries.data ?? [],
    activity: activity.data ?? [],
    links: links.data ?? [],
  };
}
