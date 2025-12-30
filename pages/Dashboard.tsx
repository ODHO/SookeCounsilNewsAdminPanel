import React from 'react';
import { User } from '../types';

interface DashboardProps {
  user: User | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h2>
        <p className="text-gray-600">
          Manage your products, categories, blogs, and testimonials from this admin panel. 
          Use the sidebar to navigate to different sections.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
           <h3 className="text-lg font-semibold text-gray-700 mb-2">Products</h3>
           <p className="text-gray-500 text-sm">Manage your book inventory, pricing, and images.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
           <h3 className="text-lg font-semibold text-gray-700 mb-2">Categories</h3>
           <p className="text-gray-500 text-sm">Organize your products into logical categories.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
           <h3 className="text-lg font-semibold text-gray-700 mb-2">Blogs</h3>
           <p className="text-gray-500 text-sm">Share news and updates with your audience.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
           <h3 className="text-lg font-semibold text-gray-700 mb-2">Testimonials</h3>
           <p className="text-gray-500 text-sm">Curate user feedback and ratings.</p>
        </div>
      </div>
    </div>
  );
};