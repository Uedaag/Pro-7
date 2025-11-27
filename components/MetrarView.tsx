import React, { useState } from 'react';
import { 
  Wand2, Loader2, Folder, Plus, Edit3, Trash2, Save, X, 
  BookOpen, CheckCircle, List, Table as TableIcon, Eye, AlertTriangle, Link as LinkIcon
} from 'lucide-react';
import { BimesterPlan, LessonRow, User } from '../types';
import { generateBimesterPlan } from '../services/geminiService';
import { useData } from '../contexts/DataContext';
import { useNotification } from '../contexts/NotificationContext';

export const MetrarView: React.FC<{ user: User }> = ({ user }) => {
  const { plans, classes, addPlan, deletePlan, linkPlanToClass } = useData();
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState<'generator' | 'library'>('generator');
  
  // States do Gerador
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<LessonRow[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // States da Biblioteca
  const [selectedStoredPlan, setSelectedStoredPlan] = useState<BimesterPlan | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [planToLink, setPlanToLink] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    className: '', 
    subject: '', 
    bimester: '1º Bimestre', 
    totalLessons: 10, 
    theme: '', 
    bnccFocus: ''
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.theme || !formData.subject) return;

    setIsLoading(true);
    setGeneratedPlan(null); // Limpa anterior
    
    try {
      const rawLessons = await generateBimesterPlan(
        formData.subject, 
        formData.className, 
        formData.totalLessons, 
        formData.theme, 
        formData.bnccFocus
      );
      
      // Adiciona IDs locais para renderização
      const newLessons: LessonRow[] = rawLessons.map((l, index) => ({ 
        ...l, 
        id: crypto.randomUUID(), 
        number: index + 1 
      }));
      
      setGeneratedPlan(newLessons);
    } catch (e) { 
      notify("Erro ao gerar plano. Tente novamente.", "error"); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleSaveToDb = async () => {
    if (!generatedPlan) return;
    setIsSaving(true);

    try {
      const newPlan: BimesterPlan = {
        id: '', // Será gerado pelo DB
        userId: user.id,
        className: formData.className,
        subject: formData.subject,
        bimester: formData.bimester,
        totalLessons: formData.totalLessons,
        theme: formData.theme,
        bnccFocus: formData.bnccFocus,
        lessons: generatedPlan,
        createdAt: new Date().toISOString()
      };

      await addPlan(newPlan);
      notify("Plano salvo com sucesso na sua biblioteca!", "success");
      
      // Reset e vai para a biblioteca
      setGeneratedPlan(null);
      setActiveTab('library');
    } catch (error: any) {
      console.error("Erro detalhado:", error);
      notify(`Erro ao salvar no banco de dados: ${error.message || error}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm("Tem certeza que deseja excluir este plano?")) {
        await deletePlan(id);
        notify("Plano excluído com sucesso.", "success");
        if (selectedStoredPlan?.id === id) setSelectedStoredPlan(null);
    }
  };

  const openLinkModal = (planId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setPlanToLink(planId);
      setIsLinkModalOpen(true);
  };

  const handleLinkClass = async (classId: string) => {
      if (!planToLink) return;
      try {
          await linkPlanToClass(planToLink, classId);
          notify("Plano vinculado à turma com sucesso!", "success");
          setIsLinkModalOpen(false);
          setPlanToLink(null);
      } catch (e: any) {
          notify("Erro ao vincular: " + e.message, "error");
      }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-8 animate-fade-in">
      
      {/* Header e Abas */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-200 dark:border-white/10 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="text-cyan-600" /> Planejamento Bimestral
          </h1>
          <p className="text-slate-500 text-sm mt-1">Estruture suas aulas alinhadas à BNCC com Inteligência Artificial.</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('generator')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'generator' ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            <Wand2 size={16} /> Gerador IA
          </button>
          <button 
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'library' ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            <Folder size={16} /> Minha Biblioteca
          </button>
        </div>
      </div>
      
      {activeTab === 'generator' && (
        <div className="space-y-8">
          <section className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 p-6 md:p-8">
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Turma / Série</label>
                  <input required placeholder="Ex: 6º Ano B" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white"
                    value={formData.className} onChange={e=>setFormData({...formData, className: e.target.value})}/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Disciplina</label>
                  <input required placeholder="Ex: História" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white"
                    value={formData.subject} onChange={e=>setFormData({...formData, subject: e.target.value})}/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Período</label>
                  <select className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white"
                    value={formData.bimester} onChange={e=>setFormData({...formData, bimester: e.target.value})}>
                    <option>1º Bimestre</option>
                    <option>2º Bimestre</option>
                    <option>3º Bimestre</option>
                    <option>4º Bimestre</option>
                    <option>Semestral</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tema Geral / Conteúdo</label>
                  <input required placeholder="Ex: Revolução Francesa" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white"
                    value={formData.theme} onChange={e=>setFormData({...formData, theme: e.target.value})}/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Qtd. Aulas</label>
                  <input type="number" required min={1} max={40} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white"
                    value={formData.totalLessons} onChange={e=>setFormData({...formData, totalLessons: parseInt(e.target.value)})}/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Habilidades BNCC (Opcional)</label>
                <textarea rows={2} placeholder="Ex: EF08HI04..." className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 resize-none text-slate-800 dark:text-white"
                  value={formData.bnccFocus} onChange={e=>setFormData({...formData, bnccFocus: e.target.value})}/>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={isLoading} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 flex justify-center items-center gap-3 transition-all hover:scale-[1.01]">
                  {isLoading ? <><Loader2 className="animate-spin" /> Gerando Planejamento...</> : <><Wand2 size={20} /> Gerar Plano de Aula</>}
                </button>
              </div>
            </form>
          </section>

          {generatedPlan && (
            <div className="animate-slide-in-from-bottom-4 space-y-6">
              <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                <div className="p-6 bg-slate-50 dark:bg-[#020410] border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Pré-visualização do Plano</h2>
                    <p className="text-sm text-slate-500">{formData.subject} - {formData.className}</p>
                  </div>
                  <button onClick={handleSaveToDb} disabled={isSaving} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5">
                    {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />} Salvar na Biblioteca
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs uppercase font-bold tracking-wider">
                        <th className="p-4 w-16 text-center">Aula</th>
                        <th className="p-4 w-1/4">Tema & Objetivos</th>
                        <th className="p-4">Conteúdo & Metodologia</th>
                        <th className="p-4 w-1/5">BNCC & Avaliação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {generatedPlan.map((lesson) => (
                        <tr key={lesson.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                          <td className="p-4 text-center font-bold text-cyan-600 dark:text-cyan-400 align-top bg-slate-50/50 dark:bg-transparent">{lesson.number.toString().padStart(2, '0')}</td>
                          <td className="p-4 align-top">
                            <p className="font-bold text-slate-800 dark:text-white mb-2">{lesson.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{lesson.objectives}</p>
                          </td>
                          <td className="p-4 align-top">
                            <div className="mb-2"><span className="text-[10px] font-bold uppercase text-slate-400">Conteúdo</span><p className="text-sm text-slate-700 dark:text-slate-300">{lesson.content}</p></div>
                            <div><span className="text-[10px] font-bold uppercase text-slate-400">Metodologia</span><p className="text-xs text-slate-600 dark:text-slate-400 italic">{lesson.methodology}</p></div>
                          </td>
                          <td className="p-4 align-top bg-slate-50/30 dark:bg-white/[0.02]">
                            <div className="mb-2"><span className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-[10px] font-bold mb-1">BNCC</span><p className="text-xs text-slate-600 dark:text-slate-400 font-mono">{lesson.bnccSkill}</p></div>
                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-white/5"><span className="text-[10px] font-bold uppercase text-slate-400">Recursos</span><p className="text-xs text-slate-500 dark:text-slate-500">{lesson.resources}</p></div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- ABA: BIBLIOTECA --- */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          {plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#0f172a] rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4"><Folder size={40} /></div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">Biblioteca Vazia</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mt-2">Você ainda não salvou nenhum plano de aula.</p>
              <button onClick={() => setActiveTab('generator')} className="mt-6 text-cyan-600 font-bold hover:underline">Ir para o Gerador</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map(plan => (
                <div key={plan.id} onClick={() => setSelectedStoredPlan(plan)} className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md hover:border-cyan-300 dark:hover:border-cyan-700 transition-all cursor-pointer group relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600 rounded-xl group-hover:bg-cyan-600 group-hover:text-white transition-colors"><List size={24} /></div>
                    <div className="flex gap-2 items-center">
                        <button 
                            onClick={(e) => openLinkModal(plan.id, e)} 
                            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition-colors shadow-sm"
                            title="Vincular este plano a uma turma"
                        >
                            <LinkIcon size={14} /> Vincular Turma
                        </button>
                        
                        <button onClick={(e) => handleDelete(plan.id, e)} className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1 line-clamp-1">{plan.theme}</h3>
                  <p className="text-sm text-cyan-600 dark:text-cyan-400 font-bold mb-4">{plan.subject}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">{plan.className}</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">{plan.bimester}</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">{plan.totalLessons} Aulas</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-400">
                    <span>Criado em {new Date(plan.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-300 group-hover:translate-x-1 transition-transform">Ver Detalhes <Eye size={12}/></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Vinculação */}
      {isLinkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-[#0f172a] w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-scale-in">
                  <button onClick={() => setIsLinkModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  
                  <div className="mb-6">
                    <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl flex items-center justify-center mb-4">
                        <LinkIcon size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Vincular à Turma</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Selecione a turma para associar este plano de aula. Isso permitirá gerar atividades baseadas neste conteúdo.
                    </p>
                  </div>
                  
                  {classes.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                          {classes.map(c => (
                              <button 
                                key={c.id} 
                                onClick={() => handleLinkClass(c.id)}
                                className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all group"
                              >
                                  <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-300">{c.name}</h4>
                                  <p className="text-xs text-slate-500">{c.grade} • {c.subject}</p>
                              </button>
                          ))}
                      </div>
                  ) : (
                      <div className="text-center py-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                          <p className="text-slate-400 text-sm mb-2">Nenhuma turma cadastrada.</p>
                          <a href="#" onClick={(e) => { e.preventDefault(); notify("Vá para a aba Turmas para cadastrar uma nova.", "info"); }} className="text-cyan-600 font-bold text-xs hover:underline">Cadastrar Turma</a>
                      </div>
                  )}
              </div>
          </div>
      )}

      {selectedStoredPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-[#020410]">
              <div><h2 className="text-xl font-bold text-slate-800 dark:text-white">{selectedStoredPlan.theme}</h2><p className="text-sm text-slate-500">{selectedStoredPlan.subject} • {selectedStoredPlan.className}</p></div>
              <button onClick={() => setSelectedStoredPlan(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-auto p-6 md:p-8 bg-slate-100 dark:bg-[#0b1121]">
               <div className="bg-white dark:bg-[#0f172a] rounded-xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">
                       <tr><th className="p-4 w-16 text-center">#</th><th className="p-4 w-1/4">Tema</th><th className="p-4">Desenvolvimento</th><th className="p-4 w-1/4">BNCC & Recursos</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                       {selectedStoredPlan.lessons.map((lesson) => (
                          <tr key={lesson.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                             <td className="p-4 text-center font-bold text-slate-400 align-top">{lesson.number}</td>
                             <td className="p-4 align-top"><p className="font-bold text-slate-800 dark:text-white mb-2">{lesson.title}</p><div className="text-xs text-slate-500 dark:text-slate-400 space-y-1"><p><span className="font-bold">Obj:</span> {lesson.objectives}</p></div></td>
                             <td className="p-4 align-top"><p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{lesson.content}</p><p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-white/5 p-2 rounded">{lesson.methodology}</p></td>
                             <td className="p-4 align-top text-xs space-y-2"><div className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded inline-block font-mono font-bold">{lesson.bnccSkill}</div><p className="text-slate-500"><span className="font-bold">Recursos:</span> {lesson.resources}</p><p className="text-slate-500"><span className="font-bold">Avaliação:</span> {lesson.evaluation}</p></td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};