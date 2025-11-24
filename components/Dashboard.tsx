
import React from 'react';
import { Clock, Calendar as CalendarIcon, BookOpen, MapPin, ChevronRight, Briefcase } from 'lucide-react';
import { User, View } from '../types';
import { useData } from '../contexts/DataContext';

export const Dashboard: React.FC<{ user: User; onNavigate: (view: View) => void }> = ({ user, onNavigate }) => {
  const { events } = useData();
  const now = new Date();
  
  // Filtrar eventos do dia para o usuário logado (DataContext já filtra por userId no fetch, mas reforçamos)
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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Olá, {user.name.split(' ')[0]}</h1>
          <p className="text-slate-500 text-lg">{now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button onClick={() => onNavigate('profile')} className="flex items-center gap-3 px-5 py-2.5 bg-white border rounded-full hover:bg-slate-50">
            <span className="font-bold text-sm">Meu Perfil</span><ChevronRight size={16}/>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Aulas */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
           <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Clock className="text-cyan-600"/> Aulas de Hoje</h2>
           <div className="space-y-4">
              {todaysClasses.length > 0 ? todaysClasses.map(aula => (
                 <div key={aula.id} className="flex gap-4 p-3 border rounded-xl">
                    <span className="font-bold">{new Date(aula.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    <div><p className="font-bold">{aula.className}</p><p className="text-sm text-slate-500">{aula.title}</p></div>
                 </div>
              )) : <p className="text-slate-400 text-center py-8">Sem aulas hoje.</p>}
           </div>
        </div>

        {/* Agenda */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
           <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><CalendarIcon className="text-amber-500"/> Compromissos</h2>
           <div className="space-y-4">
              {todaysAgenda.length > 0 ? todaysAgenda.map(item => (
                 <div key={item.id} className="flex gap-3 border-b pb-2">
                    <div className="w-2 h-2 rounded-full bg-slate-300 mt-2"></div>
                    <div><h4 className="font-bold text-sm">{item.title}</h4><span className="text-xs text-slate-500">{new Date(item.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>
                 </div>
              )) : <p className="text-slate-400 text-center py-8">Agenda livre.</p>}
           </div>
        </div>
        
        {/* Atalhos */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
           <h2 className="text-lg font-bold mb-4">Acesso Rápido</h2>
           <div className="grid grid-cols-2 gap-4">
              <button onClick={() => onNavigate('agenda')} className="p-4 bg-emerald-50 text-emerald-700 rounded-xl font-bold flex flex-col gap-2"><Briefcase/> Agenda</button>
              <button onClick={() => onNavigate('lesson-plans')} className="p-4 bg-cyan-50 text-cyan-700 rounded-xl font-bold flex flex-col gap-2"><BookOpen/> Planos</button>
           </div>
        </div>
      </div>
    </div>
  );
};
