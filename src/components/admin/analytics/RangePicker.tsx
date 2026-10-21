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
    <div className="ad-seg">
      {ANALYTICS_RANGES.map((r) => (
        <button key={r} onClick={() => set(r)}
          className={current === r ? 'on' : undefined}>
          {r}d
        </button>
      ))}
    </div>
  );
}
