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

// --- SUB-COMPONENTE: TABELA DE NOTAS ---
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

  // Estados de Exclusão
  const [itemToDelete, setItemToDelete] = useState<{type: 'student'|'assessment', id: string} | null>(null);

  useEffect(() => {
    loadData();
  }, [classId]);

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
      assessments.forEach(a => {
        row.push(getScore(s.id, a.id).toString());
      });
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
                    <input 
                      type="number" 
                      className="w-16 p-1 text-center border rounded bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-purple-500 outline-none"
                      value={getScore(s.id, a.id)}
                      onChange={(e) => handleGradeChange(s.id, a.id, e.target.value)}
                    />
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setItemToDelete({type:'student', id: s.id})} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan={assessments.length + 2} className="text-center py-8 text-slate-400">Nenhum aluno cadastrado. Adicione alunos para começar.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-80 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Adicionar Aluno</h4>
            <input autoFocus value={newStudentName} onChange={e => setNewStudentName(e.target.value)} className="w-full p-2 border rounded mb-4 bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white" placeholder="Nome do Aluno" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsAddStudentOpen(false)} className="px-3 py-1 text-slate-500 dark:text-slate-400 font-bold text-sm">Cancelar</button>
              <button onClick={handleAddStudent} className="px-4 py-2 bg-purple-600 text-white rounded font-bold text-sm">Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {isAddAssessmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-80 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Nova Coluna de Nota</h4>
            <input autoFocus value={newAssessmentTitle} onChange={e => setNewAssessmentTitle(e.target.value)} className="w-full p-2 border rounded mb-4 bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white" placeholder="Ex: Prova 1, Trabalho..." />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsAddAssessmentOpen(false)} className="px-3 py-1 text-slate-500 dark:text-slate-400 font-bold text-sm">Cancelar</button>
              <button onClick={handleAddAssessment} className="px-4 py-2 bg-purple-600 text-white rounded font-bold text-sm">Criar</button>
            </div>
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

