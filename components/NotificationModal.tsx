import React from 'react';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface NotificationModalProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ message, type, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle size={32} />;
      case 'error': return <AlertTriangle size={32} />;
      case 'warning': return <AlertTriangle size={32} />;
      default: return <Info size={32} />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-500';
      case 'error': return 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-500';
      case 'warning': return 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-500';
      default: return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-500';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'success': return 'Sucesso';
      case 'error': return 'Erro';
      case 'warning': return 'Atenção';
      default: return 'Informação';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0f172a] w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-scale-in border border-slate-200 dark:border-white/10 relative">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${getColors()}`}>
          {getIcon()}
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{getTitle()}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          {message}
        </p>
        <button 
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold transition-colors"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};