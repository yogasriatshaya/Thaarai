import React from 'react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-xl transform transition-all animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title || 'Confirm Action'}</h3>
        <p className="text-sm text-gray-500 mb-6">{message || 'Are you sure you want to proceed?'}</p>
        
        <div className="flex gap-3">
          <button 
            onClick={onConfirm}
            className="flex-1 bg-black text-white py-2.5 rounded text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Confirm
          </button>
          <button 
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
