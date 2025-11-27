
import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Filter, 
  MoreVertical, X, Trash2, Save, Repeat, Clock, CheckCircle, List, Grid, Users, AlertTriangle
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { CalendarEvent, EventType, User } from '../types';

const TYPE_COLORS: Record<EventType, { bg: string, text: string, border: string }> = {
  aula: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  prova: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
  reuniao: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  projeto: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  atividade: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  outro: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' },
};

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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

export const AgendaView: React.FC<{ user: User }> = ({ user }) => {
  const { events, classes, addEvent, addEvents, updateEvent, deleteEvent } = useData();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedType, setSelectedType] = useState<EventType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Estados de Recorrência
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedRecurrenceDays, setSelectedRecurrenceDays] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(
    formatDateForInput(new Date(new Date().setMonth(new Date().getMonth() + 1)))
  );

  // Estado para Modal de Exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const getEventsForDay = (day: number) => {
    return events.filter(evt => {
      const evtDate = new Date(evt.start);
      return evtDate.getDate() === day && 
             evtDate.getMonth() === currentDate.getMonth() && 
             evtDate.getFullYear() === currentDate.getFullYear() &&
             (selectedType === 'all' || evt.type === selectedType);
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  };

  const toggleRecurrenceDay = (dayIndex: number) => {
    setSelectedRecurrenceDays(prev => 
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const openNewEventModal = () => {
    setEditingEvent(null);
    setIsRecurring(false);
    setSelectedRecurrenceDays([new Date().getDay()]); 
    setRecurrenceEndDate(formatDateForInput(new Date(new Date().setMonth(new Date().getMonth() + 1))));
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dateStr = formData.get('date') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const title = formData.get('title') as string;
    const type = formData.get('type') as EventType;
    const description = formData.get('description') as string;
    
    const classId = formData.get('classId') as string;
    const selectedClass = classes.find(c => c.id === classId);
    const className = selectedClass ? `${selectedClass.name} - ${selectedClass.grade}` : undefined;
    
    const [year, month, day] = dateStr.split('-').map(Number);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const createEventObject = (targetDate: Date) => {
      const start = new Date(targetDate);
      start.setHours(startHour, startMinute);
      const end = new Date(targetDate);
      end.setHours(endHour, endMinute);
      return { 
        title, 
        type, 
        start: start.toISOString(), 
        end: end.toISOString(), 
        description, 
        userId: user.id,
        classId: classId || undefined,
        className: className
      };
    };

    if (editingEvent) {
      const baseDate = new Date(year, month - 1, day);
      await updateEvent({ ...editingEvent, ...createEventObject(baseDate) });
    } else {
      const initialDate = new Date(year, month - 1, day);
      
      if (isRecurring && selectedRecurrenceDays.length > 0) {
        const eventsBatch: any[] = [];
        const endDateObj = new Date(recurrenceEndDate + 'T23:59:59');
        let loopDate = new Date(initialDate);
        
        // Loop até a data final
        while (loopDate <= endDateObj) {
          if (selectedRecurrenceDays.includes(loopDate.getDay())) {
            eventsBatch.push(createEventObject(loopDate));
          }
          loopDate.setDate(loopDate.getDate() + 1);
        }
        
        if (eventsBatch.length > 0) {
            await addEvents(eventsBatch);
        } else {
            // Fallback se nenhum dia bater (salva pelo menos um)
            await addEvent(createEventObject(initialDate));
        }
      } else {
        await addEvent(createEventObject(initialDate));
      }
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (editingEvent) {
      await deleteEvent(editingEvent.id);
      setIsDeleteModalOpen(false);
      setIsModalOpen(false);
    }
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); 
    
    const blanks = Array(firstDayOfWeek).fill(null);
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm animate-fade-in">
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900">
          {DAYS_OF_WEEK.map(d => (
            <div key={d} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">{d}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 auto-rows-fr">
          {blanks.map((_, i) => (
            <div key={`blank-${i}`} className="min-h-[120px] bg-slate-50/30 dark:bg-slate-900/20 border-r border-b border-slate-100 dark:border-white/5"></div>
          ))}
          
          {daysArray.map(day => {
            const dayEvents = getEventsForDay(day);
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            
            return (
              <div key={day} className={`min-h-[120px] p-2 border-r border-b border-slate-100 dark:border-white/5 relative group transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${isToday ? 'bg-cyan-50/30 dark:bg-cyan-900/10' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`
                    w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold
                    ${isToday ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30' : 'text-slate-700 dark:text-slate-300'}
                  `}>
                    {day}
                  </span>
                  <button 
                    onClick={() => {
                        setEditingEvent(null);
                        setIsRecurring(false);
                        setTimeout(() => {
                           const inputDate = document.querySelector('input[name="date"]') as HTMLInputElement;
                           if(inputDate) inputDate.value = formatDateForInput(new Date(year, month, day));
                        }, 100);
                        setIsModalOpen(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-400 transition-all"
                  >
                    <Plus size={14}/>
                  </button>
                </div>
                
                <div className="space-y-1">
                  {dayEvents.map(evt => (
                    <button 
                      key={evt.id} 
                      onClick={(e) => { e.stopPropagation(); setEditingEvent(evt); setIsModalOpen(true); }} 
                      className={`w-full text-left px-2 py-1 rounded-md border text-[10px] font-bold truncate transition-transform hover:scale-[1.02] active:scale-95 flex flex-col items-start ${TYPE_COLORS[evt.type].bg} ${TYPE_COLORS[evt.type].text} ${TYPE_COLORS[evt.type].border}`}
                    >
                      <span className="truncate w-full">{evt.title}</span>
                      {evt.className && (
                        <span className="bg-white/50 px-1 rounded text-[8px] opacity-90 mt-0.5 truncate w-full">
                           {evt.className}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const allEvents = events
      .filter(e => {
         const d = new Date(e.start);
         return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear() &&
                (selectedType === 'all' || e.type === selectedType);
      })
      .sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    if (allEvents.length === 0) return (
      <div className="text-center py-12 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/10 text-slate-500">
        Nenhum evento encontrado para este mês.
      </div>
    );

    return (
      <div className="space-y-3">
        {allEvents.map(evt => (
          <div key={evt.id} onClick={() => { setEditingEvent(evt); setIsModalOpen(true); }} className="bg-white dark:bg-[#0f172a] p-4 rounded-xl border border-slate-200 dark:border-white/10 flex gap-4 items-center cursor-pointer hover:shadow-md transition-all">
            <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center font-bold ${TYPE_COLORS[evt.type].bg} ${TYPE_COLORS[evt.type].text}`}>
               <span className="text-xs uppercase">{new Date(evt.start).toLocaleDateString('pt-BR', {weekday: 'short'})}</span>
               <span className="text-lg">{new Date(evt.start).getDate()}</span>
            </div>
            <div className="flex-1">
               <div className="flex items-center gap-2">
                 <h4 className="font-bold text-slate-800 dark:text-white">{evt.title}</h4>
                 {evt.className && (
                    <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
                       {evt.className}
                    </span>
                 )}
               </div>
               <p className="text-xs text-slate-500">{new Date(evt.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(evt.end).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${TYPE_COLORS[evt.type].bg} ${TYPE_COLORS[evt.type].text}`}>
              {evt.type}
            </span>
          </div>
        ))}
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
          <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie aulas, reuniões e prazos.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center">
           <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
             <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()-1)))} className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"><ChevronLeft size={20}/></button>
             <span className="px-6 font-bold min-w-[160px] text-center text-slate-800 dark:text-white capitalize">
               {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
             </span>
             <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()+1)))} className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"><ChevronRight size={20}/></button>
           </div>
           
           <button 
             onClick={openNewEventModal} 
             className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-transform hover:-translate-y-0.5"
           >
             <Plus size={20}/> Novo Evento
           </button>
        </div>
      </header>

      {/* Controles de Visualização */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex bg-slate-100 dark:bg-[#0f172a] p-1 rounded-xl">
           <button onClick={() => setViewMode('month')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'month' ? 'bg-white dark:bg-slate-800 shadow text-cyan-600' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}>
              <Grid size={16}/> Mês
           </button>
           <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow text-cyan-600' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}>
              <List size={16}/> Lista
           </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <div className="flex items-center gap-2 text-slate-400 mr-2">
             <Filter size={16} />
          </div>
          <button 
             onClick={() => setSelectedType('all')} 
             className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors ${selectedType === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white dark:bg-[#0f172a] text-slate-500 border-slate-200 dark:border-white/10'}`}
          >
            Todos
          </button>
          {Object.keys(TYPE_COLORS).map(type => (
             <button 
               key={type}
               onClick={() => setSelectedType(type as EventType)}
               className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors capitalize ${selectedType === type ? 'ring-2 ring-offset-2 ring-slate-400' : ''} ${TYPE_COLORS[type as EventType].bg} ${TYPE_COLORS[type as EventType].text} ${TYPE_COLORS[type as EventType].border}`}
             >
               {type}
             </button>
          ))}
        </div>
      </div>
      
      {viewMode === 'month' ? renderMonthView() : renderListView()}

      {/* MODAL DE EVENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-[#020410]">
               <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 {editingEvent ? <Clock size={20} className="text-cyan-600"/> : <Plus size={20} className="text-cyan-600"/>}
                 {editingEvent ? 'Editar Evento' : 'Novo Compromisso'}
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSaveEvent} className="p-6 space-y-5">
                <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Título do Evento</label>
                   <input 
                     name="title" 
                     defaultValue={editingEvent?.title} 
                     required 
                     className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white font-bold" 
                     placeholder="Ex: Aula de História - 6º B"
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tipo</label>
                        <select name="type" defaultValue={editingEvent?.type || 'aula'} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white cursor-pointer">
                            <option value="aula">Aula</option>
                            <option value="prova">Prova</option>
                            <option value="reuniao">Reunião</option>
                            <option value="projeto">Projeto</option>
                            <option value="atividade">Atividade</option>
                            <option value="outro">Outro</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Vincular Turma (Opcional)</label>
                        <div className="relative">
                           <Users size={16} className="absolute left-3 top-3.5 text-slate-400"/>
                           <select 
                              name="classId" 
                              defaultValue={editingEvent?.classId || ''}
                              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white cursor-pointer"
                           >
                              <option value="">Nenhuma turma</option>
                              {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name} — {c.grade}</option>
                              ))}
                           </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Data</label>
                        <input name="date" type="date" required defaultValue={editingEvent ? formatDateForInput(new Date(editingEvent.start)) : formatDateForInput(new Date())} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white"/>
                    </div>
                    <div></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Início</label>
                        <input name="startTime" type="time" required defaultValue={editingEvent ? formatTimeForInput(new Date(editingEvent.start)) : '08:00'} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white"/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Fim</label>
                        <input name="endTime" type="time" required defaultValue={editingEvent ? formatTimeForInput(new Date(editingEvent.end)) : '09:00'} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white"/>
                    </div>
                </div>
                
                <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Descrição (Opcional)</label>
                   <textarea name="description" rows={2} defaultValue={editingEvent?.description} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white resize-none" placeholder="Detalhes do evento..."></textarea>
                </div>
                
                {/* ÁREA DE RECORRÊNCIA (APENAS CRIAÇÃO) */}
                {!editingEvent && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-white/5 space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                           <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isRecurring ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'}`}>
                              {isRecurring && <CheckCircle size={14} />}
                           </div>
                           <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="hidden"/>
                           <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                             <Repeat size={16} className="text-cyan-600"/> Repetir este evento
                           </span>
                        </label>

                        {isRecurring && (
                            <div className="pt-2 animate-slide-in-from-bottom-4 space-y-4 border-t border-slate-200 dark:border-slate-700 mt-2">
                                <div>
                                   <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Dias da Semana</label>
                                   <div className="flex justify-between gap-1">
                                      {DAYS_OF_WEEK.map((d, i) => (
                                          <button 
                                            type="button" 
                                            key={d} 
                                            onClick={() => toggleRecurrenceDay(i)} 
                                            className={`
                                              w-9 h-9 rounded-lg text-xs font-bold transition-all
                                              ${selectedRecurrenceDays.includes(i) 
                                                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20 scale-105' 
                                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100'}
                                            `}
                                          >
                                            {d.charAt(0)}
                                          </button>
                                      ))}
                                   </div>
                                </div>
                                
                                <div>
                                   <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Repetir até</label>
                                   <input 
                                      type="date" 
                                      value={recurrenceEndDate}
                                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300"
                                   />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-between pt-2">
                    {editingEvent && (
                      <button 
                        type="button" 
                        onClick={() => setIsDeleteModalOpen(true)} 
                        className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-bold flex items-center gap-2 transition-colors"
                      >
                        <Trash2 size={18}/> Excluir
                      </button>
                    )}
                    <button 
                      type="submit" 
                      className="ml-auto px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                      <Save size={18} /> {editingEvent ? 'Atualizar' : 'Salvar Evento'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* NOVO MODAL DE EXCLUSÃO ESTILIZADO */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-scale-in border border-slate-200 dark:border-white/10">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-500">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Excluir Evento?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Tem certeza que deseja remover este conteúdo da sua agenda? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-500/20 transition-transform hover:-translate-y-0.5"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
