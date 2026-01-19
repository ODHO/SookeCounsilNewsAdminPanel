
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { Category } from '@/types';

interface SortableRowProps {
  category: Category;
  onEdit: (guid: string) => void;
  onDelete: (guid: string) => void;
  onToggleActive: (guid: string, currentStatus: number) => void;
}

export const SortableRow: React.FC<SortableRowProps> = ({ 
  category, 
  onEdit, 
  onDelete,
  onToggleActive
}) => {
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
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const imageUrl = category.media?.[0]?.original_url || category.image_url || category.cover?.[0]?.original_url;

  return (
    <tr ref={setNodeRef} style={style} className={`${isDragging ? 'bg-indigo-50 shadow-inner' : 'hover:bg-gray-50/50'} transition-colors group`}>
      <td className="px-6 py-4">
        <button 
          {...attributes} 
          {...listeners} 
          className="p-2 text-gray-300 hover:text-indigo-600 cursor-grab active:cursor-grabbing transition-colors"
        >
          <GripVertical size={20} />
        </button>
      </td>
      
      <td className="px-6 py-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
          {imageUrl ? (
            <img src={imageUrl} alt={category.name} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="text-gray-300 w-6 h-6" />
          )}
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{category.name}</span>
          <span className="text-[11px] text-gray-400 font-medium truncate max-w-[200px] mt-0.5 italic">
            {category.description || 'No description provided'}
          </span>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
           {/* Toggle Switch */}
           <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={category.active === 1}
              onChange={() => onToggleActive(category.guid, category.active)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            <span className={`ml-3 text-xs font-bold uppercase tracking-wider ${category.active === 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
              {category.active === 1 ? 'Active' : 'Inactive'}
            </span>
          </label>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-[10px] font-black text-gray-500 uppercase tracking-tighter">
          # {category.order_by}
        </div>
      </td>

      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button 
            onClick={() => onEdit(category.guid)}
            className="p-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all hover:scale-110"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => onDelete(category.guid)}
            className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all hover:scale-110"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};
