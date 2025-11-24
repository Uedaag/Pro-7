
import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter, 
  Download, 
  MoreVertical,
  X,
  Trash2,
  Save,
  MapPin,
  Clock
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { CalendarEvent, EventType, User } from '../types';

// --- CONFIGURAÇÃO VISUAL ---
const TYPE_COLORS: Record<EventType, { bg: string, text: string, border: string }> = {
  aula: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  prova: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
  reuniao: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  projeto: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  atividade: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  outro: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' },
};

type ViewMode = 'month' | 'week' | 'day';

// --- HELPERS DE DATA LOCAL ---
const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimeForInput = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

interface AgendaViewProps {
  user: User;
}

export const AgendaView: React.FC<AgendaViewProps> = ({ user }) => {
  const { events, addEvent, updateEvent, deleteEvent } = useData();
  
  // Estados da View
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedType, setSelectedType] = useState<EventType | 'all'>('all');
  
  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);

  // --- NAVEGAÇÃO ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); 
    return { days, firstDay };
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  // --- FILTROS ---
  // FILTRO DE USUÁRIO AQUI
  const myEvents = events.filter(evt => evt.userId === user.id);

  const filteredEvents = myEvents.filter(evt => {
    if (selectedType !== 'all' && evt.type !== selectedType) return false;
    return true;
  });

  const getEventsForDay = (day: number, dateBase: Date) => {
    return filteredEvents.filter(evt => {
      const evtDate = new Date(evt.start);
      return evtDate.getDate() === day && 
             evtDate.getMonth() === dateBase.getMonth() && 
             evtDate.getFullYear() === dateBase.getFullYear();
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  };

  // --- CRUD HANDLERS ---
  const handleSaveEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Extração
    const dateStr = formData.get('date') as string; // YYYY-MM-DD
    const startTime = formData.get('startTime') as string; // HH:MM
    const endTime = formData.get('endTime') as string; // HH:MM
    
    // Parsing manual para garantir data LOCAL (Evita bugs de UTC)
    const [year, month, day] = dateStr.split('-').map(Number);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    // Criação segura de objetos Date
    const start = new Date(year, month - 1, day, startHour, startMinute);
    const end = new Date(year, month - 1, day, endHour, endMinute);

    const eventData = {
      userId: user.id, // VINCULA AO USUÁRIO
      title: formData.get('title') as string,
      type: formData.get('type') as EventType,
      start: start.toISOString(),
      end: end.toISOString(),
      description: formData.get('description') as string,
      className: formData.get('className') as string || undefined,
    };

    if (editingEvent) {
      updateEvent({ ...editingEvent, ...eventData });
    } else {
      addEvent(eventData);
    }
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleDelete = () => {
    if (editingEvent) {
      deleteEvent(editingEvent.id);
      setIsModalOpen(false);
      setEditingEvent(null);
    }
  };

  const handleDrop = (day: number) => {
    if (!draggedEvent) return;
    const newStart = new Date(draggedEvent.start);
    const newEnd = new Date(draggedEvent.end);
    newStart.setFullYear(currentDate.getFullYear(), currentDate.getMonth(), day);
    newEnd.setFullYear(currentDate.getFullYear(), currentDate.getMonth(), day);

    updateEvent({ ...draggedEvent, start: newStart.toISOString(), end: newEnd.toISOString() });
    setDraggedEvent(null);
  };

  // --- RENDER VIEWS ---
  const renderMonthView = () => {
    const { days, firstDay } = getDaysInMonth(currentDate);
    const blanks = Array(firstDay).fill(null);
    const daysArray = Array.from({ length: days }, (_, i) => i + 1);
    const today = new Date();

    return (
      <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden animate-fade-in">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="bg-slate-50 dark:bg-slate-800 p-2 text-center text-xs font-bold text-slate-500 uppercase">
            {d}
          </div>
        ))}
        {blanks.map((_, i) => <div key={`blank-${i}`} className="bg-white dark:bg-[#0f172a] min-h-[120px] p-2 opacity-50"></div>)}
        {daysArray.map(day => {
          const dayEvents = getEventsForDay(day, currentDate);
          const isToday = day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
          return (
            <div 
              key={day} 
              className={`bg-white dark:bg-[#0f172a] min-h-[120px] p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 group ${isToday ? 'bg-cyan-50/30 dark:bg-cyan-900/10' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(day)}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-cyan-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}>{day}</span>
                <button onClick={() => { 
                  // Abre modal predefinido para este dia
                  setEditingEvent(null);
                  setIsModalOpen(true);
                  // Pequeno hack para setar data no form seria necessário, mas simplificado aqui
                }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-cyan-600"><Plus size={16}/></button>
              </div>
              <div className="space-y-1">
                {dayEvents.map(evt => (
                  <div key={evt.id} draggable onDragStart={() => setDraggedEvent(evt)} onClick={() => { setEditingEvent(evt); setIsModalOpen(true); }}
                    className={`text-[10px] px-1.5 py-1 rounded border cursor-pointer truncate hover:scale-105 transition-transform ${TYPE_COLORS[evt.type].bg} ${TYPE_COLORS[evt.type].text} ${TYPE_COLORS[evt.type].border}`}>
                    <span className="font-bold mr-1">{new Date(evt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {evt.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderListView = () => {
    const sortedEvents = filteredEvents.sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    return (
      <div className="space-y-4 animate-fade-in">
        {sortedEvents.map(evt => {
           const date = new Date(evt.start);
           if (viewMode === 'day' && date.getDate() !== currentDate.getDate()) return null;
           return (
             <div key={evt.id} className="flex gap-4 p-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl hover:shadow-md transition-all cursor-pointer group" onClick={() => { setEditingEvent(evt); setIsModalOpen(true); }}>
               <div className="flex flex-col items-center justify-center w-16 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                 <span className="text-xs font-bold text-slate-500 uppercase">{date.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                 <span className="text-xl font-bold text-slate-800 dark:text-white">{date.getDate()}</span>
               </div>
               <div className="flex-1">
                 <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${TYPE_COLORS[evt.type].bg} ${TYPE_COLORS[evt.type].text} ${TYPE_COLORS[evt.type].border}`}>{evt.type}</span>
                    <span className="text-xs text-slate-400">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(evt.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                 </div>
                 <h3 className="text-base font-bold text-slate-800 dark:text-white">{evt.title}</h3>
                 {evt.description && <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{evt.description}</p>}
               </div>
               <button className="text-slate-400 hover:text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical size={18}/></button>
             </div>
           );
        })}
        {sortedEvents.length === 0 && <div className="text-center py-12 text-slate-400">Nenhum evento encontrado.</div>}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <CalendarIcon className="text-cyan-600" /> Agenda do Professor
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gerencie aulas, reuniões e prazos.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-white/5">
            <button onClick={() => navigateDate('prev')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"><ChevronLeft size={18} className="text-slate-600 dark:text-slate-300"/></button>
            <span className="px-4 font-bold text-slate-700 dark:text-white min-w-[140px] text-center">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => navigateDate('next')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"><ChevronRight size={18} className="text-slate-600 dark:text-slate-300"/></button>
          </div>
          <button onClick={() => { setEditingEvent(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-500/20 transition-all hover:-translate-y-0.5"><Plus size={18}/><span className="hidden md:inline">Novo Evento</span></button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex p-1 bg-slate-200 dark:bg-slate-800/50 rounded-lg">
          {(['month', 'week', 'day'] as ViewMode[]).map(m => (
            <button key={m} onClick={() => setViewMode(m)} className={`px-4 py-1.5 rounded-md text-sm font-bold capitalize transition-all ${viewMode === m ? 'bg-white dark:bg-slate-700 shadow-sm text-cyan-700 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{m === 'month' ? 'Mês' : m === 'week' ? 'Lista' : 'Dia'}</button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-slate-400"/>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value as any)} className="bg-transparent border-none text-sm font-bold text-slate-600 dark:text-slate-300 focus:ring-0 cursor-pointer">
            <option value="all">Todos os Tipos</option>
            <option value="aula">Aulas</option>
            <option value="prova">Provas</option>
            <option value="reuniao">Reuniões</option>
            <option value="atividade">Atividades</option>
            <option value="projeto">Projetos</option>
          </select>
        </div>
      </div>

      <div className="min-h-[500px]">
        {viewMode === 'month' ? renderMonthView() : renderListView()}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-[#020410]">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">{editingEvent ? 'Editar' : 'Novo'} Compromisso</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Título</label>
                <input name="title" type="text" defaultValue={editingEvent?.title} required className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Título do evento..."/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Tipo</label>
                  <select name="type" defaultValue={editingEvent?.type || 'aula'} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="aula">Aula</option>
                    <option value="prova">Prova</option>
                    <option value="reuniao">Reunião</option>
                    <option value="atividade">Atividade</option>
                    <option value="projeto">Projeto</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Turma (Opcional)</label>
                  <input name="className" type="text" defaultValue={editingEvent?.className} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Ex: 9º A"/>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Data</label>
                  <input name="date" type="date" required defaultValue={editingEvent ? formatDateForInput(new Date(editingEvent.start)) : formatDateForInput(new Date())} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Início</label>
                  <input name="startTime" type="time" required defaultValue={editingEvent ? formatTimeForInput(new Date(editingEvent.start)) : '08:00'} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Fim</label>
                  <input name="endTime" type="time" required defaultValue={editingEvent ? formatTimeForInput(new Date(editingEvent.end)) : '09:00'} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Descrição</label>
                <textarea name="description" rows={3} defaultValue={editingEvent?.description} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500 resize-none" placeholder="Detalhes..."></textarea>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/5 mt-6">
                {editingEvent ? <button type="button" onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-bold"><Trash2 size={16}/> Excluir</button> : <div></div>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold">Cancelar</button>
                  <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-500/20"><Save size={16}/> Salvar</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
