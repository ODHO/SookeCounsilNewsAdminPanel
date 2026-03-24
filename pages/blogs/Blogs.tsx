import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Edit2, Plus, Trash2, 
  FileText, Image as ImageIcon, 
  X, Upload, ChevronLeft,
  ChevronRight,
  Search,
  Calendar as CalendarIcon
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Blog, Category, Pagination } from '@/types';
import { ENDPOINTS } from '@/constants';
import { apiRequest } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { RichTextEditor } from './RichTextEditor';

interface BlogsProps {
  token: string;
}

export const Blogs: React.FC<BlogsProps> = ({ token }) => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Tab / Filter State
  const [activeCategoryGuid, setActiveCategoryGuid] = useState<string>('');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryGuid, setCategoryGuid] = useState('');
  const [publishDate, setPublishDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Advanced Images State 
  const [existingImages, setExistingImages] = useState<{id: number, url: string}[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [deletedFiles, setDeletedFiles] = useState<number[]>([]); // Tracking deleted existing image IDs
  
  const [transcript, setTranscript] = useState<File | null>(null);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const transcriptInputRef = useRef<HTMLInputElement>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  
  /**
   * Universal fetch function that handles both List and Search endpoints
   */
  const fetchBlogs = useCallback(async (page: number, catGuid?: string, query?: string) => {
    setLoading(true);
    try {
      let url = '';
      
      // If search query is present, use the search endpoint as requested
      if (query && query.trim() !== '') {
        url = `${ENDPOINTS.BLOG.SEARCH}?search=${encodeURIComponent(query)}&page=${page}&page_size=9`;
      } else {
        // Standard list fetch
        url = `${ENDPOINTS.BLOG.LIST}?page=${page}&page_size=9`;
        if (catGuid) {
          url += `&category_id=${catGuid}`;
        }
      }
      
      const res = await apiRequest(url, 'GET', null, token);
      if (res.status && res.data && Array.isArray(res.data.blogs)) {
        // Only show active blogs
        const active = res.data.blogs.filter((b: any) => b.status === 1);
        setBlogs(active);
        
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      } else {
        setBlogs([]);
        setPagination(null);
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
      console.error("Failed to load categories");
    }
  }, [token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (view === 'list') {
      fetchBlogs(currentPage, activeCategoryGuid, searchTerm);
    }
  }, [view, fetchBlogs, currentPage, activeCategoryGuid, searchTerm]);

  // Handle Enter key on Search Input
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setCurrentPage(1);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && pagination && newPage <= pagination.total_pages) {
      setCurrentPage(newPage);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategoryGuid('');
    setPublishDate(new Date().toISOString().split('T')[0]);
    setExistingImages([]);
    setNewImages([]);
    setNewImagePreviews([]);
    setDeletedFiles([]);
    setTranscript(null);
    setEditingId(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setNewImages(prev => [...prev, ...files]);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input value to allow selecting same file again if needed
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // Remove image loaded from API and register it for deletion
  const removeExistingImage = (id: number) => {
    setExistingImages(prev => prev.filter(img => img.id !== id));
    setDeletedFiles(prev => [...prev, id]); // Add to deleted_files payload
  };

  // Remove newly selected file
  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
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
        setCategoryGuid(String(b.category_guid ?? ''));
        setPublishDate(b.publish_date || new Date().toISOString().split('T')[0]);
        
        // Populate existing images from API
        if (b.cover && b.cover.length > 0) {
          setExistingImages(b.cover.map(c => ({ id: c.id, url: c.original_url })));
        } else {
          setExistingImages([]);
        }
        
        // Reset New images and deletion array when editing a new record
        setNewImages([]); 
        setNewImagePreviews([]);
        setDeletedFiles([]);
        
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
            fetchBlogs(currentPage, activeCategoryGuid, searchTerm);
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
    formData.append('publish_date', publishDate);
    
    // Append NEW images
    newImages.forEach((img, index) => {
      formData.append(`image[${index}]`, img);
    });

    // Append DELETED existing images IDs (e.g. deleted_files[0]=103)
      // ✅ FIX: Append DELETED existing images IDs as a JSON string (e.g., "[103, 105]")
    if (deletedFiles.length > 0) {
      formData.append('deleted_files', JSON.stringify(deletedFiles));
    }
    
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
        <Toaster position="top-right" />
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
                {view === 'create' ? 'Create New Publication' : 'Edit Publication'}
              </h2>
            </div>
            <Button variant="secondary" onClick={() => setView('list')} className="px-4 py-2 rounded-lg">Discard Changes</Button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-indigo-900">Title</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-indigo-900">Content Summary (Rich Text Editor)</label>
                 <RichTextEditor
                  value={description} 
                  onChange={setDescription} 
                  placeholder="Start writing your blog post or paste content from Word..."
                />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-indigo-900">Publish Date</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <CalendarIcon size={18} className="text-indigo-500 group-focus-within:text-indigo-600" />
                    </div>
                    <input 
                      type="date" 
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      required
                      className="block w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium appearance-none"
                    />
                  </div>
                </div>

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
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-indigo-900">Cover Images (Multiple)</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    
                    {/* EXISTING API IMAGES PREVIEW */}
                    {existingImages.map((img) => (
                      <div key={`existing-${img.id}`} className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 group">
                        <img src={img.url} alt={`Existing cover ${img.id}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button 
                          type="button"
                          onClick={() => removeExistingImage(img.id)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}

                    {/* NEWLY ADDED FILES PREVIEW */}
                    {newImagePreviews.map((preview, index) => (
                      <div key={`new-${index}`} className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 group">
                        <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}

                    {/* ADD IMAGE TRIGGER BUTTON */}
                    <div 
                      onClick={() => imageInputRef.current?.click()}
                      className="cursor-pointer border-2 border-dashed border-gray-300 rounded-xl aspect-video flex flex-col items-center justify-center hover:border-indigo-300 hover:bg-gray-50 transition-all"
                    >
                      <Plus className="h-6 w-6 text-gray-400 mb-1" />
                      <span className="text-[10px] text-indigo-600 font-medium">Add Image</span>
                    </div>
                  </div>
                  <input ref={imageInputRef} type="file" hidden accept="image/*" multiple onChange={handleImageChange} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-indigo-900">PDF Transcript (Optional)</label>
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
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Publications</h2>
          <p className="text-lg text-gray-500 mt-2 font-medium">Create and manage your editorial archives.</p>
        </div>
        <div className="flex md:flex-row flex-col gap-2">
          <div className="relative group w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#d84602] transition-colors" size={20} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              onKeyPress={handleSearchKeyPress}
              placeholder="Search archives..."
              className="w-full bg-white pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 focus:border-[#d84602] transition-all outline-none font-semibold text-gray-800 shadow-sm"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <Button onClick={() => { resetForm(); setView('create'); }} className="px-6 py-3 rounded-xl shadow-lg hover:translate-y-[-2px] transition-all w-full md:w-auto">
            <Plus className="w-5 h-5 mr-2" /> New Publication
          </Button>
        </div>
      </div>

      <div className="border-b border-gray-200 overflow-x-auto no-scrollbar flex items-center space-x-2 py-2">
        <button
          onClick={() => {
            setActiveCategoryGuid('');
            setCurrentPage(1);
          }}
          className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 ${
            activeCategoryGuid === '' 
              ? 'bg-[#d84602] text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
          }`}
        >
          All Topics
        </button>
        {categories.map((c) => (
          <button
            key={c.guid}
            onClick={() => {
              setActiveCategoryGuid(c.id);
              setCurrentPage(1);
            }}
            className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 ${
              activeCategoryGuid === c.id
                ? 'bg-[#d84602] text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            {c.name}
          </button>
        ))}
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
                referrerPolicy="no-referrer"
              />
              {b.cover && b.cover.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm">
                  +{b.cover.length - 1} more
                </div>
              )}
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-white/90 backdrop-blur text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                  {b.category?.name || 'Uncategorized'}
                </span>
              </div>
            </div>
            
            <div className="p-6 flex flex-col flex-1">
              <div className="flex items-center text-[11px] text-gray-400 font-semibold mb-3">
                <CalendarIcon size={12} className="mr-1.5" />
                {b.formatted_date}
              </div>
              <h3 className="text-xl font-bold text-gray-900 line-clamp-2 mb-3 leading-snug group-hover:text-indigo-600 transition-colors">
                {b.title}
              </h3>
              <div 
                className="text-sm text-gray-500 line-clamp-3 mb-6 flex-1 leading-relaxed prose-editor"
                dangerouslySetInnerHTML={{ __html: b.description || "No description available." }}
              />
              
              <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex -space-x-2">
                  <div className="h-7 w-7 rounded-full border-2 border-white bg-indigo-500 text-[10px] flex items-center justify-center text-white font-bold">
                    {b.user?.name ? b.user.name.substring(0, 2).toUpperCase() : 'JD'}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button 
                    onClick={() => handleEditClick(b.id)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(b.id.toString())}
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

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/30 px-6 py-4 rounded-b-2xl">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button 
              variant="secondary" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-4 py-2 rounded-lg"
            >
              Previous
            </Button>
            <Button
              variant="secondary" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.total_pages}
              className="px-4 py-2 rounded-lg"
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500 font-medium">
              Showing <span className="font-bold">{(currentPage - 1) * pagination.page_size + 1}</span> to <span className="font-bold">{Math.min(currentPage * pagination.page_size, pagination.total)}</span> of <span className="font-bold">{pagination.total}</span> results
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm bg-white border border-gray-200" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center rounded-l-xl px-3 py-2 text-gray-500 hover:bg-gray-50 focus:z-20 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                
                <div className="flex items-center px-4 text-sm font-bold text-[#d84602] border-x border-gray-100 h-10">
                  Page {currentPage} of {pagination.total_pages}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= pagination.total_pages}
                  className="relative inline-flex items-center rounded-r-xl px-3 py-2 text-gray-500 hover:bg-gray-50 focus:z-20 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {!loading && blogs.length === 0 && (
        <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-200 shadow-sm">
          <div className="mx-auto w-20 h-20 bg-gray-50 rounded-2xl shadow-sm flex items-center justify-center mb-6">
            <FileText className="text-gray-400 h-10 w-10" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {searchTerm ? `No results for "${searchTerm}"` : 'No publications found'}
          </h3>
          <p className="text-gray-500 mb-8 max-w-xs mx-auto font-medium">
            {searchTerm 
              ? "Try adjusting your search terms or filters to find what you're looking for." 
              : "Your editorial is empty. Start creating meaningful content today."}
          </p>
          <div className="flex justify-center gap-3">
             {searchTerm && (
                <Button variant="secondary" onClick={() => setSearchTerm('')} className="px-8 py-3 rounded-xl">Clear Search</Button>
             )}
             <Button onClick={() => setView('create')} className="px-8 py-3 rounded-xl">Get Started</Button>
          </div>
        </div>
      )}
    </div>
  );
};