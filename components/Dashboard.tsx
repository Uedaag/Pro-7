
import React from 'react';
import { Clock, Calendar as CalendarIcon, BookOpen, ChevronRight, Plus, FileText, Briefcase, Users, FolderOpen } from 'lucide-react';
import { User, View } from '../types';
import { useData } from '../contexts/DataContext';

export const Dashboard: React.FC<{ user: User; onNavigate: (view: View) => void }> = ({ user, onNavigate }) => {
  const { events } = useData();
  const now = new Date();
  
  const todaysEvents = events
    .filter(evt => {
        const d = new Date(evt.start);
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const todaysClasses = todaysEvents.filter(evt => evt.type === 'aula');
  const todaysAgenda = todaysEvents.filter(evt => evt.type !== 'aula');

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-slate-200 dark:border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Olá, {user.name}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg capitalize">
            {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button 
          onClick={() => onNavigate('profile')} 
          className="flex items-center gap-3 px-5 py-2.5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-full hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-sm"
        >
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.name} 
                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-white/10" 
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">
                {user.name.charAt(0)}
              </div>
            )}
            <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Meu Perfil</span>
            <ChevronRight size={16} className="text-slate-400"/>
        </button>
      </header>

      {/* Main Grid: 3 Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        
        {/* Card 1: Aulas de Hoje */}
        <div className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col h-full min-h-[300px]">
           <div className="flex justify-between items-center mb-6">
             <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <Clock className="text-cyan-600" size={20}/> Aulas de Hoje
             </h2>
             <span className="px-2 py-1 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 text-xs font-bold rounded-lg">
               {todaysClasses.length} Aulas
             </span>
           </div>
           
           <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
              {todaysClasses.length > 0 ? (
                 <div className="w-full space-y-3">
                    {todaysClasses.slice(0, 3).map(aula => (
                       <div key={aula.id} className="flex items-center gap-4 p-3 border border-slate-100 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-[#020410] text-left">
                          <div className="p-2 bg-white dark:bg-white/5 rounded-lg font-bold text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-white/5 text-xs text-center min-w-[3rem]">
                             {new Date(aula.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                          </div>
                          <div>
                             <p className="font-bold text-slate-800 dark:text-white text-sm">{aula.className}</p>
                             <p className="text-xs text-slate-500">{aula.title}</p>
                          </div>
                       </div>
                    ))}
                    {todaysClasses.length > 3 && (
                      <p className="text-xs text-slate-400 mt-2">+ {todaysClasses.length - 3} outras aulas</p>
                    )}
                 </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-2">
                    <Clock size={32} strokeWidth={1.5} />
                  </div>
                  <p className="text-slate-500 text-sm">Sem aulas para hoje.</p>
                </>
              )}
           </div>

           <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
              <button onClick={() => onNavigate('agenda')} className="w-full text-center text-cyan-600 font-bold text-sm hover:underline">Ver grade completa</button>
           </div>
        </div>

        {/* Card 2: Plano do Dia */}
        <div className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col h-full min-h-[300px]">
           <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
             <BookOpen className="text-purple-600" size={20}/> Plano do Dia
           </h2>
           
           <div className="flex-1 flex flex-col justify-center items-center text-center">
              <div className="max-w-[200px] space-y-2">
                  <p className="text-slate-400 text-sm">
                    {todaysClasses.length > 0 
                      ? "Selecione uma aula na agenda para ver o plano detalhado."
                      : "Nenhuma aula registrada para hoje. Adicione uma aula na agenda para gerar o plano."
                    }
                  </p>
                  <p className="text-slate-300 text-xs italic">
                     Adicione uma aula na agenda para gerar o plano.
                  </p>
              </div>
           </div>

           <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5 grid grid-cols-3 gap-2">
              <button onClick={() => onNavigate('lesson-plans')} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 hover:text-purple-600 transition-colors">
                 <FileText size={18} />
                 <span className="text-[10px] font-bold uppercase">Ler</span>
              </button>
              <button onClick={() => onNavigate('lesson-plans')} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 hover:text-purple-600 transition-colors">
                 <BookOpen size={18} />
                 <span className="text-[10px] font-bold uppercase">Editar</span>
              </button>
              <button disabled className="flex flex-col items-center gap-1 p-2 rounded-lg text-slate-300 cursor-not-allowed">
                 <Clock size={18} />
                 <span className="text-[10px] font-bold uppercase">Baixar</span>
              </button>
           </div>
        </div>

        {/* Card 3: Agenda Rápida */}
        <div className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col h-full min-h-[300px]">
           <div className="flex justify-between items-center mb-6">
             <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <CalendarIcon className="text-amber-500" size={20}/> Agenda Rápida
             </h2>
             <button onClick={() => onNavigate('agenda')} className="text-cyan-600 text-xs font-bold hover:underline">
               + Adicionar
             </button>
           </div>
           
           <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
              {todaysAgenda.length > 0 ? (
                 <div className="w-full space-y-3">
                    {todaysAgenda.slice(0, 3).map(item => (
                       <div key={item.id} className="flex items-center gap-3 p-3 border-b border-slate-100 dark:border-white/5 text-left last:border-0">
                          <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                          <div className="flex-1">
                             <h4 className="font-bold text-slate-800 dark:text-white text-sm">{item.title}</h4>
                             <span className="text-xs text-slate-500">{new Date(item.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                          </div>
                       </div>
                    ))}
                 </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-2">
                    <CalendarIcon size={32} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 text-sm italic">Nenhum compromisso extra hoje.</p>
                    <p className="text-slate-400 text-xs">Aulas aparecem no Card 1.</p>
                  </div>
                </>
              )}
           </div>

           <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
              <button onClick={() => onNavigate('agenda')} className="w-full text-center text-slate-800 dark:text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5 py-2 rounded-lg transition-colors">
                Ver agenda completa <ChevronRight size={16}/>
              </button>
           </div>
        </div>

      </div>

      {/* Acesso Rápido Row */}
      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 pl-1">Acesso Rápido</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        
        <button 
          onClick={() => onNavigate('lesson-plans')}
          className="bg-cyan-600 hover:bg-cyan-500 text-white p-6 rounded-2xl shadow-lg shadow-cyan-500/20 text-left transition-all hover:-translate-y-1 flex flex-col justify-between h-32 group relative overflow-hidden"
        >
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-2 backdrop-blur-sm">
             <Plus size={24} />
          </div>
          <div>
            <span className="block font-bold text-lg">Criar Plano</span>
            <span className="block text-cyan-100 text-xs">de Aula</span>
          </div>
          <BookOpen className="absolute -bottom-4 -right-4 text-white/10 w-24 h-24 group-hover:scale-110 transition-transform" />
        </button>

        <button 
          onClick={() => onNavigate('activity-generator')}
          className="bg-purple-600 hover:bg-purple-500 text-white p-6 rounded-2xl shadow-lg shadow-purple-500/20 text-left transition-all hover:-translate-y-1 flex flex-col justify-between h-32 group relative overflow-hidden"
        >
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-2 backdrop-blur-sm">
             <FileText size={24} />
          </div>
          <div>
            <span className="block font-bold text-lg">Criar</span>
            <span className="block text-purple-100 text-xs">Atividade</span>
          </div>
          <FileText className="absolute -bottom-4 -right-4 text-white/10 w-24 h-24 group-hover:scale-110 transition-transform" />
        </button>

        <button 
          onClick={() => onNavigate('agenda')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white p-6 rounded-2xl shadow-lg shadow-emerald-500/20 text-left transition-all hover:-translate-y-1 flex flex-col justify-between h-32 group relative overflow-hidden"
        >
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-2 backdrop-blur-sm">
             <Briefcase size={24} />
          </div>
          <div>
            <span className="block font-bold text-lg">Adicionar</span>
            <span className="block text-emerald-100 text-xs">Compromisso</span>
          </div>
          <CalendarIcon className="absolute -bottom-4 -right-4 text-white/10 w-24 h-24 group-hover:scale-110 transition-transform" />
        </button>

        <button 
          onClick={() => onNavigate('classes')} 
          className="bg-white dark:bg-[#0f172a] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 p-6 rounded-2xl text-left transition-all hover:-translate-y-1 flex flex-col justify-between h-32 group"
        >
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mb-2 text-slate-500 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-white/10 transition-colors">
             <FolderOpen size={24} />
          </div>
          <div>
            <span className="block font-bold text-lg text-slate-800 dark:text-white">Materiais</span>
            <span className="block text-slate-500 text-xs">Salvos</span>
          </div>
        </button>

        <button 
           onClick={() => onNavigate('classes')}
           className="bg-white dark:bg-[#0f172a] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 p-6 rounded-2xl text-left transition-all hover:-translate-y-1 flex flex-col justify-between h-32 group"
        >
           <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mb-2 text-slate-500 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-white/10 transition-colors">
              <Users size={24} />
           </div>
           <div>
             <span className="block font-bold text-lg text-slate-800 dark:text-white">Acessar</span>
             <span className="block text-slate-500 text-xs">Turmas</span>
           </div>
        </button>

      </div>
    </div>
  );
};
