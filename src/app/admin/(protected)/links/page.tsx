// src/app/admin/links/page.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { LinkItem } from '@/types/linktree';
import { LinkList } from '@/components/admin/LinkList';
import { LinkEditor } from '@/components/admin/LinkEditor';
import { Plus } from 'lucide-react';

export default function LinksAdminPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [editing, setEditing] = useState<LinkItem | null | 'new'>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    const res = await fetch('/api/admin/links');
    if (!res.ok) { setError('Erro ao carregar links'); setLoading(false); return; }
    setLinks(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  async function handleSave(data: Omit<LinkItem, 'id' | 'position'>) {
    setError(null);
    if (editing === 'new') {
      const res = await fetch('/api/admin/links', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (!res.ok) { setError('Erro ao criar link'); return; }
      const newLink = await res.json();
      setLinks((prev) => [...prev, newLink]);
    } else if (editing) {
      const res = await fetch(`/api/admin/links/${editing.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (!res.ok) { setError('Erro ao atualizar link'); return; }
      const updated = await res.json();
      setLinks((prev) => prev.map((l) => l.id === updated.id ? updated : l));
    }
    setEditing(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este link?')) return;
    const res = await fetch(`/api/admin/links/${id}`, { method: 'DELETE' });
    if (res.ok) setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  async function handleToggle(id: string, enabled: boolean) {
    const res = await fetch(`/api/admin/links/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled }),
    });
    if (res.ok) {
      const updated = await res.json();
      setLinks((prev) => prev.map((l) => l.id === updated.id ? updated : l));
    }
  }

  async function handleReorder(newLinks: LinkItem[]) {
    const previous = links;
    setLinks(newLinks); // optimistic
    const res = await fetch('/api/admin/links', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLinks.map((l, i) => ({ id: l.id, position: i }))),
    });
    if (!res.ok) setLinks(previous); // rollback on failure
  }

  if (loading) return <p className="text-slate-400">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Links</h1>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Novo Link
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {links.length === 0 ? (
        <p className="text-slate-500 text-sm">Nenhum link ainda. Crie um!</p>
      ) : (
        <LinkList
          links={links}
          onReorder={handleReorder}
          onEdit={setEditing}
          onDelete={handleDelete}
          onToggle={handleToggle}
        />
      )}
      {editing !== null && (
        <LinkEditor
          link={editing === 'new' ? null : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
