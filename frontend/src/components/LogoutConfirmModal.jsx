import React from 'react';

export default function LogoutConfirmModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      {/* Modal Container - Matches Admin Exact Specs */}
      <div className="bg-white rounded max-w-sm w-full p-8 shadow-2xl relative">
        {/* Close Icon (SVG replacement for Lucide X) */}
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-300 hover:text-gray-900 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div className="flex flex-col items-center text-center">
          {/* Icon Container - Matches Admin red-50 background */}
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-red-50 text-red-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          
          {/* Title - Matches Admin exact typography */}
          <h3 className="font-serif text-xl font-bold text-gray-900 mb-2 uppercase">Confirm Logout</h3>
          
          {/* Description - Matches Admin exact font and leading */}
          <p className="text-sm text-gray-500 font-sans leading-relaxed mb-4">
            Are you sure you want to log out? You will need to sign in again to access your account.
          </p>
          
          {/* Action Buttons - Matches Admin gap and styling */}
          <div className="flex gap-3 w-full">
            <button 
              onClick={onConfirm}
              className="flex-1 py-3 rounded bg-red-600 text-white text-[10px] tracking-widest uppercase font-bold transition-all shadow-lg shadow-red-100 hover:bg-red-700"
            >
              Confirm
            </button>
            <button 
              onClick={onCancel}
              className="flex-1 py-3 rounded bg-gray-100 text-gray-900 text-[10px] tracking-widest uppercase font-bold hover:bg-gray-200 transition-all border border-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
