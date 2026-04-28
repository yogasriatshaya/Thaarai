import React, { useState, useEffect } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import LogoutConfirmModal from '../components/LogoutConfirmModal';
import API from '../api';
import { toast } from 'react-toastify';

export default function Account() {
  const { user, loadingUser, updateUser, logout } = useShop();
  const [showLogout, setShowLogout] = useState(false);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [loading, setLoading] = useState(false);

  // Sync formData when user data arrives
  useEffect(() => {
    if (user) {
      setFormData({ name: user.name || '', phone: user.phone || '' });
    }
  }, [user]);

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
         <div className="animate-pulse text-gray-400 font-bold uppercase tracking-widest">Identifying Session...</div>
      </div>
    );
  }

  // If the user actively logs out or is null after loading, redirect to home.
  if (!user && !loadingUser) {
    return <Navigate to="/" replace />;
  }

  // Calculate initials like the image mock
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const nameParts = user?.name ? user.name.split(' ') : ['User', 'Name'];
  const formattedName = nameParts.length > 1 && nameParts[0].toLowerCase() === 'yogasri' 
    ? 'yogasri Atshaya' 
    : user?.name;

  const handleEditSubmit = async () => {
    if (!formData.name.trim()) return toast.error("Name cannot be empty");
    setLoading(true);
    try {
      const res = await API.put('/users/profile', { name: formData.name, phone: formData.phone });
      if (res.data.success) {
        toast.success("Profile updated successfully");
        updateUser(res.data.user);
        setIsEditing(false);
        setLoading(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-10 md:pt-4">
      {/* Page Title */}
      <div className="px-6 py-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight uppercase">My Account</h1>
      </div>

      {/* Profile Card Background matches #f2f5f7 */}
      <div className="bg-[#f1f4f6] px-6 py-8">
        <div className="flex items-start justify-between w-full">
          
          <div className="flex items-center gap-5 w-full">
            {/* Black Circular Avatar with large initials */}
            <div className="w-[90px] h-[90px] bg-black rounded-full flex items-center justify-center text-white text-3xl font-bold shrink-0 shadow-sm tracking-wide">
              {getInitials(user.name)}
            </div>
            
            {/* Details Column */}
            <div className="flex flex-col gap-0.5 flex-1 p-1">
              {isEditing ? (
                 <div className="space-y-3 w-full pr-4">
                    <input 
                      autoFocus
                      className="w-full px-3 py-2 border border-gray-300 rounded text-[15px] font-bold text-gray-800 outline-none focus:border-black"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Full Name"
                    />
                    <p className="text-[15px] text-gray-500 bg-gray-50 px-3 py-1 border border-gray-100 rounded cursor-not-allowed hidden sm:block">{user.email || 'user@example.com'}</p>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded text-[15px] text-gray-600 outline-none focus:border-black"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="Phone Number"
                    />
                    <div className="flex gap-2">
                       <button onClick={handleEditSubmit} disabled={loading} className="px-6 py-2 bg-black text-white text-sm font-bold tracking-widest uppercase rounded hover:bg-gray-800 disabled:opacity-50">Save</button>
                       <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-bold uppercase rounded hover:bg-gray-50">Cancel</button>
                    </div>
                 </div>
              ) : (
                 <>
                    <h2 className="text-[19px] font-bold text-gray-800">{user.name || formattedName}</h2>
                    <p className="text-[15px] text-gray-600 mt-0.5">{user.email || 'user@example.com'}</p>
                    <p className="text-[15px] text-gray-600">{user.phone || 'No phone number added'}</p>
                 </>
              )}
            </div>
          </div>

          {!isEditing && (
             <button onClick={() => setIsEditing(true)} className="text-[#3182ce] font-bold text-[16px] hover:text-blue-700 transition shrink-0 pt-2">
               Edit
             </button>
          )}
        </div>
      </div>

      {/* Menu List */}
      <div className="bg-white flex flex-col mt-2">
        <Link to="/orders" className="flex items-center justify-between px-6 py-5 border-b border-gray-100 active:bg-gray-50 transition-colors group hover:bg-gray-50">
          <span className="text-[17px] text-gray-800 tracking-wide">Orders</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 group-hover:translate-x-1 transition-transform">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </Link>
        <Link to="/contact" className="flex items-center justify-between px-6 py-5 border-b border-gray-100 active:bg-gray-50 transition-colors group hover:bg-gray-50">
          <span className="text-[17px] text-gray-800 tracking-wide">Customer Care</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 group-hover:translate-x-1 transition-transform">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </Link>
        <button onClick={() => setShowLogout(true)} className="flex items-center justify-between px-6 py-5 border-b border-gray-100 active:bg-gray-50 transition-colors w-full text-left group hover:bg-gray-50">
            <span className="text-[17px] text-red-600 tracking-wide font-bold uppercase text-xs">Sign Out</span>
        </button>
      </div>

      <LogoutConfirmModal 
        isOpen={showLogout} 
        onConfirm={() => {
          logout();
          navigate('/');
        }}
        onCancel={() => setShowLogout(false)}
      />
    </div>
  );
}
