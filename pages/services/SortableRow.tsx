
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2 } from 'lucide-react';
import { Service } from '@/types';

interface SortableRowProps {
  service: Service;
  onEdit: (guid: string) => void;
  onDelete: (guid: string) => void;
}

export const SortableRow: React.FC<SortableRowProps> = ({ service, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: service.guid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-gray-50 bg-white">
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="w-5 h-5" />
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">{service.title}</span>
          <span className="text-xs text-gray-500 font-mono">{service.guid}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-600 line-clamp-1 max-w-xs">{service.description}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-gray-900">${Number(service.price).toFixed(2)}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          Order: {service.order_by}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
        <button 
          onClick={() => onEdit(service.guid)}
          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-full transition-colors"
          title="Edit Service"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onDelete(service.guid)}
          className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full transition-colors"
          title="Delete Service"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};
