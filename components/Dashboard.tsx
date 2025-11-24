
import React from 'react';
import { 
  Clock, 
  Calendar as CalendarIcon,
  BookOpen,
  MapPin,
  Plus,
  FileText,
  Download,
  Edit3,
  ChevronRight,
  Users,
  Briefcase,
  FolderOpen,
  Coffee,
  AlertCircle
} from 'lucide-react';
import { User, View } from '../types';
import { useData } from '../contexts/DataContext';

interface DashboardProps {
  user: User;
  onNavigate: (view: View) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const { events } = useData();

  // 1. Data de Hoje para Filtros
  const now = new Date();
  const todayFormatted = now.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const todayDisplay = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  // 2. Filtragem de Dados (Lógica de Sincronização E USUÁRIO)
  const myEvents = events.filter(evt => evt.userId === user.id);

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  // Filtra eventos de HOJE baseados no contexto global DO USUÁRIO
  const todaysEvents = myEvents.filter(evt => isSameDay(new Date(evt.start), now));
  
  // Ordenar por horário
  todaysEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // SEPARAÇÃO CRÍTICA:
  // Card 1: Aulas (type === 'aula')
  const todaysClasses = todaysEvents.filter(evt => evt.type === 'aula');
  
  // Card 3: Agenda Rápida (Qualquer coisa que NÃO seja aula)
  // Isso garante que reuniões, provas, atividades e projetos apareçam aqui.
  const todaysAgenda = todaysEvents.filter(evt => evt.type !== 'aula');

  // Lógica para o Plano de Aula: Pega a primeira aula do dia como destaque
  const currentLesson = todaysClasses.length > 0 ? todaysClasses[0] : null;

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-12">
      
