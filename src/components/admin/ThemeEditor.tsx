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
    <form onSubmit={handleSubmit} className="ad-card space-y-6 max-w-md">
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {/* Live preview */}
      <div
        className="p-4 border border-line"
        style={{ backgroundColor: values.bgColor }}
      >
        <div
          className="h-1 mb-3"
          style={{ background: `linear-gradient(to right, ${values.accentColor}, ${values.accentColor}88)` }}
        />
        <div
          className="p-3 text-sm"
          style={{ backgroundColor: values.cardColor, color: values.textColor, opacity: 0.9 }}
        >
          Preview do card
        </div>
      </div>
      {FIELDS.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-4">
          <input
            type="color"
            value={values[key].startsWith('#') ? values[key] : '#3278ff'}
            onChange={(e) => update(key, e.target.value)}
            className="w-10 h-10 border border-line bg-transparent cursor-pointer"
          />
          <div className="flex-1">
            <label className="ad-field-label">{label}</label>
            <input
              value={values[key]}
              onChange={(e) => update(key, e.target.value)}
              className="ad-field"
            />
          </div>
        </div>
      ))}
      <button type="submit" disabled={saving}
        className="ad-btn ad-btn-primary">
        {saving ? 'Salvando...' : 'Salvar tema'}
      </button>
    </form>
  );
}
