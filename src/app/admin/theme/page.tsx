// src/app/admin/theme/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { ProfileData, ThemeConfig } from '@/types/linktree';
import { ThemeEditor } from '@/components/admin/ThemeEditor';

export default function ThemeAdminPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/profile').then((r) => r.json()).then(setProfile);
  }, []);

  async function handleSave(theme: ThemeConfig) {
    if (!profile) return;
    const res = await fetch('/api/admin/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...profile, theme }),
    });
    if (!res.ok) throw new Error('Failed to save');
    const updated = await res.json();
    setProfile(updated);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  if (!profile) return <p className="text-slate-400">Carregando...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">Tema</h1>
      {success && <p className="text-green-400 text-sm">Tema salvo!</p>}
      <ThemeEditor theme={profile.theme} onSave={handleSave} />
    </div>
  );
}
