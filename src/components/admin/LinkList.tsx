// src/components/admin/LinkList.tsx
'use client';
import { useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LinkItem } from '@/types/linktree';
import { getIconComponent } from '@/lib/icons';
import { GripVertical, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';

interface RowProps {
  link: LinkItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

function SortableLinkRow({ link, onEdit, onDelete, onToggle }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: link.id });
  const Icon = getIconComponent(link.icon);
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 p-3 border ${
        isDragging ? 'border-brand bg-brand-deep/40 z-10' : 'border-line bg-panel'
      } transition-colors`}
    >
      <button {...attributes} {...listeners} className="text-ink-faint hover:text-ink-soft cursor-grab active:cursor-grabbing" aria-label="Arrastar">
        <GripVertical size={18} />
      </button>
      <div className="w-8 h-8 bg-bg-2 border border-line flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-ink-soft" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${link.enabled ? 'text-ink-strong' : 'text-ink-faint line-through'}`}>
          {link.label}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="ad-tag !text-[10px] !leading-[14px] !px-1.5 uppercase flex-shrink-0">
            {link.social ? 'social' : 'card'}
          </span>
          {link.featured && !link.social && (
            <span className="ad-tag !text-[10px] !leading-[14px] !px-1.5 uppercase flex-shrink-0 !text-brand-bright !border-line-strong">
              destaque
            </span>
          )}
          <p className="text-xs text-ink-faint truncate">{link.url}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onToggle} className="p-1.5 hover:bg-panel text-ink-faint hover:text-ink" title={link.enabled ? 'Desativar' : 'Ativar'}>
          {link.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        <button onClick={onEdit} className="p-1.5 hover:bg-panel text-ink-faint hover:text-ink" title="Editar">
          <Pencil size={16} />
        </button>
        <button onClick={onDelete} className="p-1.5 hover:bg-panel text-ink-faint hover:text-red-400" title="Excluir">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

interface Props {
  links: LinkItem[];
  onReorder: (newLinks: LinkItem[]) => void;
  onEdit: (link: LinkItem) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}

export function LinkList({ links, onReorder, onEdit, onDelete, onToggle }: Props) {
  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);
    onReorder(arrayMove(links, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {links.map((link) => (
            <SortableLinkRow
              key={link.id}
              link={link}
              onEdit={() => onEdit(link)}
              onDelete={() => onDelete(link.id)}
              onToggle={() => onToggle(link.id, !link.enabled)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
