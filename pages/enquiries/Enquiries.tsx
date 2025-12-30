import React, { useEffect, useState, useCallback } from 'react';
import { Eye, Mail, Calendar, User, ChevronLeft, ChevronRight, MessageSquare, X, List } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { Enquiry, Newsletter, Pagination } from '@/types';
import { ENDPOINTS } from '@/constants';
import { apiRequest } from '@/services/api';
import { Button } from '@/components/ui/Button';


interface EnquiriesProps {
  token: string;
}

export const Enquiries: React.FC<EnquiriesProps> = ({ token }) => {
  const [activeTab, setActiveTab] = useState<'enquiries' | 'newsletter'>('enquiries');

  // Enquiries State
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);
  const [enquiryPage, setEnquiryPage] = useState(1);
  const [enquiryPagination, setEnquiryPagination] = useState<Pagination | null>(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

  // Newsletter State
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loadingNewsletter, setLoadingNewsletter] = useState(false);
  const [newsletterPage, setNewsletterPage] = useState(1);
  const [newsletterPagination, setNewsletterPagination] = useState<Pagination | null>(null);

  const fetchEnquiries = useCallback(async (page: number) => {
    setLoadingEnquiries(true);
    try {
      const url = `${ENDPOINTS.ENQUERIES.LIST}?page=${page}`;
      const res = await apiRequest(url, 'GET', null, token);
      
      if (res.status && res.data) {
        if (Array.isArray(res.data.enquiry)) {
            setEnquiries(res.data.enquiry);
        } else {
            setEnquiries([]);
        }

        if (res.data.pagination) {
            setEnquiryPagination(res.data.pagination);
        }
      } else {
        setEnquiries([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load enquiries");
    } finally {
      setLoadingEnquiries(false);
    }
  }, [token]);

  const fetchNewsletters = useCallback(async (page: number) => {
    setLoadingNewsletter(true);
    try {
      const url = `${ENDPOINTS.NEWSLETTER.LIST}?page=${page}`;
      const res = await apiRequest(url, 'GET', null, token);
      
      if (res.status && res.data) {
        if (Array.isArray(res.data.newsletter)) {
            setNewsletters(res.data.newsletter);
        } else {
            setNewsletters([]);
        }

        if (res.data.pagination) {
            setNewsletterPagination(res.data.pagination);
        }
      } else {
        setNewsletters([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load newsletters");
    } finally {
      setLoadingNewsletter(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'enquiries') {
      fetchEnquiries(enquiryPage);
    } else {
      fetchNewsletters(newsletterPage);
    }
  }, [activeTab, enquiryPage, newsletterPage, fetchEnquiries, fetchNewsletters]);

  const handleEnquiryPageChange = (newPage: number) => {
    if (enquiryPagination && newPage >= 1 && newPage <= enquiryPagination.total_pages) {
      setEnquiryPage(newPage);
    }
  };

  const handleNewsletterPageChange = (newPage: number) => {
    if (newsletterPagination && newPage >= 1 && newPage <= newsletterPagination.total_pages) {
      setNewsletterPage(newPage);
    }
  };

  const PaginationControls = ({ 
    pagination, 
    onPageChange, 
    currentPage 
  }: { 
    pagination: Pagination, 
    onPageChange: (p: number) => void, 
    currentPage: number 
  }) => (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
            variant="secondary" 
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
        >
          Previous
        </Button>
        <Button 
            variant="secondary" 
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= pagination.total_pages}
        >
          Next
        </Button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing page <span className="font-medium">{pagination.page}</span> of{' '}
            <span className="font-medium">{pagination.total_pages}</span> ({pagination.total} results)
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= pagination.total_pages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 relative">
      <Toaster position="top-right" />
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {activeTab === 'enquiries' ? 'Inquiries' : 'Newsletter Subscribers'}
        </h2>
        
        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'enquiries' 
                ? 'bg-white text-gray-900 shadow' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Inquiries
          </button>
          <button
            onClick={() => setActiveTab('newsletter')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'newsletter' 
                ? 'bg-white text-gray-900 shadow' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Newsletter / Blogs
          </button>
        </div>
      </div>


      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        {activeTab === 'enquiries' ? (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enquiries.map((enquiry) => (
                  <tr key={enquiry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{enquiry.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center text-sm text-gray-500">
                          <Mail className="w-3 h-3 mr-1" />
                          {enquiry.email}
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                         <Calendar className="w-3 h-3 mr-1" />
                         {new Date(enquiry.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {enquiry.message}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => setSelectedEnquiry(enquiry)} 
                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-full hover:bg-indigo-100 transition-colors"
                        title="View Message"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!loadingEnquiries && enquiries.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No inquiries found.</td></tr>
                )}
                {loadingEnquiries && (
                   <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading inquiries...</td></tr>
                )}
              </tbody>
            </table>
            
            {enquiryPagination && enquiryPagination.total_pages > 1 && (
                <PaginationControls 
                    pagination={enquiryPagination} 
                    onPageChange={handleEnquiryPageChange} 
                    currentPage={enquiryPage} 
                />
            )}
          </>
        ) : (
          <>
            {/* Newsletter Table */}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscribed Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {newsletters.map((newsletter) => (
                  <tr key={newsletter.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center text-sm font-medium text-gray-900">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {newsletter.email}
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                         <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                         {new Date(newsletter.created_at).toLocaleString()}
                      </div>
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Subscribed
                        </span>
                    </td>
                  </tr>
                ))}
                {!loadingNewsletter && newsletters.length === 0 && (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">No subscribers found.</td></tr>
                )}
                {loadingNewsletter && (
                   <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Loading subscribers...</td></tr>
                )}
              </tbody>
            </table>
            
             {newsletterPagination && newsletterPagination.total_pages > 1 && (
                <PaginationControls 
                    pagination={newsletterPagination} 
                    onPageChange={handleNewsletterPageChange} 
                    currentPage={newsletterPage} 
                />
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedEnquiry(null)}></div>
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onClick={() => setSelectedEnquiry(null)}
              >
                <span className="sr-only">Close</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                <MessageSquare className="h-6 w-6 text-indigo-600" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  Enquiry from {selectedEnquiry.name}
                </h3>
                <div className="mt-2 space-y-3">
                  <p className="text-sm text-gray-500 flex items-center">
                    <Mail className="w-4 h-4 mr-2" /> {selectedEnquiry.email}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" /> {new Date(selectedEnquiry.created_at).toLocaleString()}
                  </p>
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-100 mt-4 text-sm text-gray-700 whitespace-pre-wrap text-left">
                    {selectedEnquiry.message}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <Button onClick={() => setSelectedEnquiry(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};