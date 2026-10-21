// src/components/admin/IconPicker.tsx
'use client';
import { IconName, ALL_ICONS } from '@/types/linktree';
import { getIconComponent, ICON_LABELS } from '@/lib/icons';

interface Props {
  value: IconName;
  onChange: (icon: IconName) => void;
}

export function IconPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {ALL_ICONS.map((name) => {
        const Icon = getIconComponent(name);
        return (
          <button
            key={name}
            type="button"
            onClick={() => onChange(name)}
            className={`p-2 border flex flex-col items-center gap-1 text-xs transition-colors
              ${value === name
                ? 'border-brand bg-brand-deep/50 text-ink-strong'
                : 'border-line bg-panel hover:border-line-strong text-ink-faint hover:text-ink'}`}
            title={ICON_LABELS[name]}
          >
            <Icon size={18} />
            <span className="truncate w-full text-center text-[10px]">{ICON_LABELS[name]}</span>
          </button>
        );
      })}
    </div>
  );
}
