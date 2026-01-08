
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  FileText, ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Blog, Category, Pagination } from '@/types';
import { ENDPOINTS } from '@/constants';
import { apiRequest } from '@/services/api';
import { Button } from '@/components/ui/Button';

interface TranscriptionsProps {
  token: string;
}

export const Transcriptions: React.FC<TranscriptionsProps> = ({ token }) => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  
  // Updated fetchBlogs to include category_id
  const fetchBlogs = useCallback(async (page: number, catId?: string) => {
    setLoading(true);
    try {
      let url = `${ENDPOINTS.BLOG.LIST}?page=${page}`;
      if (catId) {
        url += `&category_id=${catId}`;
      }
      
      const res = await apiRequest(url, 'GET', null, token);
      if (res.status && res.data && Array.isArray(res.data.blogs)) {
        const active = res.data.blogs.filter((b: any) => b.status === 1);
        setBlogs(active);
        
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (error) {
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  }, [token]);


  // Updated useEffect to trigger on filter change
  useEffect(() => {
      fetchBlogs(currentPage);
  }, [ fetchBlogs, currentPage]);



  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && pagination && newPage <= pagination.total_pages) {
      setCurrentPage(newPage);
    }
  };
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
      <Toaster position="top-right" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">All Transcriptions</h2>
          {/* <p className="text-lg text-gray-500 mt-2 font-medium">Create and manage content for your digital presence.</p> */}
        </div>
        
       
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading && blogs.length === 0 ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-gray-100 shadow-sm" />
          ))
        ) : blogs.map((b) => (
         <div
      key={b.id}
      className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6 hover:shadow-md transition-shadow"
    >
         <div className="w-fit px-3 py-1 bg-white/90 backdrop-blur text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                  {b.category?.name || 'Uncategorized'}
                </div>
          <h3 className="lg:text-xl text-lg py-2  font-semibold text-gray-800 mb-2">
            {b.title || 'Untitled Meeting'}
            </h3>
            {/* <h3 className="text-sm text-[#424242] mt-4 font-semibold">
            View Full Transcripts:
          </h3> */}
          <a
            href={b.transcript[0]?.original_url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#cc3300] font-semibold text-sm hover:underline flex items-center gap-2  mt-2"
          > {b.transcript[0]?.file_name}
          </a>
            
           
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/30 px-6 py-4">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button 
              variant="secondary" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.total_pages}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              {/* Optional: Results counter could go here */}
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
                
                <div className="flex items-center px-4 text-sm font-bold text-indigo-600 border-x border-gray-100 h-10">
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
        <div className="bg-indigo-50 rounded-3xl p-20 text-center border-2 border-dashed border-indigo-200">
          <div className="mx-auto w-20 h-20 bg-white rounded-2xl shadow-md flex items-center justify-center mb-6">
            <FileText className="text-indigo-600 h-10 w-10" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No publications found</h3>
          {/* <p className="text-gray-500 mb-8 max-w-xs mx-auto">
            {filterCategoryId ? "Try selecting a different category or clearing the filter." : "Your editorial is empty. Start creating meaningful content today."}
          </p> */}
          {/* {filterCategoryId ? (
            <Button onClick={() => setFilterCategoryId('')} variant="secondary" className="px-8">Clear Filter</Button>
          ) : (
            <Button onClick={() => setView('create')} className="px-8">Get Started</Button>
          )} */}
        </div>
      )}
    </div>
  );
};