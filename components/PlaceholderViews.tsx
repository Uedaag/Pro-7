import React, { useState } from 'react';
import { BookOpen, Video, Calendar, Users, FileText, ClipboardList, GraduationCap, FolderKanban, Plus, MoreVertical, Clock, CheckCircle2 } from 'lucide-react';

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

export const ProfileView: React.FC = () => (
  <SectionPlaceholder
    title="Perfil do Professor"
    description="Gerencie suas credenciais, especializações e preferências de sistema."
    icon={Users}
  />
);

export const AgendaView: React.FC = () => (
  <SectionPlaceholder
    title="Agenda Escolar"
    description="Visualize reuniões, conselhos de classe e prazos administrativos."
    icon={Calendar}
  />
);

export const LessonPlansView: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Planos de Aula Bimestrais</h2>
        <p className="text-slate-500 dark:text-slate-400">Organização macro do conteúdo curricular.</p>
      </div>
      <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2">
        <Plus size={16} /> Novo Plano
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       {[1, 2, 3, 4].map((bimestre) => (
         <div key={bimestre} className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-cyan-500/30 transition-all group cursor-pointer shadow-sm">
           <div className="flex items-center justify-between mb-4">
             <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
               <BookOpen size={20} />
             </div>
             <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{bimestre}º Bimestre</span>
           </div>
           <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">História Geral</h3>
           <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2">
             Conteúdo programático focado na Era Vargas e Segunda Guerra Mundial. Objetivos de aprendizagem alinhados à BNCC.
           </p>
           <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
             <div className="bg-purple-500 h-full w-3/4"></div>
           </div>
           <div className="mt-2 text-xs text-slate-400 text-right">75% Concluído</div>
         </div>
       ))}
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

export const ClassesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'aulas' | 'avaliacoes' | 'atividades' | 'projetos'>('aulas');

  const tabs = [
    { id: 'aulas', label: 'Aulas', icon: BookOpen },
    { id: 'avaliacoes', label: 'Avaliações', icon: GraduationCap },
    { id: 'atividades', label: 'Atividades', icon: FileText },
    { id: 'projetos', label: 'Projetos', icon: FolderKanban },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gestão de Turmas</h2>
          <p className="text-slate-500 dark:text-slate-400">9º Ano A - Matutino</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
            <Users size={20} />
          </button>
          <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2">
            <Plus size={16} /> Novo Registro
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-white/5 scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-t-lg text-sm font-bold transition-all relative whitespace-nowrap
                ${isActive 
                  ? 'text-cyan-600 dark:text-cyan-400 bg-white dark:bg-[#0f172a] border-x border-t border-slate-200 dark:border-slate-800' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5'
                }
              `}
            >
              <tab.icon size={16} />
              {tab.label}
              {isActive && (
                <div className="absolute bottom-[-1px] left-0 w-full h-[1px] bg-white dark:bg-[#0f172a]"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-[#0f172a] rounded-b-2xl rounded-tr-2xl border border-slate-200 dark:border-white/5 shadow-sm min-h-[400px] p-6">
        
        {/* Placeholder Lists based on Tab */}
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#020410]/50 rounded-xl border border-slate-100 dark:border-white/5 group hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${activeTab === 'avaliacoes' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                    activeTab === 'projetos' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' :
                    'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400'}
                `}>
                  {activeTab === 'avaliacoes' ? <GraduationCap size={20} /> :
                   activeTab === 'projetos' ? <FolderKanban size={20} /> :
                   <FileText size={20} />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                    {activeTab === 'aulas' && `Aula ${item}: Introdução ao Tema`}
                    {activeTab === 'avaliacoes' && `Prova Mensal ${item}`}
                    {activeTab === 'atividades' && `Lista de Exercícios ${item}`}
                    {activeTab === 'projetos' && `Projeto Bimestral - Etapa ${item}`}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                    <Clock size={12} />
                    {activeTab === 'projetos' ? 'Entrega em 15 dias' : 'Realizado em 12/05'}
                  </p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>
          ))}
          
          <div className="pt-4 text-center">
            <button className="text-sm text-slate-400 hover:text-cyan-500 transition-colors font-medium">
              Ver histórico completo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};