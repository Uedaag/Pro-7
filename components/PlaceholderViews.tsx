
import React from 'react';
import { Users, Video, Plus } from 'lucide-react';

// Helper for "Under Construction" / Simple List
const SectionPlaceholder: React.FC<{ title: string; description: string; icon: React.ElementType }> = ({ title, description, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-[#0f172a]/30">
    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-6">
      <Icon size={40} />
    </div>
    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{title}</h2>
    <p className="text-slate-500 dark:text-slate-400 max-w-md">{description}</p>
    <div className="mt-8 px-4 py-2 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-500 text-xs font-bold rounded-full uppercase tracking-wider border border-amber-200 dark:border-amber-700/30">
      Módulo em Desenvolvimento
    </div>
  </div>
);

export const VideosView: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Biblioteca de Vídeos</h2>
        <p className="text-slate-500 dark:text-slate-400">Material audiovisual de apoio para aulas.</p>
      </div>
      <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2">
        <Plus size={16} /> Adicionar Vídeo
      </button>
    </div>
    
    <SectionPlaceholder 
      title="Galeria de Mídia"
      description="Integração com YouTube e upload de arquivos para curadoria de conteúdo."
      icon={Video} 
    />
  </div>
);
