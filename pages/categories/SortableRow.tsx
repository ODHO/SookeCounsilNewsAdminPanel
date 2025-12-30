
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2, ImageIcon } from 'lucide-react';
import { Category } from '@/types';

interface SortableRowProps {
  category: Category;
  onEdit: (guid: string) => void;
  onDelete: (guid: string) => void;
}

export const SortableRow: React.FC<SortableRowProps> = ({ category, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: category.guid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
  };

  const imageUrl = category.cover?.[0]?.original_url || category.image_url;

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-gray-50 bg-white">
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <GripVertical className="w-5 h-5" />
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-14 w-14 rounded-xl overflow-hidden bg-gray-100 ring-1 ring-gray-200">
          {imageUrl ? (
            <img src={imageUrl} alt={category.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400">
              <ImageIcon size={20} />
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm font-bold text-gray-900">{category.name}</div>
        <div className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-xs">{category.description}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          {category.news_count ?? category.product_count ?? 0} Items
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Order</span>
          <span className="text-sm font-black text-indigo-600">#{category.order_by ?? 'N/A'}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
        <button 
          onClick={() => onEdit(category.guid)}
          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-xl transition-all hover:scale-110"
          title="Edit Category"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onDelete(category.guid)}
          className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-xl transition-all hover:scale-110"
          title="Delete Category"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};
