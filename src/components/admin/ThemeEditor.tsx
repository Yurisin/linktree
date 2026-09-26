// src/components/admin/ThemeEditor.tsx
'use client';
import { useState } from 'react';
import { ThemeConfig } from '@/types/linktree';

interface Props {
  theme: ThemeConfig;
  onSave: (theme: ThemeConfig) => Promise<void>;
}

const FIELDS: Array<{ key: keyof ThemeConfig; label: string }> = [
  { key: 'bgColor',      label: 'Cor de Fundo' },
  { key: 'accentColor',  label: 'Cor de Destaque' },
  { key: 'cardColor',    label: 'Cor dos Cards' },
  { key: 'textColor',    label: 'Cor do Texto' },
];

export function ThemeEditor({ theme, onSave }: Props) {
  const [values, setValues] = useState<ThemeConfig>(theme);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: keyof ThemeConfig, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {/* Live preview */}
      <div
        className="rounded-xl p-4 border border-white/10"
        style={{ backgroundColor: values.bgColor }}
      >
        <div
          className="h-2 rounded-full mb-3"
          style={{ background: `linear-gradient(to right, ${values.accentColor}, ${values.accentColor}88)` }}
        />
        <div
          className="rounded-lg p-3 text-sm"
          style={{ backgroundColor: values.cardColor, color: values.textColor, opacity: 0.9 }}
        >
          Preview do card
        </div>
      </div>
      {FIELDS.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-4">
          <input
            type="color"
            value={values[key].startsWith('#') ? values[key] : '#6366f1'}
            onChange={(e) => update(key, e.target.value)}
            className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
          />
          <div className="flex-1">
            <label className="text-xs text-slate-400 block mb-1">{label}</label>
            <input
              value={values[key]}
              onChange={(e) => update(key, e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      ))}
      <button type="submit" disabled={saving}
        className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
        {saving ? 'Salvando...' : 'Salvar Tema'}
      </button>
    </form>
  );
}