// --- SUB-COMPONENTE: VISUALIZAR E EDITAR PLANO ---
const PlanManagerModal: React.FC<{ plan: BimesterPlan; onClose: () => void; }> = ({ plan, onClose }) => {
  const { updatePlan } = useData();
  const { notify } = useNotification();
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
      notify("Aula atualizada com sucesso!", "success");
    } catch (error: any) {
      notify("Erro ao salvar aula: " + error.message, "error");
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
      notify("Aula removida com sucesso!", "success");
    } catch (error: any) {
      notify("Erro ao excluir aula: " + error.message, "error");
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
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-[#0b1121]">
          <div className="space-y-4">
            {plan.lessons.map((lesson) => (
              <div key={lesson.id} className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                      {lesson.number}
                    </span>
                    <h3 className="font-bold text-slate-700 dark:text-white">{lesson.title}</h3>
                  </div>
                  {editingLessonId !== lesson.id && (
                    <div className="flex gap-2">
                      <button onClick={() => handleEditLesson(lesson)} className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors text-sm font-bold flex items-center gap-1"><Edit3 size={16}/> Editar</button>
                      <button onClick={() => handleDeleteLesson(lesson.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={16}/></button>
                    </div>
                  )}
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
                      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/5">
                        <button onClick={handleCancelEdit} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-sm">Cancelar</button>
                        <button onClick={handleSaveLesson} disabled={isSaving} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm flex items-center gap-2">{isSaving ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16}/>} Salvar Alterações</button>
                      </div>
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

// --- SUB-COMPONENTE: DETALHES DA TURMA ---
const ClassDetailView: React.FC<{ classRoom: ClassRoom; onBack: () => void; onNavigate?: (view: View) => void }> = ({ classRoom, onBack, onNavigate }) => {
  const { classes, plans } = useData();
  const [activeTab, setActiveTab] = useState<'activities' | 'grades' | 'plans'>('activities');
  const [selectedPlan, setSelectedPlan] = useState<BimesterPlan | null>(null);
  const [viewActivity, setViewActivity] = useState<GeneratedActivity | null>(null);

  // Garantir dados atualizados
  const currentClass = classes.find(c => c.id === classRoom.id) || classRoom;
  const classPlans = plans.filter(p => currentClass.linkedPlanIds?.includes(p.id));

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
         <button onClick={onBack} className="text-slate-500 hover:text-purple-600 font-bold flex items-center gap-2 text-sm"><ChevronLeft size={20}/> Voltar para Turmas</button>
         <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button onClick={() => setActiveTab('activities')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'activities' ? 'bg-white dark:bg-[#0f172a] text-purple-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>Mural</button>
            <button onClick={() => setActiveTab('grades')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'grades' ? 'bg-white dark:bg-[#0f172a] text-purple-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>Notas</button>
            <button onClick={() => setActiveTab('plans')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'plans' ? 'bg-white dark:bg-[#0f172a] text-purple-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>Planos</button>
         </div>
      </div>

      <div className="bg-white dark:bg-[#0f172a] p-8 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{currentClass.name}</h2>
        <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium">
          <span className="flex items-center gap-1"><GraduationCap size={16}/> {currentClass.grade}</span>
          <span className="flex items-center gap-1"><BookOpen size={16}/> {currentClass.subject}</span>
          <span className="flex items-center gap-1"><Clock size={16}/> {currentClass.shift}</span>
          <span className="flex items-center gap-1"><Users size={16}/> {currentClass.studentsCount} Alunos</span>
        </div>
      </div>

      {activeTab === 'activities' && (
        <div className="space-y-6">
           <div className="flex justify-between items-center">
             <h3 className="text-lg font-bold text-slate-800 dark:text-white">Materiais Gerados</h3>
             <button onClick={() => onNavigate && onNavigate('activity-generator')} className="text-sm font-bold text-purple-600 hover:underline flex items-center gap-1"><Plus size={16}/> Gerar Novo</button>
           </div>
           
           {currentClass.generatedActivities && currentClass.generatedActivities.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentClass.generatedActivities.map(act => (
                  <div key={act.id} className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                     <div className="flex justify-between items-start mb-4">
                       <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 rounded-lg text-xs font-bold uppercase tracking-wider">{act.type}</span>
                       <span className="text-xs text-slate-400">{new Date(act.createdAt).toLocaleDateString()}</span>
                     </div>
                     <h4 className="font-bold text-slate-800 dark:text-white text-lg mb-2 line-clamp-2 min-h-[3.5rem]">{act.title}</h4>
                     <p className="text-xs text-slate-500 mb-6 line-clamp-2">{act.content.introText || "Sem descrição."}</p>
                     
                     <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setViewActivity(act)} className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2"><Eye size={16}/> Ver</button>
                        <button onClick={() => generatePPTX(act.content)} className="py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-colors flex items-center justify-center gap-2"><Presentation size={16}/> PPTX</button>
                     </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="text-center py-20 bg-slate-50 dark:bg-[#0f172a]/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
               <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4"><FileText size={32}/></div>
               <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Nenhum material encontrado</h3>
               <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Use a IA para criar provas, slides e atividades para esta turma.</p>
               <button onClick={() => onNavigate && onNavigate('activity-generator')} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg hover:bg-purple-500 transition-colors">Criar Material</button>
             </div>
           )}
        </div>
      )}

      {activeTab === 'grades' && <GradesTab classId={currentClass.id} />}

      {activeTab === 'plans' && (
        <div className="space-y-6">
           <div className="flex justify-between items-center">
             <h3 className="text-lg font-bold text-slate-800 dark:text-white">Planos Vinculados</h3>
             <button onClick={() => onNavigate && onNavigate('lesson-plans')} className="text-sm font-bold text-cyan-600 hover:underline flex items-center gap-1"><Plus size={16}/> Vincular Novo</button>
           </div>
           
           {classPlans.length > 0 ? (
             <div className="grid grid-cols-1 gap-4">
                {classPlans.map(plan => (
                   <div key={plan.id} className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                         <h4 className="font-bold text-slate-800 dark:text-white text-lg">{plan.theme}</h4>
                         <p className="text-sm text-slate-500">{plan.bimester} • {plan.totalLessons} Aulas • Foco: {plan.bnccFocus || 'Geral'}</p>
                      </div>
                      <button onClick={() => setSelectedPlan(plan)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl transition-colors">Ver Detalhes</button>
                   </div>
                ))}
             </div>
           ) : (
             <div className="text-center py-20 bg-slate-50 dark:bg-[#0f172a]/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
               <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4"><BookOpen size={32}/></div>
               <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Nenhum plano vinculado</h3>
               <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Vincule planos bimestrais para organizar suas aulas.</p>
               <button onClick={() => onNavigate && onNavigate('lesson-plans')} className="px-6 py-3 bg-cyan-600 text-white rounded-xl font-bold shadow-lg hover:bg-cyan-500 transition-colors">Ir para Planos</button>
             </div>
           )}
        </div>
      )}

      {/* MODAL DE PLANO */}
      {selectedPlan && <PlanManagerModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />}

      {/* MODAL DE ATIVIDADE */}
      {viewActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white dark:bg-[#0f172a] w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-[#020410]">
                 <h2 className="text-xl font-bold text-slate-800 dark:text-white">{viewActivity.title}</h2>
                 <button onClick={() => setViewActivity(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-white dark:bg-white/5 rounded-full shadow-sm"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-[#0b1121]">
                 <div className="max-w-3xl mx-auto bg-white dark:bg-[#0f172a] p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 min-h-full">
                    {/* Renderização Simplificada do Conteúdo */}
                    <div className="prose dark:prose-invert max-w-none">
                       <h1 className="text-center mb-2">{viewActivity.content.header.title}</h1>
                       <p className="text-center text-slate-500 mb-8">{viewActivity.content.header.subtitle}</p>
                       
                       {viewActivity.content.introText && (
                         <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <h3 className="text-sm font-bold uppercase text-slate-400 mb-2">Introdução</h3>
                            <p>{viewActivity.content.introText}</p>
                         </div>
                       )}

                       {viewActivity.content.questions && (
                         <div className="space-y-6">
                            <h3 className="border-b pb-2">Questões</h3>
                            {viewActivity.content.questions.map((q, i) => (
                               <div key={i} className="mb-4">
                                  <p className="font-bold"><span className="text-purple-600 mr-2">{i+1}.</span>{q.statement}</p>
                                  {q.options && (
                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                       {q.options.map((opt, j) => <li key={j}>{opt}</li>)}
                                    </ul>
                                  )}
                               </div>
                            ))}
                         </div>
                       )}

                       {viewActivity.content.slides && (
                         <div className="space-y-6 mt-8">
                            <h3 className="border-b pb-2">Slides</h3>
                            {viewActivity.content.slides.map((s, i) => (
                               <div key={i} className="p-4 border rounded-xl mb-4 bg-slate-50 dark:bg-slate-900">
                                  <h4 className="font-bold mb-2">{s.title}</h4>
                                  <ul className="list-disc pl-5">
                                     {s.bullets.map((b, j) => <li key={j}>{b}</li>)}
                                  </ul>
                               </div>
                            ))}
                         </div>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL: CLASSES VIEW ---
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
            if (selectedClass?.id === classToDelete) { 
                setSelectedClass(null); 
                setViewMode('list'); 
            }
            notify("Turma excluída com sucesso.", "success");
        } catch (error: any) {
            notify("Erro ao excluir a turma. Tente novamente.", "error");
        }
        setClassToDelete(null);
    }
  };

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

      {/* MODAL DE CRIAÇÃO */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-md rounded-2xl shadow-2xl p-8 relative animate-scale-in border border-slate-200 dark:border-white/10">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Nova Turma</h2>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <input name="name" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-white" placeholder="Nome (Ex: 9º A)" />
              <input name="grade" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-white" placeholder="Série (Ex: 9º Ano)" />
              <select name="shift" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-white cursor-pointer">
                  <option>Matutino</option>
                  <option>Vespertino</option>
                  <option>Noturno</option>
                  <option>Integral</option>
              </select>
              <input name="subject" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-white" placeholder="Disciplina" />
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-white/5">
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />} 
                    {isSubmitting ? "Criando..." : "Criar Turma"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EXCLUSÃO (CENTRALIZADO) */}
      {classToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-scale-in border border-slate-200 dark:border-white/10">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-500">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Excluir Turma?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Tem certeza que deseja remover esta turma e todos os seus dados? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setClassToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteClass}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-500/20 transition-transform hover:-translate-y-0.5"
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