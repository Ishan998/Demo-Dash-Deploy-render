import React, { useState } from 'react';
import type { User } from '../types';

interface MyAccountTabProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onResetPassword?: () => void;
}

const MyAccountTab: React.FC<MyAccountTabProps> = ({
  user,
  onUpdateUser,
  onResetPassword,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);

  // Keep form in sync when user prop changes (e.g., after login/profile fetch)
  React.useEffect(() => {
    setFormData(user);
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(formData);
    setIsEditing(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">My Account Details</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" name="fullName" value={formData.fullName || ''} onChange={handleInputChange} disabled={!isEditing} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D4AF37] focus:ring-[#D4AF37] sm:text-sm disabled:bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} disabled={!isEditing} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D4AF37] focus:ring-[#D4AF37] sm:text-sm disabled:bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} disabled={!isEditing} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D4AF37] focus:ring-[#D4AF37] sm:text-sm disabled:bg-gray-100" />
          </div>
        </div>
        <div className="mt-6">
          {isEditing ? (
            <div className="flex space-x-4">
              <button type="submit" className="bg-black text-white font-bold py-2 px-6 rounded-md hover:bg-gray-800">Save Changes</button>
              <button type="button" onClick={() => { setIsEditing(false); setFormData(user); }} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-md hover:bg-gray-300">Cancel</button>
            </div>
          ) : (
            <button type="button" onClick={() => setIsEditing(true)} className="bg-[#D4AF37] text-white font-bold py-2 px-6 rounded-md hover:opacity-90">Edit Profile</button>
          )}
        </div>
      </form>

      <div className="mt-10 pt-6 border-t">
        <h3 className="text-xl font-semibold mb-4">Password</h3>
        <p className="text-sm text-gray-600 mb-4">You can reset your password if you've forgotten it.</p>
        <button
          type="button"
          onClick={onResetPassword}
        className="bg-red-50 text-red-700 font-bold py-2 px-6 rounded-md hover:bg-red-100"
        >
          Reset Password
        </button>
      </div>
    </div>
  );
};

export default MyAccountTab;
