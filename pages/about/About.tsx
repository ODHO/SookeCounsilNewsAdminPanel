
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Edit2, Plus, Info, 
  Image as ImageIcon, 
  X, Upload, ChevronLeft, Layout
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { apiRequest } from '@/services/api';
import { ENDPOINTS } from '@/constants';
import { Button } from '@/components/ui/Button';

interface AboutProps {
  token: string;
}

export const About: React.FC<AboutProps> = ({ token }) => {
  // Change to a single object since API returns { data: { about: { ... } } }
  const [aboutData, setAboutData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const fetchAbout = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest(ENDPOINTS.ABOUT.LIST, 'GET', null, token);
      if (res.status && res.data && res.data.about) {
        setAboutData(res.data.about);
      }
    } catch (error) {
      toast.error("Failed to load about content");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (view === 'list') {
      fetchAbout();
    }
  }, [view, fetchAbout]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLongDescription('');
    setImage(null);
    setCover(null);
    setImagePreview(null);
    setCoverPreview(null);
    setEditingId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'image') {
          setImage(file);
          setImagePreview(reader.result as string);
        } else {
          setCover(file);
          setCoverPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title || '');
    setDescription(item.description || '');
    setLongDescription(item.long_description || '');
    
    // Set previews from existing media arrays
    const imgUrl = item.image?.[0]?.original_url;
    const cvrUrl = item.cover?.[0]?.original_url;
    
    setImagePreview(imgUrl || null);
    setCoverPreview(cvrUrl || null);
    setView('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('long_description', longDescription);
    
    if (image) formData.append('image', image);
    if (cover) formData.append('cover', cover);
    if (editingId) formData.append('id', editingId.toString());

    try {
      const res = await apiRequest(ENDPOINTS.ABOUT.CREATE, 'POST', formData, token, true);
      if (res.status) {
        toast.success("About content updated successfully");
        resetForm();
        setView('list');
      }
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (view !== 'list') {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="px-8 py-6 bg-indigo-900 flex justify-between items-center text-white">
            <div className="flex items-center space-x-4">
              <button onClick={() => setView('list')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold">Manage About Content</h2>
            </div>
            <Button variant="secondary" onClick={() => setView('list')} className="bg-white/10 border-white/20 text-white hover:bg-white/20">Discard</Button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Main Heading</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    required 
                    className="block w-full rounded-2xl border border-gray-200 px-5 py-4 text-lg font-medium text-gray-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Short Description</label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    required 
                    rows={6} 
                    className="block w-full rounded-2xl border border-gray-200 px-5 py-4 text-gray-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-sm leading-relaxed" 
                  />
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Profile Image</label>
                  <div 
                    onClick={() => imageInputRef.current?.click()}
                    className={`relative cursor-pointer border-2 border-dashed rounded-3xl aspect-video flex flex-col items-center justify-center overflow-hidden group transition-all
                      ${imagePreview ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}
                  >
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload className="text-white h-10 w-10" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-indigo-600 font-bold">Select Image</p>
                      </div>
                    )}
                    <input ref={imageInputRef} type="file" hidden accept="image/*" onChange={e => handleFileChange(e, 'image')} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Cover Image</label>
                  <div 
                    onClick={() => coverInputRef.current?.click()}
                    className={`relative cursor-pointer border-2 border-dashed rounded-3xl h-32 flex flex-col items-center justify-center overflow-hidden group transition-all
                      ${coverPreview ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}
                  >
                    {coverPreview ? (
                      <>
                        <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Layout className="text-white h-8 w-8" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-8 w-8 text-gray-300 mb-1" />
                        <p className="text-xs text-indigo-600 font-bold">Upload Cover</p>
                      </div>
                    )}
                    <input ref={coverInputRef} type="file" hidden accept="image/*" onChange={e => handleFileChange(e, 'cover')} />
                  </div>
                </div>
              </div>

              <div className="col-span-1 lg:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Long Description / History</label>
                <textarea 
                  value={longDescription} 
                  onChange={e => setLongDescription(e.target.value)} 
                  required 
                  rows={10} 
                  className="block w-full rounded-2xl border border-gray-200 px-5 py-4 text-gray-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-mono text-sm leading-relaxed" 
                />
              </div>
            </div>

            <div className="pt-8 border-t border-gray-100 flex justify-end">
              <Button type="submit" isLoading={loading} className="px-16 py-4 rounded-2xl shadow-xl shadow-indigo-200 text-lg">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 space-y-10 animate-in fade-in duration-500">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-black text-gray-900 tracking-tight">About Us</h2>
          <p className="text-xl text-gray-500 mt-3 font-medium">Control the narrative of your brand story.</p>
        </div>
        {!loading && !aboutData && (
          <Button onClick={() => { resetForm(); setView('create'); }} className="px-8 py-3 rounded-2xl shadow-lg">
            <Plus className="w-5 h-5 mr-2" /> Create About Content
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-10">
        {loading ? (
          <div className="h-96 bg-white rounded-[40px] border border-gray-100 flex items-center justify-center">
             <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="text-gray-400 font-medium animate-pulse">Loading content...</p>
             </div>
          </div>
        ) : aboutData ? (
          <div className="bg-white rounded-[40px] shadow-2xl shadow-indigo-100/50 border border-gray-100 overflow-hidden group relative">
            <div className="relative h-72 overflow-hidden bg-gray-100">
              <img 
                src={aboutData.cover?.[0]?.original_url || 'https://picsum.photos/1200/400'} 
                alt="Cover" 
                className="w-full h-full object-cover opacity-90" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent"></div>
              
              <div className="absolute bottom-10 left-10 flex items-end space-x-8">
                <div className="h-44 w-44 rounded-[32px] overflow-hidden border-8 border-white shadow-2xl bg-white">
                  <img 
                    src={aboutData.image?.[0]?.original_url || 'https://picsum.photos/400/400'} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="pb-4">
                   <h3 className="text-4xl font-black text-gray-900 leading-none mb-3">{aboutData.title}</h3>
                   <span className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
                     Primary Content Section
                   </span>
                </div>
              </div>

              <button 
                onClick={() => handleEditClick(aboutData)}
                className="absolute top-8 right-8 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all transform hover:-translate-y-1 active:scale-95"
              >
                <Edit2 size={24} />
              </button>
            </div>

            <div className="p-12 pt-16">
              <div className="max-w-4xl">
                 <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">Brief Introduction</h4>
                 <p className="text-xl text-gray-600 leading-relaxed font-medium mb-12">
                    {aboutData.description}
                 </p>
                 
                 {aboutData.long_description && (
                   <>
                     <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">Extended History</h4>
                     <div className="prose prose-indigo max-w-none text-gray-500 whitespace-pre-wrap leading-relaxed">
                        {aboutData.long_description}
                     </div>
                   </>
                 )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-24 text-center bg-white rounded-[40px] border-2 border-dashed border-gray-100">
            <Info className="mx-auto h-20 w-20 text-gray-100 mb-6" />
            <h3 className="text-3xl font-bold text-gray-900 mb-3">No content found</h3>
            <p className="text-gray-500 text-lg mb-8">Start by creating the initial about us content.</p>
            <Button onClick={() => setView('create')} className="px-10 py-3 rounded-2xl">Initialize Content</Button>
          </div>
        )}
      </div>
    </div>
  );
};
