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
      className={`flex items-center gap-3 p-3 rounded-xl border ${
        isDragging ? 'border-indigo-500 bg-indigo-500/10 z-10' : 'border-white/10 bg-white/5'
      } transition-colors`}
    >
      <button {...attributes} {...listeners} className="text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing">
        <GripVertical size={18} />
      </button>
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-slate-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${link.enabled ? 'text-white' : 'text-slate-500'}`}>
          {link.label}
        </p>
        <p className="text-xs text-slate-600 truncate">{link.url}</p>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white" title={link.enabled ? 'Desativar' : 'Ativar'}>
          {link.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white" title="Editar">
          <Pencil size={16} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400" title="Excluir">
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
