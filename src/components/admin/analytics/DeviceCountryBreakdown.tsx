import type { DeviceRow, CountryRow } from '@/types/analytics';

function Bars({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  const total = rows.reduce((s, r) => s + Number(r.count), 0) || 1;
  return (
    <section className="rounded-xl bg-white/[0.06] border border-white/10 p-4">
      <h2 className="text-sm font-medium text-white mb-3">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-slate-500 text-sm">Sem dados no período.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => {
            const pct = (Number(r.count) / total) * 100;
            return (
              <li key={r.label}>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>{r.label}</span><span>{Number(r.count).toLocaleString('pt-BR')}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const DEVICE_LABEL: Record<string, string> = { mobile: 'Celular', tablet: 'Tablet', desktop: 'Desktop', unknown: 'Desconhecido' };

export function DeviceCountryBreakdown({ devices, countries }: { devices: DeviceRow[]; countries: CountryRow[] }) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <Bars title="Dispositivo" rows={devices.map((d) => ({ label: DEVICE_LABEL[d.device_type] ?? d.device_type, count: Number(d.count) }))} />
      <Bars title="País" rows={countries.map((c) => ({ label: c.country, count: Number(c.count) }))} />
    </div>
  );
}
