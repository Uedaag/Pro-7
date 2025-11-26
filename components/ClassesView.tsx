
import React, { useState } from 'react';
import { 
  Users, Plus, Trash2, ChevronLeft, Calendar as CalendarIcon,
  X, Eye, Printer, Presentation, ChevronRight, Image as ImageIcon, 
  BookOpen, FileText, Loader2, Clock, Edit3, Save, CheckCircle
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ClassRoom, View, GeneratedActivity, BimesterPlan, LessonRow } from '../types';
import { generatePPTX } from '../services/pptService';

export const ClassesView: React.FC<{ onNavigate?: (view: View) => void; user: any }> = ({ onNavigate, user }) => {
  const { classes, addClass, deleteClass } = useData();
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const newClass: any = {
      name: formData.get('name') as string,
      grade: formData.get('grade') as string,
      subject: formData.get('subject') as string,
      shift: formData.get('shift') as string,
      studentsCount: 0
    };

    try {
      await addClass(newClass);
      setIsCreateModalOpen(false);
      form.reset();
    } catch (error: any) {
      alert("Erro ao criar turma: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if(window.confirm("Deseja realmente excluir esta turma?")) {
        await deleteClass(id);
        if(selectedClass?.id === id) { setSelectedClass(null); setViewMode('list'); }
    }
  }

  if (viewMode === 'detail' && selectedClass) {
    return <ClassDetailView classRoom={selectedClass} onBack={() => { setSelectedClass(null); setViewMode('list'); }} onNavigate={onNavigate} />;
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><Users className="text-purple-600" /> Minhas Turmas</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie aulas, alunos e conteúdos por sala.</p>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2"><Plus size={20} /> Adicionar Nova Turma</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {classes.map(cls => (
          <div key={cls.id} onClick={() => { setSelectedClass(cls); setViewMode('detail'); }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative">
             <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-purple-600"><Users size={24} /></div>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id); }} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">{cls.name}</h3>
            <p className="text-sm text-slate-500 font-medium mb-4">{cls.grade} • {cls.subject}</p>
          </div>
        ))}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 relative">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-4 right-4 text-slate-400"><X size={20} /></button>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Nova Turma</h2>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <input name="name" required className="w-full px-4 py-3 bg-slate-50 border rounded-xl" placeholder="Nome (Ex: 9º A)" />
              <input name="grade" required className="w-full px-4 py-3 bg-slate-50 border rounded-xl" placeholder="Série (Ex: 9º Ano)" />
              <select name="shift" className="w-full px-4 py-3 bg-slate-50 border rounded-xl"><option>Matutino</option><option>Vespertino</option></select>
              <input name="subject" required className="w-full px-4 py-3 bg-slate-50 border rounded-xl" placeholder="Disciplina" />
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg">{isSubmitting ? "Criando..." : "Criar Turma"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENTE: VISUALIZAR E EDITAR PLANO ---
const PlanManagerModal: React.FC<{ plan: BimesterPlan; onClose: () => void; }> = ({ plan, onClose }) => {
  const { updatePlan } = useData();
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editedLesson, setEditedLesson] = useState<LessonRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleEditLesson = (lesson: LessonRow) => {
    setEditingLessonId(lesson.id);
    setEditedLesson({ ...lesson });
  };

  const handleCancelEdit = () => {
    setEditingLessonId(null);
    setEditedLesson(null);
  };

  const handleSaveLesson = async () => {
    if (!editedLesson) return;
    setIsSaving(true);
    
    const updatedLessons = plan.lessons.map(l => l.id === editedLesson.id ? editedLesson : l);
    const updatedPlan = { ...plan, lessons: updatedLessons };

    try {
      await updatePlan(updatedPlan);
      setEditingLessonId(null);
      setEditedLesson(null);
    } catch (error: any) {
      alert("Erro ao salvar aula: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if(!window.confirm("Tem certeza que deseja remover esta aula do plano?")) return;
    setIsSaving(true);
    
    const updatedLessons = plan.lessons.filter(l => l.id !== lessonId);
    const updatedPlan = { ...plan, lessons: updatedLessons };

    try {
      await updatePlan(updatedPlan);
    } catch (error: any) {
      alert("Erro ao excluir aula: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof LessonRow, value: string) => {
    if (editedLesson) {
      setEditedLesson({ ...editedLesson, [field]: value });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0f172a] w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-[#020410]">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BookOpen className="text-purple-600" size={24}/>
              Gerenciar Plano: {plan.theme}
            </h2>
            <p className="text-sm text-slate-500">{plan.subject} • {plan.className} • {plan.bimester}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors">
            <X size={24}/>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-[#0b1121]">
          <div className="space-y-4">
            {plan.lessons.map((lesson) => (
              <div key={lesson.id} className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
                
                {/* Lesson Header */}
                <div className="p-4 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                      {lesson.number}
                    </span>
                    <h3 className="font-bold text-slate-700 dark:text-white">{lesson.title}</h3>
                  </div>
                  
                  {editingLessonId !== lesson.id && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditLesson(lesson)}
                        className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors text-sm font-bold flex items-center gap-1"
                      >
                        <Edit3 size={16}/> Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  )}
                </div>

                {/* Lesson Body */}
                <div className="p-6">
                  {editingLessonId === lesson.id && editedLesson ? (
                    <div className="space-y-4 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título</label>
                          <input 
                            value={editedLesson.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Objetivos</label>
                          <input 
                            value={editedLesson.objectives}
                            onChange={(e) => handleChange('objectives', e.target.value)}
                            className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Conteúdo</label>
                        <textarea 
                          rows={3}
                          value={editedLesson.content}
                          onChange={(e) => handleChange('content', e.target.value)}
                          className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Metodologia</label>
                        <textarea 
                          rows={2}
                          value={editedLesson.methodology}
                          onChange={(e) => handleChange('methodology', e.target.value)}
                          className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Recursos</label>
                          <input 
                            value={editedLesson.resources}
                            onChange={(e) => handleChange('resources', e.target.value)}
                            className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Avaliação</label>
                          <input 
                            value={editedLesson.evaluation}
                            onChange={(e) => handleChange('evaluation', e.target.value)}
                            className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/5">
                        <button 
                          onClick={handleCancelEdit}
                          className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-sm"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={handleSaveLesson}
                          disabled={isSaving}
                          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm flex items-center gap-2"
                        >
                          {isSaving ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16}/>}
                          Salvar Alterações
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600 dark:text-slate-400">
                      <div>
                        <p className="mb-2"><strong className="text-slate-800 dark:text-white">Objetivos:</strong> {lesson.objectives}</p>
                        <p className="mb-2"><strong className="text-slate-800 dark:text-white">Conteúdo:</strong> {lesson.content}</p>
                        <p><strong className="text-slate-800 dark:text-white">Metodologia:</strong> {lesson.methodology}</p>
                      </div>
                      <div>
                        <p className="mb-2"><strong className="text-slate-800 dark:text-white">Recursos:</strong> {lesson.resources}</p>
                        <p className="mb-2"><strong className="text-slate-800 dark:text-white">Avaliação:</strong> {lesson.evaluation}</p>
                        <p><span className="inline-block bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-xs font-bold">BNCC: {lesson.bnccSkill}</span></p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ClassDetailView: React.FC<{ classRoom: ClassRoom; onBack: () => void; onNavigate?: (view: View) => void }> = ({ classRoom, onBack, onNavigate }) => {
  const { events, plans } = useData();
  const [activeTab, setActiveTab] = useState<'aulas' | 'planos' | 'atividades'>('aulas');
  const [selectedActivity, setSelectedActivity] = useState<GeneratedActivity | null>(null);
  const [editingPlan, setEditingPlan] = useState<BimesterPlan | null>(null); // Estado para abrir o modal de edição

  const classEvents = events
    .filter(evt => evt.classId === classRoom.id)
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

  // Planos vinculados
  const linkedPlans = plans.filter(p => classRoom.linkedPlanIds?.includes(p.id));

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-fade-in">
       <div className="mb-6">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-bold mb-4"><ChevronLeft size={16} /> Voltar</button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600"><Users size={32} /></div>
          <div><h1 className="text-3xl font-bold text-slate-800">{classRoom.name}</h1><p className="text-slate-500">{classRoom.grade} • {classRoom.subject}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px]">
         <div className="flex border-b border-slate-200 overflow-x-auto">
            {[{ id: 'aulas', label: 'Aulas', icon: CalendarIcon }, { id: 'planos', label: 'Planos', icon: BookOpen }, { id: 'atividades', label: 'Atividades (IA)', icon: FileText }].map(tab => (
               <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-4 font-bold text-sm ${activeTab === tab.id ? 'border-b-2 border-purple-600 text-purple-700 bg-purple-50' : 'text-slate-500'}`}><tab.icon size={18} /> {tab.label}</button>
            ))}
         </div>

         <div className="p-8">
            {activeTab === 'aulas' && (
              <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">Cronograma da Turma</h3>
                    <button onClick={() => onNavigate?.('agenda')} className="text-purple-600 text-xs font-bold hover:underline flex items-center gap-1"><Plus size={14}/> Agendar na Agenda</button>
                 </div>
                 {classEvents.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl"><p>Nenhuma aula vinculada.</p></div>
                 ) : (
                    <div className="space-y-3">
                       {classEvents.map(evt => (
                          <div key={evt.id} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                              <div className="flex flex-col items-center justify-center w-14 h-14 bg-slate-50 rounded-lg text-slate-600 shrink-0">
                                  <span className="text-[10px] font-bold uppercase">{new Date(evt.start).toLocaleDateString('pt-BR', {weekday: 'short'})}</span>
                                  <span className="text-lg font-black">{new Date(evt.start).getDate()}</span>
                              </div>
                              <div>
                                  <h4 className="font-bold text-slate-800">{evt.title}</h4>
                                  <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={12}/> {new Date(evt.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                              </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
            )}

            {activeTab === 'planos' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-700">Planos de Aula Vinculados</h3>
                        <button onClick={() => onNavigate?.('lesson-plans')} className="text-purple-600 text-xs font-bold hover:underline flex items-center gap-1">Ir para Biblioteca</button>
                    </div>
                    {linkedPlans.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl"><p>Nenhum plano vinculado a esta turma.</p></div>
                    ) : (
                        <div className="space-y-4">
                            {linkedPlans.map(plan => (
                                <div key={plan.id} className="bg-slate-50 p-6 rounded-xl border border-slate-200 group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-lg text-slate-800">{plan.theme}</h4>
                                            <p className="text-sm text-slate-500">{plan.bimester} • {plan.totalLessons} Aulas</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-white px-3 py-1 rounded-full text-xs font-bold border border-slate-200 text-slate-500">Vinculado</span>
                                            <button 
                                              onClick={() => setEditingPlan(plan)}
                                              className="bg-white text-purple-600 px-3 py-1 rounded-full text-xs font-bold border border-purple-200 hover:bg-purple-50 transition-colors shadow-sm"
                                            >
                                              Gerenciar Conteúdo
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Lesson Preview */}
                                    <div className="space-y-2 mt-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase">Conteúdo das Aulas (Resumo)</p>
                                        {plan.lessons.slice(0, 3).map(l => (
                                            <div key={l.id} className="flex gap-3 items-center text-sm text-slate-600 bg-white p-2 rounded border border-slate-100">
                                                <span className="font-mono font-bold text-purple-600 w-6 text-center">{l.number}</span>
                                                <span className="truncate">{l.title}</span>
                                            </div>
                                        ))}
                                        {plan.lessons.length > 3 && (
                                          <p className="text-xs text-slate-400 pl-2 pt-1 italic">+ {plan.lessons.length - 3} aulas...</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'atividades' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-700">Materiais Gerados</h3>
                        <button onClick={() => onNavigate?.('activity-generator')} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"><Plus size={16}/> Gerar Novo</button>
                    </div>
                    {classRoom.generatedActivities?.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">Nenhuma atividade gerada.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {classRoom.generatedActivities?.map(item => (
                                <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                    <h4 className="text-lg font-bold text-slate-800 mb-1">{item.title}</h4>
                                    <p className="text-xs text-slate-500 mb-4">{new Date(item.createdAt).toLocaleDateString()}</p>
                                    <button onClick={() => setSelectedActivity(item)} className="w-full py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded flex items-center justify-center gap-1"><Eye size={14} /> Abrir</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
         </div>
      </div>
      
      {/* MODAL DE EDIÇÃO DE PLANO */}
      {editingPlan && (
        <PlanManagerModal 
          plan={editingPlan} 
          onClose={() => setEditingPlan(null)} 
        />
      )}

      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-3xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                 <h3 className="font-bold">{selectedActivity.title}</h3>
                 <button onClick={() => setSelectedActivity(null)}><X size={20}/></button>
              </div>
              <div className="flex-1 p-8 overflow-y-auto bg-slate-50"><pre className="whitespace-pre-wrap text-sm">{JSON.stringify(selectedActivity.content, null, 2)}</pre></div>
              <div className="p-4 border-t bg-white flex justify-end gap-2">
                 <button onClick={() => generatePPTX(selectedActivity.content)} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold flex items-center gap-2"><Presentation size={16}/> Baixar PPTX</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
