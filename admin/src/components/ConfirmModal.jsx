import React from 'react';
import { X, AlertCircle } from 'lucide-react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, type = 'danger', showInput = false, inputPlaceholder = "Enter reason...", inputValue = "", onInputChange = () => {} }) {
  if (!isOpen) return null;

  const btnClass = type === 'danger' 
    ? 'bg-red-600 hover:bg-red-700 shadow-red-100' 
    : 'bg-gold-600 hover:bg-gold-700 shadow-gold-100';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded max-w-sm w-full p-8 shadow-2xl relative animate-scale-in">
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-300 hover:text-charcoal transition-colors">
          <X size={20} />
        </button>
        
        <div className="flex flex-col items-center text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-gold-50 text-gold-600'}`}>
            <AlertCircle size={24} />
          </div>
          
          <h3 className="font-serif text-xl font-bold text-charcoal mb-2">{title || 'Are you sure?'}</h3>
          <p className="text-sm text-gray-500 font-sans leading-relaxed mb-4">
            {message || 'This action cannot be undone. Please confirm to proceed.'}
          </p>

          {showInput && (
            <div className="w-full mb-6">
              <textarea 
                className="w-full border border-gray-200 rounded-sm p-3 text-xs font-sans outline-none focus:border-gold-500 min-h-[80px] resize-none pb-2 mb-0"
                placeholder={inputPlaceholder}
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
              />
              <p className="text-[9px] text-gray-400 mt-1 italic text-left">* Reason will be visible to the customer</p>
            </div>
          )}
          
          <div className="flex gap-3 w-full">
            <button 
              onClick={onConfirm}
              className={`flex-1 py-3 rounded text-white text-[10px] tracking-widest uppercase font-bold transition-all shadow-lg ${btnClass}`}
            >
              Confirm
            </button>
            <button 
              onClick={onCancel}
              className="flex-1 py-3 rounded bg-gray-100 text-charcoal text-[10px] tracking-widest uppercase font-bold hover:bg-gray-200 transition-all border border-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
