export type AnalyticsRange = 7 | 30 | 90;
export const ANALYTICS_RANGES: AnalyticsRange[] = [7, 30, 90];

export interface AnalyticsSummary { pageviews: number; uniques: number; clicks: number; }
export interface TimeseriesPoint { day: string; pageviews: number; clicks: number; }
export interface TopLinkRow { link_id: string; clicks: number; uniques: number; }
export interface SourceRow { source: string; pageviews: number; }
export interface DeviceRow { device_type: string; count: number; }
export interface CountryRow { country: string; count: number; }
export interface ActivityRow { dow: number; hour: number; count: number; }
export interface LinkLabel { id: string; label: string; }

export interface AnalyticsData {
  range: AnalyticsRange;
  summary: AnalyticsSummary;
  timeseries: TimeseriesPoint[];
  topLinks: TopLinkRow[];
  sources: SourceRow[];
  devices: DeviceRow[];
  countries: CountryRow[];
  activity: ActivityRow[];
  links: LinkLabel[];
}
