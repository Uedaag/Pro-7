import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Trash2, ChevronLeft, Calendar as CalendarIcon,
  X, Eye, Presentation, Image as ImageIcon, 
  BookOpen, FileText, Loader2, Clock, Edit3, Save, CheckCircle, GraduationCap, Download, AlertTriangle
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useNotification } from '../contexts/NotificationContext';
import { ClassRoom, View, GeneratedActivity, BimesterPlan, LessonRow, Student, Assessment, Grade } from '../types';
import { generatePPTX } from '../services/pptService';

const GradesTab: React.FC<{ classId: string }> = ({ classId }) => {
  const { fetchClassGradesData, addStudent, deleteStudent, addAssessment, deleteAssessment, saveGrade } = useData();
  const { notify } = useNotification();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  
  const [isAddAssessmentOpen, setIsAddAssessmentOpen] = useState(false);
  const [newAssessmentTitle, setNewAssessmentTitle] = useState('');
  const [itemToDelete, setItemToDelete] = useState<{type: 'student'|'assessment', id: string} | null>(null);

  useEffect(() => { loadData(); }, [classId]);

  const loadData = async () => {
    const data = await fetchClassGradesData(classId);
    setStudents(data.students);
    setAssessments(data.assessments);
    setGrades(data.grades);
  };

  const handleAddStudent = async () => {
    if (!newStudentName.trim()) return;
    const s = await addStudent({ classId, name: newStudentName });
    if (s) {
      setStudents([...students, s]);
      setNewStudentName('');
      setIsAddStudentOpen(false);
      notify("Aluno adicionado!", "success");
    }
  };

  const confirmDelete = async () => {
      if (!itemToDelete) return;
      if (itemToDelete.type === 'student') {
          await deleteStudent(itemToDelete.id);
          setStudents(students.filter(s => s.id !== itemToDelete.id));
          notify("Aluno removido.", "success");
      } else {
          await deleteAssessment(itemToDelete.id);
          setAssessments(assessments.filter(a => a.id !== itemToDelete.id));
          notify("Coluna removida.", "success");
      }
      setItemToDelete(null);
  };

  const handleAddAssessment = async () => {
    if (!newAssessmentTitle.trim()) return;
    const a = await addAssessment({ classId, title: newAssessmentTitle });
    if (a) {
      setAssessments([...assessments, a]);
      setNewAssessmentTitle('');
      setIsAddAssessmentOpen(false);
      notify("Coluna criada!", "success");
    }
  };

  const handleGradeChange = async (studentId: string, assessmentId: string, value: string) => {
    const score = parseFloat(value);
    if (isNaN(score)) return;
    const existingGrade = grades.find(g => g.studentId === studentId && g.assessmentId === assessmentId);
    if (existingGrade) {
      setGrades(grades.map(g => g.id === existingGrade.id ? { ...g, score } : g));
    } else {
      setGrades([...grades, { id: 'temp', studentId, assessmentId, score }]);
    }
    await saveGrade({ studentId, assessmentId, score });
  };

  const getScore = (studentId: string, assessmentId: string) => {
    const g = grades.find(g => g.studentId === studentId && g.assessmentId === assessmentId);
    return g ? g.score : '';
  };

  const downloadExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    const header = ["Aluno", ...assessments.map(a => a.title)];
    csvContent += header.join(",") + "\r\n";
    students.forEach(s => {
      const row = [s.name];
      assessments.forEach(a => { row.push(getScore(s.id, a.id).toString()); });
      csvContent += row.join(",") + "\r\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "notas_turma.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify("Download iniciado.", "success");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-700 dark:text-slate-300">Diário de Notas</h3>
        <div className="flex gap-2">
          <button onClick={() => setIsAddStudentOpen(true)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">+ Aluno</button>
          <button onClick={() => setIsAddAssessmentOpen(true)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">+ Coluna</button>
          <button onClick={downloadExcel} className="px-4 py-2 bg-emerald-600 text-white font-bold text-sm rounded-lg flex items-center gap-2 hover:bg-emerald-500"><Download size={16}/> Baixar Excel</button>
        </div>
      </div>
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm bg-white dark:bg-[#0f172a]">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase text-xs font-bold">
            <tr>
              <th className="px-6 py-4 min-w-[200px]">Nome do Aluno</th>
              {assessments.map(a => (
                <th key={a.id} className="px-4 py-4 min-w-[100px] text-center group relative">
                  {a.title}
                  <button onClick={() => setItemToDelete({type:'assessment', id: a.id})} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1"><X size={12}/></button>
                </th>
              ))}
              <th className="px-4 py-4 min-w-[50px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {students.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                <td className="px-6 py-3 font-medium text-slate-800 dark:text-white">{s.name}</td>
                {assessments.map(a => (
                  <td key={a.id} className="px-4 py-3 text-center">
                    <input type="number" className="w-16 p-1 text-center border rounded bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-purple-500 outline-none" value={getScore(s.id, a.id)} onChange={(e) => handleGradeChange(s.id, a.id, e.target.value)} />
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setItemToDelete({type:'student', id: s.id})} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
            {students.length === 0 && <tr><td colSpan={assessments.length + 2} className="text-center py-8 text-slate-400">Nenhum aluno cadastrado.</td></tr>}
          </tbody>
        </table>
      </div>
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-80 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Adicionar Aluno</h4>
            <input autoFocus value={newStudentName} onChange={e => setNewStudentName(e.target.value)} className="w-full p-2 border rounded mb-4 bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white" placeholder="Nome do Aluno" />
            <div className="flex justify-end gap-2"><button onClick={() => setIsAddStudentOpen(false)} className="px-3 py-1 text-slate-500 dark:text-slate-400 font-bold text-sm">Cancelar</button><button onClick={handleAddStudent} className="px-4 py-2 bg-purple-600 text-white rounded font-bold text-sm">Adicionar</button></div>
          </div>
        </div>
      )}
      {isAddAssessmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-80 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Nova Coluna de Nota</h4>
            <input autoFocus value={newAssessmentTitle} onChange={e => setNewAssessmentTitle(e.target.value)} className="w-full p-2 border rounded mb-4 bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white" placeholder="Ex: Prova 1, Trabalho..." />
            <div className="flex justify-end gap-2"><button onClick={() => setIsAddAssessmentOpen(false)} className="px-3 py-1 text-slate-500 dark:text-slate-400 font-bold text-sm">Cancelar</button><button onClick={handleAddAssessment} className="px-4 py-2 bg-purple-600 text-white rounded font-bold text-sm">Criar</button></div>
          </div>
        </div>
      )}
      {itemToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#0f172a] w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center border border-slate-200 dark:border-white/10">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-500"><Trash2 size={32}/></div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Excluir Item?</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Tem certeza que deseja remover este item?</p>
                <div className="flex gap-3 justify-center">
                    <button onClick={() => setItemToDelete(null)} className="flex-1 py-2.5 rounded-xl border text-slate-600 font-bold text-sm hover:bg-slate-50">Cancelar</button>
                    <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm shadow-lg">Sim, Excluir</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const PlanManagerModal: React.FC<{ plan: BimesterPlan; onClose: () => void; }> = ({ plan, onClose }) => {
  const { updatePlan } = useData();
  const { notify } = useNotification();
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editedLesson, setEditedLesson] = useState<LessonRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleEditLesson = (lesson: LessonRow) => { setEditingLessonId(lesson.id); setEditedLesson({ ...lesson }); };
  const handleCancelEdit = () => { setEditingLessonId(null); setEditedLesson(null); };
  const handleChange = (field: keyof LessonRow, value: string) => { if (editedLesson) setEditedLesson({ ...editedLesson, [field]: value }); };

  const handleSaveLesson = async () => {
    if (!editedLesson) return;
    setIsSaving(true);
    const updatedLessons = plan.lessons.map(l => l.id === editedLesson.id ? editedLesson : l);
    const updatedPlan = { ...plan, lessons: updatedLessons };
    try {
      await updatePlan(updatedPlan);
      setEditingLessonId(null); setEditedLesson(null);
      notify("Aula atualizada com sucesso!", "success");
    } catch (error: any) { notify("Erro ao salvar aula: " + error.message, "error"); } finally { setIsSaving(false); }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if(!window.confirm("Tem certeza que deseja remover esta aula do plano?")) return;
    setIsSaving(true);
    const updatedLessons = plan.lessons.filter(l => l.id !== lessonId);
    const updatedPlan = { ...plan, lessons: updatedLessons };
    try {
      await updatePlan(updatedPlan);
      notify("Aula removida com sucesso!", "success");
    } catch (error: any) { notify("Erro ao excluir aula: " + error.message, "error"); } finally { setIsSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0f172a] w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-[#020410]">
          <div><h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><BookOpen className="text-purple-600" size={24}/> Gerenciar Plano: {plan.theme}</h2><p className="text-sm text-slate-500">{plan.subject} • {plan.className} • {plan.bimester}</p></div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors"><X size={24}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-[#0b1121]">
          <div className="space-y-4">
            {plan.lessons.map((lesson) => (
              <div key={lesson.id} className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">{lesson.number}</span><h3 className="font-bold text-slate-700 dark:text-white">{lesson.title}</h3></div>
                  {editingLessonId !== lesson.id && (<div className="flex gap-2"><button onClick={() => handleEditLesson(lesson)} className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors text-sm font-bold flex items-center gap-1"><Edit3 size={16}/> Editar</button><button onClick={() => handleDeleteLesson(lesson.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={16}/></button></div>)}
                </div>
                <div className="p-6">
                  {editingLessonId === lesson.id && editedLesson ? (
                    <div className="space-y-4 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título</label><input value={editedLesson.title} onChange={(e) => handleChange('title', e.target.value)} className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"/></div>
                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Objetivos</label><input value={editedLesson.objectives} onChange={(e) => handleChange('objectives', e.target.value)} className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"/></div>
                      </div>
                      <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Conteúdo</label><textarea rows={3} value={editedLesson.content} onChange={(e) => handleChange('content', e.target.value)} className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 resize-none"/></div>
                      <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Metodologia</label><textarea rows={2} value={editedLesson.methodology} onChange={(e) => handleChange('methodology', e.target.value)} className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 resize-none"/></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Recursos</label><input value={editedLesson.resources} onChange={(e) => handleChange('resources', e.target.value)} className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"/></div>
                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Avaliação</label><input value={editedLesson.evaluation} onChange={(e) => handleChange('evaluation', e.target.value)} className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"/></div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/5"><button onClick={handleCancelEdit} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-sm">Cancelar</button><button onClick={handleSaveLesson} disabled={isSaving} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm flex items-center gap-2">{isSaving ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16}/>} Salvar Alterações</button></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600 dark:text-slate-400">
                      <div><p className="mb-2"><strong className="text-slate-800 dark:text-white">Objetivos:</strong> {lesson.objectives}</p><p className="mb-2"><strong className="text-slate-800 dark:text-white">Conteúdo:</strong> {lesson.content}</p><p><strong className="text-slate-800 dark:text-white">Metodologia:</strong> {lesson.methodology}</p></div>
                      <div><p className="mb-2"><strong className="text-slate-800 dark:text-white">Recursos:</strong> {lesson.resources}</p><p className="mb-2"><strong className="text-slate-800 dark:text-white">Avaliação:</strong> {lesson.evaluation}</p><p><span className="inline-block bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-xs font-bold">BNCC: {lesson.bnccSkill}</span></p></div>
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
  const [activeTab, setActiveTab] = useState<'grades' | 'activities'>('grades');
  const { classes } = useData();
  const currentClass = classes.find(c => c.id === classRoom.id) || classRoom;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <ChevronLeft size={24} className="text-slate-500" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{currentClass.name}</h2>
          <p className="text-slate-500 text-sm">{currentClass.grade} • {currentClass.subject} • {currentClass.shift}</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-white/10 mb-6">
        <button 
           onClick={() => setActiveTab('grades')}
           className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'grades' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Diário de Notas
        </button>
        <button 
           onClick={() => setActiveTab('activities')}
           className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'activities' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Atividades Geradas
        </button>
      </div>

      {activeTab === 'grades' ? (
        <GradesTab classId={currentClass.id} />
      ) : (
        <div>
           {currentClass.generatedActivities && currentClass.generatedActivities.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentClass.generatedActivities.map(act => (
                  <div key={act.id} className="bg-white dark:bg-[#0f172a] p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <h4 className="font-bold text-slate-800 dark:text-white">{act.title}</h4>
                    <p className="text-xs text-slate-500">{new Date(act.createdAt).toLocaleDateString()} • {act.type}</p>
                  </div>
                ))}
             </div>
           ) : (
             <div className="text-center py-10 text-slate-400">
               <p>Nenhuma atividade encontrada.</p>
               <button onClick={() => onNavigate?.('activity-generator')} className="text-purple-600 font-bold hover:underline mt-2">Criar Atividade</button>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export const ClassesView: React.FC<{ onNavigate?: (view: View) => void; user: any }> = ({ onNavigate, user }) => {
  const { classes, addClass, deleteClass } = useData();
  const { notify } = useNotification();
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);

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
      notify("Turma criada com sucesso!", "success");
      setIsCreateModalOpen(false);
      form.reset();
    } catch (error: any) {
      let msg = error.message || "Erro desconhecido";
      if (msg.includes("studentsCount")) msg = "Erro de banco de dados (Coluna faltando). Contate o suporte.";
      notify(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteClass = async () => {
    if (classToDelete) {
        try {
            await deleteClass(classToDelete);
            if (selectedClass?.id === classToDelete) { setSelectedClass(null); setViewMode('list'); }
            notify("Turma excluída com sucesso.", "success");
        } catch (error: any) { notify("Erro ao excluir a turma. Tente novamente.", "error"); }
        setClassToDelete(null);
    }
  };

  if (viewMode === 'detail' && selectedClass) {
    return <ClassDetailView classRoom={selectedClass} onBack={() => { setSelectedClass(null); setViewMode('list'); }} onNavigate={onNavigate} />;
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><Users className="text-purple-600" /> Minhas Turmas</h1><p className="text-slate-500 text-sm mt-1">Gerencie aulas, alunos e conteúdos por sala.</p></div>
        <button onClick={() => setIsCreateModalOpen(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-transform hover:-translate-y-0.5"><Plus size={20} /> Adicionar Nova Turma</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {classes.map(cls => (
          <div key={cls.id} onClick={() => { setSelectedClass(cls); setViewMode('detail'); }} className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all cursor-pointer group relative">
             <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-purple-600"><Users size={24} /></div>
              <button onClick={(e) => { e.stopPropagation(); setClassToDelete(cls.id); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{cls.name}</h3>
            <p className="text-sm text-slate-500 font-medium mb-4">{cls.grade} • {cls.subject}</p>
          </div>
        ))}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-md rounded-2xl shadow-2xl p-8 relative animate-scale-in border border-slate-200 dark:border-white/10">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Nova Turma</h2>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <input name="name" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-white" placeholder="Nome (Ex: 9º A)" />
              <input name="grade" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-white" placeholder="Série (Ex: 9º Ano)" />
              <select name="shift" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-white cursor-pointer"><option>Matutino</option><option>Vespertino</option><option>Noturno</option><option>Integral</option></select>
              <input name="subject" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-white" placeholder="Disciplina" />
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-white/5"><button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">{isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />} {isSubmitting ? "Criando..." : "Criar Turma"}</button></div>
            </form>
          </div>
        </div>
      )}

      {classToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-scale-in border border-slate-200 dark:border-white/10">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-500"><Trash2 size={32} /></div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Excluir Turma?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Tem certeza que deseja remover esta turma e todos os seus dados? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3 justify-center"><button onClick={() => setClassToDelete(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">Cancelar</button><button onClick={confirmDeleteClass} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-500/20 transition-transform hover:-translate-y-0.5">Sim, Excluir</button></div>
          </div>
        </div>
      )}
    </div>
  );
};