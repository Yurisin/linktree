'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { ANALYTICS_RANGES } from '@/types/analytics';

export function RangePicker({ current }: { current: number }) {
  const router = useRouter();
  const params = useSearchParams();
  function set(r: number) {
    const p = new URLSearchParams(params.toString());
    p.set('range', String(r));
    router.push(`/admin/analytics?${p.toString()}`);
  }
  return (
    <div className="flex gap-1 rounded-xl bg-white/[0.06] border border-white/10 p-1">
      {ANALYTICS_RANGES.map((r) => (
        <button key={r} onClick={() => set(r)}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            current === r ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
          {r}d
        </button>
      ))}
    </div>
  );
}
