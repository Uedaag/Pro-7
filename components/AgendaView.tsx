
import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Filter, 
  MoreVertical, X, Trash2, Save, Repeat
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

type ViewMode = 'month' | 'week' | 'day';
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
  const { events, addEvent, addEvents, updateEvent, deleteEvent } = useData();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedType, setSelectedType] = useState<EventType | 'all'>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Recorrência
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedRecurrenceDays, setSelectedRecurrenceDays] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(
    formatDateForInput(new Date(new Date().setMonth(new Date().getMonth() + 3)))
  );

  const filteredEvents = events.filter(evt => {
    if (selectedType !== 'all' && evt.type !== selectedType) return false;
    return true;
  });

  const getEventsForDay = (day: number) => {
    return filteredEvents.filter(evt => {
      const evtDate = new Date(evt.start);
      return evtDate.getDate() === day && 
             evtDate.getMonth() === currentDate.getMonth() && 
             evtDate.getFullYear() === currentDate.getFullYear();
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
    setSelectedRecurrenceDays([]);
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
    const className = formData.get('className') as string || undefined;
    
    const [year, month, day] = dateStr.split('-').map(Number);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const createEventObject = (targetDate: Date) => {
      const start = new Date(targetDate);
      start.setHours(startHour, startMinute);
      const end = new Date(targetDate);
      end.setHours(endHour, endMinute);
      return { title, type, start: start.toISOString(), end: end.toISOString(), description, className, userId: user.id };
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
        while (loopDate <= endDateObj) {
          if (selectedRecurrenceDays.includes(loopDate.getDay())) {
            eventsBatch.push(createEventObject(loopDate));
          }
          loopDate.setDate(loopDate.getDate() + 1);
        }
        await addEvents(eventsBatch);
      } else {
        await addEvent(createEventObject(initialDate));
      }
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (editingEvent) {
      await deleteEvent(editingEvent.id);
      setIsModalOpen(false);
    }
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const blanks = Array(firstDay).fill(null);
    const daysArray = Array.from({ length: days }, (_, i) => i + 1);

    return (
      <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden animate-fade-in">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="bg-slate-50 dark:bg-slate-800 p-2 text-center text-xs font-bold text-slate-500 uppercase">{d}</div>
        ))}
        {blanks.map((_, i) => <div key={`blank-${i}`} className="bg-white dark:bg-[#0f172a] min-h-[120px] p-2 opacity-50"></div>)}
        {daysArray.map(day => {
          const dayEvents = getEventsForDay(day);
          return (
            <div key={day} className="bg-white dark:bg-[#0f172a] min-h-[120px] p-2 hover:bg-slate-50 dark:hover:bg-slate-900 group">
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full text-slate-700 dark:text-slate-300">{day}</span>
                <button onClick={openNewEventModal} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-cyan-600"><Plus size={16}/></button>
              </div>
              <div className="space-y-1">
                {dayEvents.map(evt => (
                  <div key={evt.id} onClick={() => { setEditingEvent(evt); setIsModalOpen(true); }} className={`text-[10px] px-1.5 py-1 rounded border cursor-pointer truncate ${TYPE_COLORS[evt.type].bg} ${TYPE_COLORS[evt.type].text} ${TYPE_COLORS[evt.type].border}`}>
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <CalendarIcon className="text-cyan-600" /> Agenda
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
             <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()-1)))} className="p-2"><ChevronLeft size={18}/></button>
             <span className="px-4 font-bold min-w-[140px] text-center">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
             <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()+1)))} className="p-2"><ChevronRight size={18}/></button>
          </div>
          <button onClick={openNewEventModal} className="px-4 py-2.5 bg-cyan-600 text-white font-bold rounded-lg flex items-center gap-2"><Plus size={18}/> Novo</button>
        </div>
      </header>
      
      {renderMonthView()}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingEvent ? 'Editar' : 'Novo'} Compromisso</h3>
               <button onClick={() => setIsModalOpen(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveEvent} className="space-y-4">
                <input name="title" defaultValue={editingEvent?.title} required className="w-full px-4 py-2 bg-slate-50 border rounded-lg" placeholder="Título"/>
                <div className="grid grid-cols-2 gap-4">
                    <select name="type" defaultValue={editingEvent?.type || 'aula'} className="w-full px-4 py-2 bg-slate-50 border rounded-lg">
                        <option value="aula">Aula</option>
                        <option value="prova">Prova</option>
                        <option value="reuniao">Reunião</option>
                    </select>
                    <input name="date" type="date" required defaultValue={editingEvent ? formatDateForInput(new Date(editingEvent.start)) : formatDateForInput(new Date())} className="w-full px-4 py-2 bg-slate-50 border rounded-lg"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <input name="startTime" type="time" required defaultValue={editingEvent ? formatTimeForInput(new Date(editingEvent.start)) : '08:00'} className="w-full px-4 py-2 bg-slate-50 border rounded-lg"/>
                    <input name="endTime" type="time" required defaultValue={editingEvent ? formatTimeForInput(new Date(editingEvent.end)) : '09:00'} className="w-full px-4 py-2 bg-slate-50 border rounded-lg"/>
                </div>
                
                {!editingEvent && (
                    <div className="bg-slate-100 p-3 rounded-lg">
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                           <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="rounded text-cyan-600"/>
                           <span className="text-sm font-bold flex items-center gap-1"><Repeat size={14}/> Repetir Semanalmente</span>
                        </label>
                        {isRecurring && (
                            <div className="flex gap-1 justify-between">
                                {DAYS_OF_WEEK.map((d, i) => (
                                    <button type="button" key={d} onClick={() => toggleRecurrenceDay(i)} className={`w-8 h-8 rounded-full text-xs font-bold ${selectedRecurrenceDays.includes(i) ? 'bg-cyan-600 text-white' : 'bg-white border text-slate-500'}`}>{d.charAt(0)}</button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-between pt-4">
                    {editingEvent && <button type="button" onClick={handleDelete} className="text-red-500 font-bold flex items-center gap-2"><Trash2 size={16}/> Excluir</button>}
                    <button type="submit" className="ml-auto bg-cyan-600 text-white px-6 py-2 rounded-lg font-bold">Salvar</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