      {/* 1. CABEÇALHO SUPERIOR */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-[#E8E8E8] dark:border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] dark:text-white tracking-tight">
            Olá, Professor(a) {user.name.split(' ')[0]}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg font-medium">
            {todayDisplay}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-3 px-5 py-2.5 bg-white dark:bg-white/5 border border-[#E8E8E8] dark:border-white/10 rounded-full hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-sm"
          >
            <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-700 dark:text-cyan-400 font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-[#1A1A1A] dark:text-white font-medium text-sm">Meu Perfil</span>
            <ChevronRight size={16} className="text-slate-400" />
          </button>
        </div>
      </header>

      {/* 2. GRID PRINCIPAL (3 CARDS SINCRONIZADOS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        
        {/* CARD 1: AULAS DE HOJE (Sincronizado) */}
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-[#E8E8E8] dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-[#E8E8E8] dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
            <h2 className="text-lg font-bold text-[#1A1A1A] dark:text-white flex items-center gap-2">
              <Clock className="text-cyan-600" size={20} />
              Aulas de Hoje
            </h2>
            <span className="text-xs font-bold bg-cyan-100 text-cyan-700 px-2 py-1 rounded-md">{todaysClasses.length} Aulas</span>
          </div>
          
          <div className="p-6 flex-1 flex flex-col gap-4">
            {todaysClasses.length > 0 ? (
              todaysClasses.map((aula) => (
                <div key={aula.id} className="flex items-start gap-4 p-4 rounded-xl border border-[#E8E8E8] dark:border-white/5 hover:border-cyan-300 dark:hover:border-cyan-700/50 transition-colors group bg-white dark:bg-transparent">
                  <div className="flex flex-col items-center justify-center min-w-[3.5rem] py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <span className="text-sm font-bold text-[#1A1A1A] dark:text-white">
                      {new Date(aula.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[#1A1A1A] dark:text-white">{aula.className || 'Sem Turma'}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Aula</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-1 mb-1">{aula.title}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <MapPin size={12} /> {aula.description ? 'Ver plano' : 'Sala 1'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <Coffee size={32} strokeWidth={1.5} />
                <span className="text-sm">Sem aulas para hoje.</span>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-[#E8E8E8] dark:border-white/5">
            <button 
              onClick={() => onNavigate('classes')}
              className="w-full py-3 text-sm font-bold text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-xl transition-colors"
            >
              Ver grade completa
            </button>
          </div>
        </div>

        {/* CARD 2: PLANO DE AULA DO DIA */}
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-[#E8E8E8] dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-[#E8E8E8] dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
            <h2 className="text-lg font-bold text-[#1A1A1A] dark:text-white flex items-center gap-2">
              <BookOpen className="text-purple-600" size={20} />
              Plano do Dia
            </h2>
          </div>

          <div className="p-6 flex-1 space-y-5">
            {currentLesson ? (
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-white leading-tight mb-3">
                  {currentLesson.title}
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Conteúdo Principal</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {currentLesson.description || "Descrição não informada na agenda."}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Turma Vinculada</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                       {currentLesson.className || "Geral"}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-500/10 mt-2">
                     <p className="text-xs text-purple-700 dark:text-purple-300 font-medium flex items-center gap-2">
                       <FileText size={14} /> Sincronizado com a Agenda.
                     </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
                <span className="text-sm">Nenhuma aula registrada para hoje.</span>
                <span className="text-xs mt-1">Adicione uma aula na agenda para gerar o plano.</span>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-[#E8E8E8] dark:border-white/5 grid grid-cols-3 gap-2">
            <button className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors">
              <FileText size={18} />
              <span className="text-[10px] font-bold">Ler</span>
            </button>
            <button onClick={() => onNavigate('lesson-plans')} className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors">
              <Edit3 size={18} />
              <span className="text-[10px] font-bold">Editar</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors">
              <Download size={18} />
              <span className="text-[10px] font-bold">Baixar</span>
            </button>
          </div>
        </div>

        {/* CARD 3: AGENDA RÁPIDA (Sincronizado - Não Aulas) */}
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-[#E8E8E8] dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-[#E8E8E8] dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
            <h2 className="text-lg font-bold text-[#1A1A1A] dark:text-white flex items-center gap-2">
              <CalendarIcon className="text-amber-500" size={20} />
              Agenda Rápida
            </h2>
            <button 
              onClick={() => onNavigate('agenda')}
              className="text-xs font-bold text-cyan-600 hover:text-cyan-700"
            >
              + Adicionar
            </button>
          </div>

          <div className="p-6 flex-1 flex flex-col gap-3">
             {todaysAgenda.length > 0 ? (
               todaysAgenda.map((item) => (
                 <div key={item.id} className="flex items-start gap-3 pb-3 border-b border-[#E8E8E8] dark:border-white/5 last:border-0 last:pb-0">
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.type === 'prova' ? 'bg-red-500' : item.type === 'reuniao' ? 'bg-orange-500' : 'bg-slate-300'}`}></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-[#1A1A1A] dark:text-white leading-tight">{item.title}</h4>
                      <span className={`text-xs font-medium mt-0.5 block text-slate-500`}>
                        {new Date(item.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • <span className="capitalize">{item.type}</span>
                      </span>
                    </div>
                    {item.type === 'prova' && <AlertCircle size={14} className="text-red-400" />}
                 </div>
               ))
             ) : (
               <div className="mt-auto pt-4 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs italic h-full">
                  <CalendarIcon size={24} />
                  <span>Nenhum compromisso extra hoje.</span>
                  <span className="text-[10px]">Aulas aparecem no Card 1.</span>
               </div>
             )}
          </div>

          <div className="p-4 border-t border-[#E8E8E8] dark:border-white/5">
            <button 
              onClick={() => onNavigate('agenda')}
              className="w-full py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Ver agenda completa <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. ATALHOS RÁPIDOS */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Acesso Rápido</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          
          <button 
             onClick={() => onNavigate('lesson-plans')}
             className="bg-cyan-600 hover:bg-cyan-500 text-white p-5 rounded-xl shadow-lg shadow-cyan-500/20 flex flex-col items-start gap-3 transition-transform hover:-translate-y-1 group"
          >
            <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
              <Plus size={20} strokeWidth={3} />
            </div>
            <span className="font-bold text-sm text-left">Criar Plano<br/>de Aula</span>
          </button>

          <button 
             onClick={() => onNavigate('classes')}
             className="bg-purple-600 hover:bg-purple-500 text-white p-5 rounded-xl shadow-lg shadow-purple-500/20 flex flex-col items-start gap-3 transition-transform hover:-translate-y-1 group"
          >
            <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
              <FileText size={20} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm text-left">Criar<br/>Atividade</span>
          </button>

          <button 
             onClick={() => onNavigate('agenda')}
             className="bg-emerald-600 hover:bg-emerald-500 text-white p-5 rounded-xl shadow-lg shadow-emerald-500/20 flex flex-col items-start gap-3 transition-transform hover:-translate-y-1 group"
          >
            <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
              <Briefcase size={20} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm text-left">Adicionar<br/>Compromisso</span>
          </button>

          <button className="bg-white dark:bg-[#0f172a] hover:border-cyan-500 border border-[#E8E8E8] dark:border-white/10 p-5 rounded-xl shadow-sm hover:shadow-md flex flex-col items-start gap-3 transition-all group">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 group-hover:text-cyan-600 group-hover:bg-cyan-50 transition-colors">
              <FolderOpen size={20} />
            </div>
            <span className="font-bold text-sm text-[#1A1A1A] dark:text-white text-left">Materiais<br/>Salvos</span>
          </button>

          <button 
            onClick={() => onNavigate('classes')}
            className="bg-white dark:bg-[#0f172a] hover:border-purple-500 border border-[#E8E8E8] dark:border-white/10 p-5 rounded-xl shadow-sm hover:shadow-md flex flex-col items-start gap-3 transition-all group"
          >
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 group-hover:text-purple-600 group-hover:bg-purple-50 transition-colors">
              <Users size={20} />
            </div>
            <span className="font-bold text-sm text-[#1A1A1A] dark:text-white text-left">Acessar<br/>Turmas</span>
          </button>

        </div>
      </div>

    </div>
  );
};
