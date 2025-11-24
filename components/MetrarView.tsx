
import React, { useState } from 'react';
import { 
  BookOpen, 
  Wand2, 
  Loader2, 
  Folder, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2, 
  Download, 
  Save, 
  X,
  FileText,
  Calendar as CalendarIcon,
  CheckCircle2
} from 'lucide-react';
import { BimesterPlan, LessonRow, User } from '../types';
import { generateBimesterPlan } from '../services/geminiService';
import { useData } from '../contexts/DataContext';

interface MetrarViewProps {
  user: User;
}

export const MetrarView: React.FC<MetrarViewProps> = ({ user }) => {
  const { plans, addPlan, updatePlan, deletePlan, addEvent } = useData();
  
  // States
  const [isLoading, setIsLoading] = useState(false);
  
  // FILTRO DE USUÁRIO
  const myPlans = plans.filter(p => p.userId === user.id);
  
  // Modais
  const [selectedPlan, setSelectedPlan] = useState<BimesterPlan | null>(null); // Pop-up 1 (Lista de Aulas)
  const [selectedLesson, setSelectedLesson] = useState<LessonRow | null>(null); // Pop-up 2 (Edição de Aula)

  // Form de Geração
  const [formData, setFormData] = useState({
    className: '',
    subject: '',
    bimester: '1º',
    totalLessons: 10,
    theme: '',
    bnccFocus: ''
  });

  // --- GERADOR ---
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.className || !formData.subject) return;

    setIsLoading(true);
    try {
      const rawLessons = await generateBimesterPlan(
        formData.subject,
        formData.className,
        formData.totalLessons,
        formData.theme,
        formData.bnccFocus
      );

      const newLessons: LessonRow[] = rawLessons.map((l, index) => ({
        ...l,
        id: crypto.randomUUID(),
        number: index + 1,
        isSynced: false
      }));

      const newPlan: BimesterPlan = {
        id: crypto.randomUUID(),
        userId: user.id, // VINCULA AO USUÁRIO
        createdAt: new Date().toISOString(),
        ...formData,
        lessons: newLessons
      };

      addPlan(newPlan);
      // Limpar formulário após gerar sucesso
      setFormData({
        className: '',
        subject: '',
        bimester: '1º',
        totalLessons: 10,
        theme: '',
        bnccFocus: ''
      });
      alert("Plano gerado e salvo com sucesso! Confira na seção 'Meus Planos'.");
    } catch (error) {
      alert("Erro ao gerar plano. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- GESTÃO DE AULAS (DENTRO DO POPUP 1) ---
  const handleViewLesson = (lesson: LessonRow) => {
    setSelectedLesson(lesson);
  };

  const handleDeleteLesson = (lessonId: string) => {
    if (!selectedPlan) return;
    if (!window.confirm("Excluir esta aula?")) return;

    const updatedLessons = selectedPlan.lessons
      .filter(l => l.id !== lessonId)
      .map((l, idx) => ({ ...l, number: idx + 1 })); // Reordenar
    
    const updatedPlan = { ...selectedPlan, lessons: updatedLessons };
    updatePlan(updatedPlan);
    setSelectedPlan(updatedPlan); // Atualiza view do modal
  };

  const handleAddLesson = () => {
    if (!selectedPlan) return;
    const newLesson: LessonRow = {
      id: crypto.randomUUID(),
      number: selectedPlan.lessons.length + 1,
      title: 'Nova Aula',
      objectives: '',
      content: '',
      methodology: '',
      resources: '',
      evaluation: '',
      bnccSkill: '',
      isSynced: false
    };
    const updatedPlan = { ...selectedPlan, lessons: [...selectedPlan.lessons, newLesson] };
    updatePlan(updatedPlan);
    setSelectedPlan(updatedPlan);
    setSelectedLesson(newLesson); // Abre direto para edição
  };

  // --- EDIÇÃO DE AULA (DENTRO DO POPUP 2) ---
  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !selectedLesson) return;

    const updatedLessons = selectedPlan.lessons.map(l => 
      l.id === selectedLesson.id ? selectedLesson : l
    );

    const updatedPlan = { ...selectedPlan, lessons: updatedLessons };
    updatePlan(updatedPlan);
    setSelectedPlan(updatedPlan); // Atualiza modal pai
    setSelectedLesson(null); // Fecha modal filho
  };

  const handleLessonChange = (field: keyof LessonRow, value: string) => {
    if (selectedLesson) {
      setSelectedLesson({ ...selectedLesson, [field]: value });
    }
  };

  // --- DOWNLOADS SIMULADOS ---
  const handleDownload = (format: 'pdf' | 'docx') => {
    if (!selectedPlan) return;
    alert(`Download do arquivo .${format} iniciado para o plano de ${selectedPlan.subject}!`);
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-12 animate-fade-in">
      
      {/* (1) ÁREA SUPERIOR – GERAR PLANO */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Wand2 className="text-cyan-600" /> Gerador de Plano Bimestral
          </h2>
          <p className="text-slate-500 text-sm mt-1">Preencha os dados e deixe a IA estruturar seu bimestre.</p>
        </div>
        
        <form onSubmit={handleGenerate} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Turma</label>
              <input 
                required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                placeholder="Ex: 5º Ano A"
                value={formData.className}
                onChange={e => setFormData({...formData, className: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Disciplina</label>
              <input 
                required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                placeholder="Ex: Arte"
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bimestre</label>
              <select 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                value={formData.bimester}
                onChange={e => setFormData({...formData, bimester: e.target.value})}
              >
                <option>1º Bimestre</option>
                <option>2º Bimestre</option>
                <option>3º Bimestre</option>
                <option>4º Bimestre</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tema Geral</label>
              <input 
                required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                placeholder="Ex: História da Arte Brasileira"
                value={formData.theme}
                onChange={e => setFormData({...formData, theme: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Qtd. Aulas</label>
              <input 
                type="number"
                min={1}
                max={40}
                required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                value={formData.totalLessons}
                onChange={e => setFormData({...formData, totalLessons: Number(e.target.value)})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Habilidades BNCC</label>
            <textarea 
              rows={2}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none resize-none transition-all"
              placeholder="Códigos ou descrição das habilidades..."
              value={formData.bnccFocus}
              onChange={e => setFormData({...formData, bnccFocus: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 size={20} />}
            {isLoading ? "Gerando Plano..." : "GERAR PLANO BIMESTRAL"}
          </button>
        </form>
      </section>

      {/* (2) ÁREA INFERIOR – MEUS PLANOS (PASTAS) */}
      <section>
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Folder className="text-amber-500" /> Meus Planos Bimestrais
        </h3>

        {myPlans.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-400 font-medium">Nenhum plano criado ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myPlans.map(plan => (
              <button 
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-cyan-300 transition-all text-left group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Folder size={64} className="text-cyan-600" />
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition-transform">
                    <Folder size={24} fill="currentColor" className="opacity-80" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg mb-1 leading-tight">
                    {plan.subject}
                  </h4>
                  <p className="text-sm text-slate-600 font-medium mb-4">
                    {plan.className} • {plan.bimester}
                  </p>
                  <div className="text-xs text-slate-400 border-t border-slate-100 pt-3 flex justify-between items-center">
                    <span>Criado em: {new Date(plan.createdAt).toLocaleDateString()}</span>
                    <span className="bg-slate-100 px-2 py-1 rounded text-slate-500 font-bold">{plan.lessons.length} aulas</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* POP-UP 1: DETALHES DO PLANO (LISTA DE AULAS)             */}
      {/* ========================================================= */}
      {selectedPlan && !selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
            
            {/* Header Modal */}
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">
                  PLANO BIMESTRAL – {selectedPlan.subject}
                </h2>
                <p className="text-slate-500 font-medium">
                  {selectedPlan.className} – {selectedPlan.bimester}
                </p>
              </div>
              <button 
                onClick={() => setSelectedPlan(null)}
                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
              <div className="space-y-3">
                {selectedPlan.lessons.map((lesson) => (
                  <div key={lesson.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:shadow-sm transition-shadow group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-500 text-sm">
                        #{lesson.number}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{lesson.title || `Aula ${lesson.number}`}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{lesson.content}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleViewLesson(lesson)}
                        className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                        title="Visualizar/Editar"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={handleAddLesson}
                className="w-full mt-6 py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:border-cyan-500 hover:text-cyan-600 hover:bg-cyan-50 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} /> Adicionar Nova Aula
              </button>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center">
              <div className="flex gap-3">
                <button onClick={() => handleDownload('pdf')} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-bold text-sm">
                  <FileText size={16} /> PDF
                </button>
                <button onClick={() => handleDownload('docx')} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-bold text-sm">
                  <Download size={16} /> DOCX
                </button>
              </div>
              <div className="flex gap-3">
                 <button 
                  onClick={() => {
                     deletePlan(selectedPlan.id);
                     setSelectedPlan(null);
                  }}
                  className="px-6 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold text-sm transition-colors"
                >
                  Excluir Plano
                </button>
                <button 
                  onClick={() => setSelectedPlan(null)}
                  className="px-6 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-lg font-bold text-sm transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* POP-UP 2: EDIÇÃO DA AULA                                 */}
      {/* ========================================================= */}
      {selectedLesson && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-3xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
            
            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Edit3 size={20} className="text-cyan-600" />
                Editando Aula #{selectedLesson.number}
              </h3>
              <button onClick={() => setSelectedLesson(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="flex-1 overflow-y-auto p-8 space-y-6">
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Título da Aula</label>
                <input 
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none font-bold"
                  value={selectedLesson.title || ''}
                  onChange={e => handleLessonChange('title', e.target.value)}
                  placeholder="Ex: Introdução ao tema..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Objetivos</label>
                  <textarea 
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none resize-none text-sm"
                    value={selectedLesson.objectives}
                    onChange={e => handleLessonChange('objectives', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Conteúdos</label>
                  <textarea 
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none resize-none text-sm"
                    value={selectedLesson.content}
                    onChange={e => handleLessonChange('content', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Metodologia</label>
                <textarea 
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none resize-none text-sm"
                  value={selectedLesson.methodology}
                  onChange={e => handleLessonChange('methodology', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Recursos</label>
                  <textarea 
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none resize-none text-sm"
                    value={selectedLesson.resources}
                    onChange={e => handleLessonChange('resources', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Avaliação</label>
                  <textarea 
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none resize-none text-sm"
                    value={selectedLesson.evaluation}
                    onChange={e => handleLessonChange('evaluation', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Habilidade BNCC</label>
                <input 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none text-sm font-mono text-cyan-700"
                  value={selectedLesson.bnccSkill}
                  onChange={e => handleLessonChange('bnccSkill', e.target.value)}
                />
              </div>

            </form>

            <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setSelectedLesson(null)}
                className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveLesson}
                className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
              >
                <Save size={18} /> Salvar Aula
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
