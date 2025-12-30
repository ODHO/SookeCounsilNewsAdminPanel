
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Edit2, Plus, Calendar, Trash2, 
  FileText, Image as ImageIcon, 
  X, Upload, ChevronLeft, Link as LinkIcon 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Blog, Category } from '@/types';
import { apiRequest } from '@/services/api';
import { ENDPOINTS } from '@/constants';
import { Button } from '@/components/ui/Button';

interface BlogsProps {
  token: string;
}

export const Blogs: React.FC<BlogsProps> = ({ token }) => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryGuid, setCategoryGuid] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const transcriptInputRef = useRef<HTMLInputElement>(null);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest(ENDPOINTS.BLOG.LIST, 'GET', null, token);
      if (res.status && res.data && Array.isArray(res.data.blogs)) {
        const active = res.data.blogs.filter((b: any) => b.status === 1);
        setBlogs(active);
      }
    } catch (error) {
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiRequest(ENDPOINTS.CATEGORY.LIST, 'GET', null, token);
      if (res.status && res.data && Array.isArray(res.data.categories)) {
        const active = res.data.categories.filter((c: any) => c.status === 1);
        setCategories(active);
      }
    } catch (error) {
      console.error("Failed to load categories for dropdown");
    }
  }, [token]);

  useEffect(() => {
    if (view === 'list') {
      fetchBlogs();
    } else {
      fetchCategories();
    }
  }, [view, fetchBlogs, fetchCategories]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategoryGuid('');
    setImage(null);
    setTranscript(null);
    setImagePreview(null);
    setEditingId(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleTranscriptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error("Please upload a PDF transcript");
        return;
      }
      setTranscript(file);
    }
  };

  const handleEditClick = async (id: number) => {
    setLoading(true);
    try {
      const res = await apiRequest(ENDPOINTS.BLOG.GET_BY_ID(id), 'GET', null, token);
      if (res.status && res.data && res.data.blog) {
        const b = res.data.blog as Blog;
        setEditingId(b.id);
        setTitle(b.title);
        setDescription(b.description);
        setCategoryGuid(b.category_guid || '');
        setImagePreview(b.cover && b.cover.length > 0 ? b.cover[0].original_url : null);
        // if (b.cover && b.cover.length > 0) {
        // }
        setView('edit');
      }
    } catch (err) {
      toast.error("Could not fetch details");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (id: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This blog post will be hidden from the public!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#3b82f6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const res = await apiRequest(ENDPOINTS.BLOG.Delete(id), "POST", null, token);
          if (res.status) {
            Swal.fire("Deleted!", "Blog post has been removed.", "success");
            fetchBlogs();
          }
        } catch (err) {
          toast.error("Delete failed");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryGuid) {
      toast.error("Please select a category");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category_guid', categoryGuid);
    
    if (image) formData.append('image', image);
    if (transcript) formData.append('transcript', transcript);

    try {
      const endpoint = view === 'create' 
        ? ENDPOINTS.BLOG.CREATE 
        : ENDPOINTS.BLOG.UPDATE(editingId!);
      
      const res = await apiRequest(endpoint, 'POST', formData, token, true);
      if (res.status) {
        toast.success(view === 'create' ? "Blog created successfully" : "Blog updated successfully");
        resetForm();
        setView('list');
      }
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  if (view !== 'list') {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="px-8 py-5 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setView('list')}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-2xl font-bold text-gray-800">
                {view === 'create' ? 'Create New Blog Post' : 'Edit Blog Post'}
              </h2>
            </div>
            <Button variant="secondary" onClick={() => setView('list')}>Discard Changes</Button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* Main Content Area */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-indigo-900">Post Title</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    required 
                    placeholder="Enter a catchy title..."
                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-lg font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-indigo-900">Content (HTML Supported)</label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    required 
                    rows={12} 
                    placeholder="<p>Start writing your story...</p>"
                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-mono text-sm leading-relaxed" 
                  />
                </div>
              </div>

              {/* Sidebar Settings Area */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-indigo-900">Category</label>
                  <select
                    value={categoryGuid}
                    onChange={(e) => setCategoryGuid(e.target.value)}
                    required
                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  >
                    <option value="">Select a Category</option>
                    {categories.map((c) => (
                      <option key={c.guid} value={c.guid}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-indigo-900">Cover Image</label>
                  <div 
                    onClick={() => imageInputRef.current?.click()}
                    className={`relative cursor-pointer border-2 border-dashed rounded-2xl aspect-video flex flex-col items-center justify-center overflow-hidden transition-all
                      ${imagePreview ? 'border-indigo-400' : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'}`}
                  >
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Cover Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Upload className="text-white h-8 w-8" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-xs text-indigo-600 font-medium">Upload Image</span>
                      </div>
                    )}
                    <input ref={imageInputRef} type="file" hidden accept="image/*" onChange={handleImageChange} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-indigo-900">PDF Transcript</label>
                  <div 
                    onClick={() => transcriptInputRef.current?.click()}
                    className={`p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer flex items-center space-x-3
                      ${transcript ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-indigo-300 bg-gray-50'}`}
                  >
                    <div className={`${transcript ? 'text-green-600' : 'text-gray-400'}`}>
                      <FileText size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">
                        {transcript ? transcript.name : 'Attach Transcript (PDF)'}
                      </p>
                      <p className="text-[10px] text-gray-500">Max size 10MB</p>
                    </div>
                    {transcript && (
                      <button onClick={(e) => { e.stopPropagation(); setTranscript(null); }} className="text-gray-400 hover:text-red-500">
                        <X size={16} />
                      </button>
                    )}
                    <input ref={transcriptInputRef} type="file" hidden accept=".pdf" onChange={handleTranscriptChange} />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-100 flex justify-end">
              <Button type="submit" isLoading={loading} className="px-12 py-3 rounded-xl shadow-indigo-200 shadow-lg hover:shadow-xl transform transition-transform active:scale-95">
                {view === 'create' ? 'Publish Blog Post' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
      <Toaster position="top-right" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">News Editorial</h2>
          <p className="text-lg text-gray-500 mt-2 font-medium">Create and manage content for your digital presence.</p>
        </div>
        <Button onClick={() => { resetForm(); setView('create'); }} className="px-6 py-3 rounded-xl shadow-lg hover:translate-y-[-2px] transition-all">
          <Plus className="w-5 h-5 mr-2" /> New Publication
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading && blogs.length === 0 ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-gray-100 shadow-sm" />
          ))
        ) : blogs.map((b) => (
          <div key={b.id} className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col h-full">
            <div className="relative aspect-video overflow-hidden">
              <img 
                src={b.cover && b.cover.length > 0 ? b.cover[0].original_url : `https://picsum.photos/600/400?random=${b.id}`}
                alt={b.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-white/90 backdrop-blur text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                  {b.category.name || 'Uncategorized'}
                </span>
              </div>
            </div>
            
            <div className="p-6 flex flex-col flex-1">
              <div className="flex items-center text-[11px] text-gray-400 font-semibold mb-3">
                <Calendar size={12} className="mr-1.5" />
                {b.formatted_date}
              </div>
              <h3 className="text-xl font-bold text-gray-900 line-clamp-2 mb-3 leading-snug group-hover:text-indigo-600 transition-colors">
                {b.title}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-1 leading-relaxed">
                {b.description.replace(/<[^>]*>?/gm, '')}
              </p>
              
              <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex -space-x-2">
                  <div className="h-7 w-7 rounded-full border-2 border-white bg-indigo-500 text-[10px] flex items-center justify-center text-white font-bold">JD</div>
                </div>
                <div className="flex space-x-1">
                  <button 
                    onClick={() => handleEditClick(b.id)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(b.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && blogs.length === 0 && (
        <div className="bg-indigo-50 rounded-3xl p-20 text-center border-2 border-dashed border-indigo-200">
          <div className="mx-auto w-20 h-20 bg-white rounded-2xl shadow-md flex items-center justify-center mb-6">
            <FileText className="text-indigo-600 h-10 w-10" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No publications yet</h3>
          <p className="text-gray-500 mb-8 max-w-xs mx-auto">Your editorial is empty. Start creating meaningful content for your audience today.</p>
          <Button onClick={() => setView('create')} className="px-8">Get Started</Button>
        </div>
      )}
    </div>
  );
};
