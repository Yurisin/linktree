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
    <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="ad-card !bg-bg-2 w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="ad-label">{link ? 'Editar link' : 'Novo link'}</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="ad-field-label">Nome</label>
            <input
              value={label} onChange={(e) => setLabel(e.target.value)} required
              className="ad-field"
              placeholder="Ex: Instagram"
            />
          </div>
          <div>
            <label className="ad-field-label">URL</label>
            <input
              value={url} onChange={(e) => setUrl(e.target.value)} required type="url"
              className="ad-field"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="ad-field-label">Tipo</label>
            <div className="ad-seg w-full [&>button]:flex-1">
              <button type="button" onClick={() => setSocial(false)} className={!social ? 'on' : undefined}>
                Card / botão
              </button>
              <button type="button" onClick={() => setSocial(true)} className={social ? 'on' : undefined}>
                Ícone social
              </button>
            </div>
            <p className="text-[11px] text-ink-faint mt-1.5">
              {social
                ? 'Aparece como ícone pequeno na fileira do topo.'
                : 'Aparece como botão grande na lista de links.'}
            </p>
          </div>
          <div>
            <label className="ad-field-label">Ícone</label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-ink-soft cursor-pointer">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="accent-[var(--action)]" />
              Ativado
            </label>
            {!social && (
              <label className="flex items-center gap-2 text-sm text-ink-soft cursor-pointer">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="accent-[var(--action)]" />
                Destaque (cobalto)
              </label>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="ad-btn ad-btn-ghost flex-1 justify-center">
              Cancelar
            </button>
            <button type="submit" className="ad-btn ad-btn-primary flex-1 justify-center">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
