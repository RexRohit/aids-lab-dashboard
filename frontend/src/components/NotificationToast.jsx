import React, { useEffect } from 'react';
import { FileSpreadsheet, CheckCircle, X } from 'lucide-react';

export default function NotificationToast({ notification, onClose }) {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-start gap-3 max-w-sm">
        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
          <FileSpreadsheet className="w-5 h-5 animate-pulse" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wide">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Excel Auto-Synced</span>
          </div>
          <p className="text-xs text-slate-200 mt-1 font-medium">
            {notification.message}
          </p>
          <span className="text-[10px] text-slate-400 block mt-1">Dashboard stats updated live</span>
        </div>

        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
