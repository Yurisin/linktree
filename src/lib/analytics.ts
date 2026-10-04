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

  // Log RPC errors
  const rpcResults = [
    ['analytics_summary', summary],
    ['analytics_timeseries', timeseries],
    ['analytics_top_links', topLinks],
    ['analytics_sources', sources],
    ['analytics_devices', devices],
    ['analytics_countries', countries],
    ['analytics_activity', activity],
  ] as const;
  rpcResults.forEach(([name, result]) => {
    if (result.error) console.error('analytics rpc failed:', name, result.error.message);
  });

  // Coerce bigint fields to Number
  const summaryData = summary.data?.[0] as AnalyticsData['summary'];
  const coercedSummary = summaryData ? {
    pageviews: Number(summaryData.pageviews),
    uniques: Number(summaryData.uniques),
    clicks: Number(summaryData.clicks),
  } : { pageviews: 0, uniques: 0, clicks: 0 };

  const coercedTimeseries = (timeseries.data ?? []).map((row: any) => ({
    ...row,
    pageviews: Number(row.pageviews),
    clicks: Number(row.clicks),
  }));

  const coercedTopLinks = (topLinks.data ?? []).map((row: any) => ({
    ...row,
    clicks: Number(row.clicks),
    uniques: Number(row.uniques),
  }));

  const coercedSources = (sources.data ?? []).map((row: any) => ({
    ...row,
    pageviews: Number(row.pageviews),
  }));

  const coercedDevices = (devices.data ?? []).map((row: any) => ({
    ...row,
    count: Number(row.count),
  }));

  const coercedCountries = (countries.data ?? []).map((row: any) => ({
    ...row,
    count: Number(row.count),
  }));

  const coercedActivity = (activity.data ?? []).map((row: any) => ({
    ...row,
    dow: Number(row.dow),
    hour: Number(row.hour),
    count: Number(row.count),
  }));

  return {
    range,
    summary: coercedSummary,
    timeseries: coercedTimeseries,
    topLinks: coercedTopLinks,
    sources: coercedSources,
    devices: coercedDevices,
    countries: coercedCountries,
    activity: coercedActivity,
    links: links.data ?? [],
  };
}
