// src/components/admin/LinkEditor.tsx
'use client';
import { useState } from 'react';
import { LinkItem, IconName } from '@/types/linktree';
import { IconPicker } from './IconPicker';
import { X } from 'lucide-react';

interface Props {
  link: LinkItem | null; // null = create mode
  onSave: (data: Omit<LinkItem, 'id' | 'position'>) => void;
  onClose: () => void;
}

export function LinkEditor({ link, onSave, onClose }: Props) {
  const [label, setLabel] = useState(link?.label ?? '');
  const [url, setUrl] = useState(link?.url ?? '');
  const [icon, setIcon] = useState<IconName>(link?.icon ?? 'globe');
  const [enabled, setEnabled] = useState(link?.enabled ?? true);
  const [featured, setFeatured] = useState(link?.featured ?? false);
  const [social, setSocial] = useState(link?.social ?? false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Destaque só faz sentido em card; ícone social nunca é "featured".
    onSave({ label, url, icon, enabled, featured: social ? false : featured, social });
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {link ? 'Editar Link' : 'Novo Link'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Nome</label>
            <input
              value={label} onChange={(e) => setLabel(e.target.value)} required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Ex: Instagram"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">URL</label>
            <input
              value={url} onChange={(e) => setUrl(e.target.value)} required type="url"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSocial(false)}
                className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                  !social
                    ? 'border-indigo-500 bg-indigo-500/20 text-white'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                Card / botão
              </button>
              <button
                type="button"
                onClick={() => setSocial(true)}
                className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                  social
                    ? 'border-indigo-500 bg-indigo-500/20 text-white'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                Ícone de rede social
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              {social
                ? 'Aparece como ícone pequeno na fileira do topo.'
                : 'Aparece como botão grande na lista de links.'}
            </p>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Ícone</label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="accent-indigo-500" />
              Ativado
            </label>
            {!social && (
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="accent-indigo-500" />
                Destaque (cobalto)
              </label>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
