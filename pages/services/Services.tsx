
import React, { useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { 
  Plus, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

import { SortableRow } from './SortableRow';
import { ENDPOINTS } from '@/constants';
import { apiRequest } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Pagination, Service, ServiceListResponse, SingleServiceResponse } from '@/types';


interface ServicesProps {
  token: string;
}

export const Services: React.FC<ServicesProps> = ({ token }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingGuid, setEditingGuid] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('0');
  const [orderBy, setOrderBy] = useState<number>(1);
  
  // Setup Dnd Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchServices = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const url = `${ENDPOINTS.SERVICES.LIST}?page=${page}`;
      const res = (await apiRequest(
        url,
        "GET",
        null,
        token
      )) as {
        status: boolean;
        data: ServiceListResponse;
      };

      if (res.status && res.data && Array.isArray(res.data.services)) {
        // We filter for status 1 and sort if needed, 
        // though typically the API should handle filtering and ordering
        const active = res.data.services
          .filter((service) => service.status === 1)
          .sort((a, b) => a.order_by - b.order_by);

        setServices(active);

        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      } else {
        setServices([]);
      }
    } catch (error) {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (view === 'list') {
      fetchServices(currentPage);
    }
  }, [view, currentPage, fetchServices]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && pagination && newPage <= pagination.total_pages) {
      setCurrentPage(newPage);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('0');
    setOrderBy(1);
    setEditingGuid(null);
  };

  const handleEditClick = async (guid: string) => {
    setLoading(true);
    try {
      const res = (await apiRequest(
        ENDPOINTS.SERVICES.GET_BY_ID(guid),
        "GET",
        null,
        token
      )) as {
        status: boolean;
        data: SingleServiceResponse;
      };
      if (res.status && res.data && res.data.service) {
        const s = res.data.service;
        setEditingGuid(s.guid);
        setTitle(s.title);
        setDescription(s.description);
        setPrice(s.price.toString());
        setOrderBy(s.order_by);
        setView('edit');
      }
    } catch (err) {
      toast.error("Could not fetch service details");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (guid: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will deactivate or delete the service.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const res = await apiRequest(
            ENDPOINTS.SERVICES.Delete(guid),
            "POST",
            null,
            token
          );

          if (res.status) {
            Swal.fire("Deleted!", "Service has been deleted.", "success");
            fetchServices(currentPage);
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
    setLoading(true);

    const body = {
      title,
      description,
      price,
      order_by: orderBy
    };

    if (view === 'create') {
      const maxOrder = services.length > 0 
        ? Math.max(...services.map(s => s.order_by)) 
        : 0;
      body.order_by = maxOrder + 1;
    }

    try {
      const endpoint = view === 'create'
        ? ENDPOINTS.SERVICES.CREATE
        : ENDPOINTS.SERVICES.UPDATE(editingGuid!);

      const res = await apiRequest(endpoint, 'POST', body, token);
      if (res.status) {
        toast.success(view === 'create' ? "Service created successfully" : "Service updated successfully");
        resetForm();
        setView('list');
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = services.findIndex((item) => item.guid === active.id);
      const newIndex = services.findIndex((item) => item.guid === over?.id);
      
      const newOrder = arrayMove(services, oldIndex, newIndex);
      
      const updatedList = newOrder.map((item : any, index) => ({
        ...item,
        order_by: (currentPage - 1) * (pagination?.per_page || 10) + (index + 1)
      }));

      setServices(updatedList);
      updateOrderOnServer(updatedList);
    }
  };

  const updateOrderOnServer = async (sortedList: Service[]) => {
    const promises = sortedList.map((s) => {
      const body = {
        title: s.title,
        description: s.description,
        price: s.price,
        order_by: s.order_by
      };
      return apiRequest(ENDPOINTS.SERVICES.UPDATE(s.guid), 'POST', body, token);
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
      <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
        <div className="mb-8">
          <button 
            onClick={() => setView('list')} 
            className="flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to List
          </button>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {view === 'create' ? 'Add New Service' : 'Edit Service'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Service Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                required 
                placeholder="e.g. Premium Business Card Design"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none shadow-sm" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={price} 
                  onChange={e => setPrice(e.target.value)} 
                  required 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none shadow-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sort Order</label>
                <input 
                  type="number" 
                  value={orderBy} 
                  onChange={e => setOrderBy(parseInt(e.target.value))} 
                  required 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none shadow-sm" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                required 
                rows={5} 
                placeholder="Provide detailed information about this service..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none shadow-sm" 
              />
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button type="button" variant="secondary" onClick={() => setView('list')}>Cancel</Button>
              <Button type="submit" isLoading={loading}>
                {view === 'create' ? 'Create Service' : 'Update Service'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <Toaster position="top-right" />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Service Discovery Inventory</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your product offerings. Drag the handle to reorder items.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => fetchServices(currentPage)} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={() => { resetForm(); setView('create'); }}>
            <Plus className="w-4 h-4 mr-2" /> Add New Service
          </Button>
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-12">
                    {/* Sort Handle */}
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Service Detail</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Order</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <SortableContext 
                  items={services.map(s => s.guid)}
                  strategy={verticalListSortingStrategy}
                >
                  {services.map((service) => (
                    <SortableRow
                      key={service.guid} 
                      service={service} 
                      onEdit={handleEditClick} 
                      onDelete={handleDeleteClick} 
                    />
                  ))}
                </SortableContext>
              
                {!loading && services.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <div className="bg-gray-50 p-4 rounded-full mb-4">
                          <Plus className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium text-lg">No services found.</p>
                        <button 
                          onClick={() => setView('create')}
                          className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
                        >
                          Create your first service
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                
                {loading && services.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
                        <p className="text-sm font-medium text-gray-500">Retrieving secure service data...</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DndContext>

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
                {/* <p className="text-sm text-gray-500 font-medium">
                  Showing <span className="text-gray-900">{((currentPage - 1) * pagination.per_page) + 1}</span> to{' '}
                  <span className="text-gray-900">{Math.min(currentPage * pagination.per_page, pagination.total)}</span> of{' '}
                  <span className="text-gray-900">{pagination.total}</span> entries
                </p> */}
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
      </div>

      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-indigo-800">Quick Tip</h3>
            <div className="mt-1 text-sm text-indigo-700">
              <p>Reorder items within the current page by dragging the handle. Changes are automatically saved. For larger jumps, edit the Sort Order manually.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
