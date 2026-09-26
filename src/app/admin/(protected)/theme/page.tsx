// src/app/admin/theme/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { ProfileData, ThemeConfig } from '@/types/linktree';
import { ThemeEditor } from '@/components/admin/ThemeEditor';

export default function ThemeAdminPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/profile')
      .then((r) => { if (!r.ok) throw new Error('Erro ao carregar tema'); return r.json(); })
      .then(setProfile)
      .catch((e) => setError(e.message));
  }, []);

  async function handleSave(theme: ThemeConfig) {
    if (!profile) return;
    setError(null);
    const res = await fetch('/api/admin/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...profile, theme }),
    });
    if (!res.ok) { setError('Erro ao salvar tema'); return; }
    const updated = await res.json();
    setProfile(updated);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  if (!profile && !error) return <p className="text-slate-400">Carregando...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">Tema</h1>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">Tema salvo!</p>}
      {profile && <ThemeEditor theme={profile.theme} onSave={handleSave} />}
    </div>
  );
}
