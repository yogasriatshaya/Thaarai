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
  const [formData, setFormData] = useState({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '' });
  const [loading, setLoading] = useState(false);

  // Sync formData when user data arrives
  useEffect(() => {
    if (user) {
      setFormData({ name: user.name || '', phone: user.phone || '', email: user.email || '' });
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

      {/* MOBILE UI: PREVIOUS CONFIGURATION */}
      <div className="md:hidden">
        <div className="bg-[#f1f4f6] px-6 py-8">
          <div className="flex items-start justify-between w-full">
            <div className="flex items-center gap-5 w-full">
              <div className="w-[90px] h-[90px] bg-black rounded-full flex items-center justify-center text-white text-3xl font-bold shrink-0 shadow-sm tracking-wide">
                {getInitials(user.name)}
              </div>
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
                      <input 
                        className="w-full px-3 py-2 border border-gray-300 rounded text-[15px] text-gray-800 outline-none focus:border-black"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        placeholder="Email Address"
                      />
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
      </div>

      {/* DESKTOP UI: PREMIUM CONFIGURATION */}
      <div className="hidden md:block bg-[#f2f5f7] px-6 py-12">
        <div className="max-w-4xl mx-auto flex flex-row items-start gap-8">
          {/* Avatar Section */}
          <div className="relative group">
            <div className="w-32 h-32 bg-black rounded-full flex items-center justify-center text-white text-4xl font-serif font-bold shadow-2xl tracking-widest transition-transform group-hover:scale-105">
              {getInitials(user.name)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
          </div>
          
          {/* Info Section */}
          <div className="flex-1 w-full">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1 text-left">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">Profile Details</h2>
                <div className="h-1 w-12 bg-black mx-0"></div>
              </div>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-black hover:opacity-70 transition group"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:rotate-12 transition-transform"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  Edit Profile
                </button>
              )}
            </div>

            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-white shadow-sm">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                    <input 
                      autoFocus
                      className="w-full bg-white px-4 py-3 border border-gray-200 rounded-xl text-[16px] font-bold text-gray-800 focus:border-black outline-none transition-all shadow-inner"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                    <input 
                      className="w-full bg-white px-4 py-3 border border-gray-200 rounded-xl text-[16px] text-gray-800 focus:border-black outline-none transition-all shadow-inner"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                    <input 
                      className="w-full bg-white px-4 py-3 border border-gray-200 rounded-xl text-[16px] text-gray-800 focus:border-black outline-none transition-all shadow-inner"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-100/50 mt-2">
                    <button onClick={() => setIsEditing(false)} className="px-6 py-3 border border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all">Cancel</button>
                    <button onClick={handleEditSubmit} disabled={loading} className="px-10 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-black/10 disabled:opacity-50">{loading ? 'Saving...' : 'Save Changes'}</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name</p>
                    <p className="text-[17px] font-bold text-gray-800">{user.name || formattedName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</p>
                    <p className="text-[17px] font-medium text-gray-600">{user.email || 'user@example.com'}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</p>
                    <p className="text-[17px] font-medium text-gray-600">{user.phone || 'Not provided'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
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
