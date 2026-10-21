// src/components/admin/ProfileEditor.tsx
'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { ProfileData } from '@/types/linktree';
import { Upload } from 'lucide-react';
import { AvatarCropModal } from './AvatarCropModal';

interface Props {
  profile: ProfileData;
  onSave: (data: { name: string; bio: string; avatar_url: string | null }) => Promise<void>;
}

export function ProfileEditor({ profile, onSave }: Props) {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected after cancel
    e.target.value = '';
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
  }

  async function handleCropConfirm(blob: Blob) {
    setCropSrc(null);
    const localPreview = URL.createObjectURL(blob);
    setPreview(localPreview);
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', blob, 'avatar.jpg');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json();
      setAvatarUrl(url);
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleCropCancel() {
    setCropSrc(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({ name, bio, avatar_url: avatarUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const displayImage = preview ?? avatarUrl;

  return (
    <>
      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    <form onSubmit={handleSubmit} className="ad-card space-y-6 max-w-md">
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex items-center gap-6">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-bg-2 border border-line-strong flex items-center justify-center flex-shrink-0">
          {displayImage && (
            <Image src={displayImage} alt="Avatar" fill className="object-cover" unoptimized={!!preview} />
          )}
          {!displayImage && (
            <span className="text-ink-soft text-xl font-bold">
              {name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="ad-btn ad-btn-ghost"
          >
            <Upload size={16} />
            {uploading ? 'Enviando...' : 'Trocar foto'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      </div>
      <div>
        <label className="ad-field-label">Nome</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required
          className="ad-field" />
      </div>
      <div>
        <label className="ad-field-label">Bio</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)}
          className="ad-field resize-none"
          rows={3} />
      </div>
      <button type="submit" disabled={saving || uploading}
        className="ad-btn ad-btn-primary">
        {saving ? 'Salvando...' : 'Salvar perfil'}
      </button>
    </form>
    </>
  );
}
