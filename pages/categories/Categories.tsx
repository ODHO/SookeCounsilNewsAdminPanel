
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Edit2, Plus, Trash2, Image as ImageIcon, X, Upload } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Swal from "sweetalert2";

import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { SortableRow } from './SortableRow';
import { Category, Pagination } from '@/types';
import { apiRequest } from '@/services/api';
import { ENDPOINTS } from '@/constants';
import { Button } from '@/components/ui/Button';

interface CategoriesProps {
  token: string;
}

export const Categories: React.FC<CategoriesProps> = ({ token }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingGuid, setEditingGuid] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest(ENDPOINTS.CATEGORY.LIST, 'GET', null, token);
      if (res.status && res.data && Array.isArray(res.data.categories)) {
        // Show only active categories (status = 1) and sort them by order_by
        const active = res.data.categories
          .filter((cat: any) => cat.status === 1)
          .sort((a, b) => (a.order_by || 0) - (b.order_by || 0));
        setCategories(active);
        
        if (res.data.pagination) {
            setPagination(res.data.pagination);
        }
      }
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setImage(null);
    setImagePreview(null);
    setEditingGuid(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = async (guid: string) => {
    setLoading(true);
    try {
      const res = await apiRequest(ENDPOINTS.CATEGORY.GET_BY_GUID(guid), 'GET', null, token);
      if (res.status && res.data && res.data.category) {
        const c = res.data.category as Category;
        setEditingGuid(c.guid);
        setName(c.name);
        setDescription(c.description);
        // Using optional chaining and fallback for image preview
        setImagePreview(c.media?.[0]?.original_url || c.image_url || null);
        setView('edit');
      }
    } catch (err) {
      toast.error("Could not fetch details");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (guid: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This category will be deactivated!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#3b82f6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const res = await apiRequest(
            ENDPOINTS.CATEGORY.Delete(guid),
            "POST",
            null,
            token
          );
          if (res.status) {
            Swal.fire("Deleted!", "Category has been deleted.", "success");
            fetchCategories();
          }
        } catch (err) {
          toast.error("Delete failed");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  useEffect(() => {
    if (view === 'list') {
      fetchCategories();
    }
  }, [view, fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    
    if (image) {
      formData.append('image', image);
    }

    try {
      const endpoint = view === 'create' 
        ? ENDPOINTS.CATEGORY.CREATE 
        : ENDPOINTS.CATEGORY.UPDATE(editingGuid!);
      
      const res = await apiRequest(endpoint, 'POST', formData, token, true);
      
      if (res.status) {
        toast.success(view === 'create' ? "Created successfully" : "Updated successfully");
        resetForm();
        setView('list');
      } else {
        throw new Error(res.message || "Operation failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((item) => item.guid === active.id);
        const newIndex = items.findIndex((item) => item.guid === over.id);
        
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Recalculate order_by based on new position
        const updatedList = newOrder.map((item : any, index) => ({
          ...item,
          order_by: (currentPage - 1) * (pagination?.per_page || 10) + (index + 1)
        }));

        // Sync with server in background
        updateOrderOnServer(updatedList);
        
        return updatedList;
      });
    }
  };

  const updateOrderOnServer = async (sortedList: Category[]) => {
    const promises = sortedList.map((s) => {
      // Body as requested: name, description, image, order_by
      const body = {
        name: s.name,
        description: s.description,
        image: s.image_url || (s.cover?.[0]?.original_url),
        order_by: s.order_by
      };
      return apiRequest(ENDPOINTS.CATEGORY.UPDATE(s.guid), 'POST', body, token);
    });

    try {
      await Promise.all(promises);
      toast.success("Order synchronized with server", { id: 'order-sync' });
    } catch (error) {
      console.error("Order sync error:", error);
      toast.error("Failed to save new order to server");
    }
  };

  if (view !== 'list') {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">
              {view === 'create' ? 'Create New Category' : 'Edit Category'}
            </h2>
            <Button variant="secondary" onClick={() => setView('list')}>Cancel</Button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wider text-[10px]">Category Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                    placeholder="e.g. Regular Meetings"
                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wider text-[10px]">Description</label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    required 
                    rows={6} 
                    placeholder="Briefly describe what this category covers..."
                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wider text-[10px]">Visual Cover</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative group cursor-pointer border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center overflow-hidden h-full
                    ${imagePreview ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-indigo-300'}`}
                  style={{ minHeight: '260px' }}
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="text-white h-10 w-10" />
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImage(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-xl hover:bg-red-600 transition-colors z-10 shadow-lg"
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-8">
                      <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 inline-block">
                        <ImageIcon className="h-10 w-10 text-indigo-400" />
                      </div>
                      <div className="text-sm text-gray-600 font-medium">
                        <span className="text-indigo-600 font-bold">Upload cover</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest font-bold">Standard Formats Only</p>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <Button type="submit" isLoading={loading} className="px-12 py-3 rounded-xl shadow-lg shadow-indigo-100">
                {view === 'create' ? 'Publish Category' : 'Save Category Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-10 animate-in fade-in duration-500">
      <Toaster position="top-right" />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">Organization & Flow</h2>
          <p className="text-gray-500 mt-2 font-medium">Drag and drop rows to customize the category appearance order.</p>
        </div>
        <Button onClick={() => { resetForm(); setView('create'); }} className="px-6 py-3 rounded-xl shadow-xl hover:translate-y-[-2px] transition-all">
          <Plus className="w-5 h-5 mr-2" /> Add New Category
        </Button>
      </div>

      <div className="bg-white shadow-2xl rounded-[32px] overflow-hidden border border-gray-100">
         <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sort</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Cover</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Identity</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Metrics</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Rank</th>
                <th className="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Operations</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
               <SortableContext 
                  items={categories.map(s => s.guid)}
                  strategy={verticalListSortingStrategy}
                >
                  {categories.map((category) => (
                    <SortableRow
                      key={category.guid} 
                      category={category} 
                      onEdit={handleEditClick} 
                      onDelete={handleDeleteClick} 
                    />
                  ))}
                </SortableContext>
              
              {!loading && categories.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-32 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="bg-indigo-50 p-6 rounded-[32px] mb-6">
                        <ImageIcon className="h-10 w-10 text-indigo-400" />
                      </div>
                      <p className="text-2xl font-black text-gray-900">Catalogue is empty</p>
                      <p className="text-gray-400 mt-2 max-w-xs font-medium">Create a category to begin organizing your content structure.</p>
                    </div>
                  </td>
                </tr>
              )}
              
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-32">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest animate-pulse">Synchronizing Data...</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </DndContext>
      </div>
    </div>
  );
};
