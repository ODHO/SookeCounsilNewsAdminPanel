import React, { useState } from 'react';
import { Lock, KeyRound } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { apiRequest } from '@/services/api';
import { ENDPOINTS } from '@/constants';
import { Button } from '@/components/ui/Button';


interface ChangePasswordProps {
  token: string;
}

export const ChangePassword: React.FC<ChangePasswordProps> = ({ token }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    if (newPassword.length < 4) {
       toast.error("Password must be at least 4 characters");
       return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append('old_password', oldPassword);
    formData.append('password', newPassword);
    formData.append('password_confirmation', confirmPassword);

    console.log('====================================');
    console.log(formData);
    console.log('====================================');
    try {
      const res = await apiRequest(ENDPOINTS.CHANGEPASSWORD, 'POST', formData, token, true);
      
      if (res.status) {
        toast.success(res.message || "Password changed successfully");
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(res.message || "Failed to change password");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <Toaster position="top-right" />
      <div className="bg-white shadow-lg rounded-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center">
            <Lock className="w-5 h-5 mr-2 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-800">Change Password</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Old Password</label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <KeyRound size={16} />
                </span>
                <input 
                    type="password" 
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    className="block w-full rounded-md border border-gray-300 pl-10 p-2.5 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter current password"
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                </span>
                <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="block w-full rounded-md border border-gray-300 pl-10 p-2.5 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter new password"
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
             <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                </span>
                <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="block w-full rounded-md border border-gray-300 pl-10 p-2.5 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Confirm new password"
                />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" isLoading={loading} className="w-full justify-center">
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
