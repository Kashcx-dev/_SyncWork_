import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 transition-all duration-300">
            <div className="bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 w-full max-w-lg shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-neutral-800 mb-5">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div>
                    {children}
                </div>
            </div>
        </div>
    );
}
