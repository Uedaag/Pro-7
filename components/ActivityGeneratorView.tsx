import React, { useState } from 'react';
import { 
  Wand2, Loader2, Save, Users, Calendar, Type, 
  CheckSquare, FileText, GraduationCap, Presentation, 
  Palette, BrainCircuit, ChevronLeft, ArrowRight, BookOpen
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useNotification } from '../contexts/NotificationContext';
import { generateEducationalActivity } from '../services/geminiService';
import { ActivityContent, ActivityType, GeneratedActivity, LessonRow } from '../types';

export const ActivityGeneratorView: React.FC = () => {
  const { classes, events, plans, addActivity } = useData();
  const { notify } = useNotification();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [knowledgeSource, setKnowledgeSource] = useState<'manual' | 'agenda' | 'plans'>('manual');
  const [manualTopic, setManualTopic] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]); 
  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedType, setSelectedType] = useState<ActivityType>('Prova');
  const [result, setResult] = useState<ActivityContent | null>(null);

  const currentClass = classes.find(c => c.id === selectedClassId);
  const classEvents = events.filter(e => e.classId === selectedClassId || !e.classId).sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()).slice(0, 5);
  const linkedPlans = plans.filter(p => currentClass?.linkedPlanIds?.includes(p.id));
  const allLinkedLessons = linkedPlans.flatMap(p => p.lessons.map(l => ({ ...l, planTheme: p.theme })));

  const handleGenerate = async () => {
    if (!currentClass) return;
    let topicToUse = '';
    if (knowledgeSource === 'manual') topicToUse = manualTopic;
    else if (knowledgeSource === 'agenda') { const evt = events.find(e => e.id === selectedEventId); topicToUse = evt ? `${evt.title} - ${evt.description || ''}` : ''; }
    else if (knowledgeSource === 'plans') { const selectedLessons = allLinkedLessons.filter(l => selectedLessonIds.includes(l.id)); topicToUse = selectedLessons.map(l => `Aula ${l.number} (${l.title}): ${l.content}`).join('; '); }

    if (!topicToUse) { notify("Por favor, defina o conteúdo para gerar a atividade.", "warning"); return; }
    const finalConfig = customInstructions ? `Instruções adicionais do professor: ${customInstructions}.` : 'Padrão';

    setIsLoading(true);
    try {
      const data = await generateEducationalActivity(selectedType, currentClass.subject, currentClass.grade, [topicToUse], finalConfig);
      setResult(data);
    } catch (e: any) { 
      let msg = e.message || "Erro desconhecido";
      if (msg.includes('PERMISSION_DENIED')) msg = "Erro de permissão na API (Chave inválida ou bloqueada).";
      notify("Erro ao gerar: " + msg, "error"); 
    } finally { setIsLoading(false); }
  };

  const handleSave = async () => {
    if (!currentClass || !result) return;
    setIsSaving(true);
    try {
        const newActivity: GeneratedActivity = { id: '', classId: currentClass.id, type: selectedType, title: result.header.title, content: result, createdAt: new Date().toISOString() };
        await addActivity(newActivity);
        notify("Material salvo na biblioteca da turma com sucesso!", "success");
        setResult(null); setStep(1); setManualTopic(''); setSelectedEventId(''); setSelectedLessonIds([]); setCustomInstructions('');
    } catch (e: any) { notify("Erro ao salvar: " + e.message, "error"); } finally { setIsSaving(false); }
  };

  const toggleLessonSelection = (id: string) => { setSelectedLessonIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); };
  const getActivityIcon = (type: ActivityType) => {
      switch (type) { case 'Prova': return CheckSquare; case 'Atividade Avaliativa': return FileText; case 'Trabalho': return GraduationCap; case 'Apresentação': return Presentation; case 'Atividade Criativa': return Palette; case 'Quiz': return BrainCircuit; default: return FileText; }
  };

  if (result) {
    return (
      <div className="max-w-5xl mx-auto pb-20 animate-fade-in">
        <button onClick={() => setResult(null)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-cyan-600 transition-colors font-bold"><ChevronLeft size={20} /> Voltar para edição</button>
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#020410] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div><h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">{result.header.title}</h1><p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{result.header.subtitle}</p></div>
            <button onClick={handleSave} disabled={isSaving} className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-transform hover:-translate-y-0.5">{isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} Salvar Material</button>
          </div>
          <div className="p-8 bg-white dark:bg-[#0f172a] min-h-[500px] overflow-auto">
             <div className="max-w-3xl mx-auto space-y-8">
                {result.introText && (<div className="prose dark:prose-invert max-w-none"><h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Introdução</h3><p className="text-slate-600 dark:text-slate-300 whitespace-pre-line">{result.introText}</p></div>)}
                {result.questions && result.questions.length > 0 && (<div className="space-y-6"><h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-white/10 pb-2">Questões</h3>{result.questions.map((q, idx) => (<div key={idx} className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-white/5"><div className="flex gap-3"><span className="font-bold text-cyan-600 text-lg">{idx + 1}.</span><div className="flex-1"><p className="font-medium text-slate-800 dark:text-white mb-3">{q.statement}</p>{q.type === 'objective' && q.options && (<ul className="space-y-2">{q.options.map((opt, i) => (<li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600"></div>{opt}</li>))}</ul>)}{q.type === 'discursive' && (<div className="h-20 border-b border-slate-300 dark:border-slate-700 border-dashed mt-2"></div>)}<div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/5 text-xs text-emerald-600 dark:text-emerald-400 font-mono">Gabarito: {q.correctAnswer}</div></div></div></div>))}</div>)}
                {result.slides && result.slides.length > 0 && (<div className="space-y-6"><h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-white/10 pb-2">Slides</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{result.slides.map((slide, idx) => (<div key={idx} className="aspect-video bg-slate-800 rounded-xl p-6 text-white flex flex-col justify-center relative overflow-hidden group"><div className="absolute top-0 left-0 w-2 h-full bg-cyan-500"></div><h4 className="text-xl font-bold mb-4 relative z-10">{slide.title}</h4><ul className="space-y-2 text-sm text-slate-300 relative z-10 list-disc pl-4">{slide.bullets.slice(0, 3).map((b, i) => <li key={i}>{b}</li>)}</ul><div className="absolute bottom-2 right-4 text-xs text-slate-500">Slide {idx + 1}</div></div>))}</div></div>)}
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-fade-in flex flex-col items-center min-h-[80vh] justify-center">
      <div className="text-center mb-10"><h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2">Gerador de Conteúdo Profissional</h1><p className="text-slate-500 dark:text-slate-400 text-lg">Crie materiais didáticos visualmente ricos e estruturados com IA.</p></div>
      <div className="flex items-center gap-2 mb-12">{[1, 2, 3].map(i => (<div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? 'w-12 bg-cyan-600' : step > i ? 'w-12 bg-cyan-200' : 'w-12 bg-slate-200 dark:bg-slate-800'}`}></div>))}</div>
      <div className="bg-white dark:bg-[#0f172a] w-full max-w-4xl rounded-3xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden relative min-h-[500px] flex flex-col">
         {step === 1 && (<div className="flex-1 p-8 md:p-12 flex flex-col animate-fade-in"><h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-8">1. Selecione a Turma</h2>{classes.length === 0 ? (<div className="flex-1 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-10"><Users size={48} className="text-slate-300 mb-4"/><p className="text-slate-500 mb-4">Nenhuma turma encontrada.</p><a href="#" className="text-cyan-600 font-bold hover:underline">Cadastrar Turma</a></div>) : (<div className="grid grid-cols-1 md:grid-cols-3 gap-4">{classes.map(cls => (<button key={cls.id} onClick={() => setSelectedClassId(cls.id)} className={`p-6 rounded-2xl border-2 text-left transition-all hover:-translate-y-1 group ${selectedClassId === cls.id ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' : 'border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 hover:border-cyan-200'}`}><h3 className={`font-bold text-lg mb-1 group-hover:text-cyan-600 ${selectedClassId === cls.id ? 'text-cyan-700 dark:text-cyan-400' : 'text-slate-700 dark:text-white'}`}>{cls.name}</h3><p className="text-sm text-slate-500">{cls.subject} • {cls.grade}</p></button>))}</div>)}</div>)}
         {step === 2 && (
             <div className="flex-1 p-8 md:p-12 flex flex-col animate-fade-in">
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-8">2. Base de Conhecimento</h2>
                 <div className="space-y-6">
                     <div className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${knowledgeSource === 'manual' ? 'border-cyan-500 bg-cyan-50/30 dark:bg-cyan-900/10' : 'border-slate-200 dark:border-white/10'}`} onClick={() => setKnowledgeSource('manual')}>
                         <div className="flex items-center gap-3 mb-4"><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${knowledgeSource === 'manual' ? 'border-cyan-600' : 'border-slate-300'}`}>{knowledgeSource === 'manual' && <div className="w-2.5 h-2.5 rounded-full bg-cyan-600"></div>}</div><span className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Type size={18}/> Digitar Tema Manualmente</span></div>
                         {knowledgeSource === 'manual' && (<input autoFocus value={manualTopic} onChange={(e) => setManualTopic(e.target.value)} placeholder="Ex: Revolução Industrial e seus impactos sociais..." className="w-full p-4 rounded-xl border border-cyan-200 dark:border-cyan-800/50 focus:ring-2 focus:ring-cyan-500 outline-none bg-white dark:bg-black/20 text-slate-800 dark:text-white"/>)}
                     </div>
                     <div className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${knowledgeSource === 'agenda' ? 'border-cyan-500 bg-cyan-50/30 dark:bg-cyan-900/10' : 'border-slate-200 dark:border-white/10'}`} onClick={() => setKnowledgeSource('agenda')}>
                         <div className="flex items-center gap-3 mb-4"><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${knowledgeSource === 'agenda' ? 'border-cyan-600' : 'border-slate-300'}`}>{knowledgeSource === 'agenda' && <div className="w-2.5 h-2.5 rounded-full bg-cyan-600"></div>}</div><span className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-wider flex items-center gap-2"><Calendar size={16} /> Da Sua Agenda</span></div>
                         {knowledgeSource === 'agenda' && (<div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">{classEvents.length === 0 ? (<p className="text-sm text-slate-400 italic p-2">Nenhuma aula recente encontrada para esta turma.</p>) : (classEvents.map(evt => (<div key={evt.id} onClick={(e) => { e.stopPropagation(); setSelectedEventId(evt.id); }} className={`p-3 rounded-lg border flex items-center gap-3 transition-all hover:bg-white dark:hover:bg-white/5 ${selectedEventId === evt.id ? 'border-cyan-500 bg-white dark:bg-white/5 ring-1 ring-cyan-500' : 'border-transparent hover:border-slate-200'}`}><div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedEventId === evt.id ? 'border-cyan-600' : 'border-slate-300'}`}>{selectedEventId === evt.id && <div className="w-2 h-2 rounded-full bg-cyan-600"></div>}</div><div><p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{evt.title}</p><p className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={10}/> {new Date(evt.start).toLocaleDateString()}</p></div></div>)))}</div>)}
                     </div>
                     <div className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${knowledgeSource === 'plans' ? 'border-cyan-500 bg-cyan-50/30 dark:bg-cyan-900/10' : 'border-slate-200 dark:border-white/10'}`} onClick={() => setKnowledgeSource('plans')}>
                         <div className="flex items-center gap-3 mb-4"><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${knowledgeSource === 'plans' ? 'border-cyan-600' : 'border-slate-300'}`}>{knowledgeSource === 'plans' && <div className="w-2.5 h-2.5 rounded-full bg-cyan-600"></div>}</div><span className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-wider flex items-center gap-2"><BookOpen size={16} /> De Planos Vinculados</span></div>
                         {knowledgeSource === 'plans' && (<div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">{allLinkedLessons.length === 0 ? (<p className="text-sm text-slate-400 italic p-2">Nenhum plano de aula vinculado a esta turma.</p>) : (allLinkedLessons.map(lesson => (<div key={lesson.id} onClick={(e) => { e.stopPropagation(); toggleLessonSelection(lesson.id); }} className={`p-3 rounded-lg border flex items-start gap-3 transition-all hover:bg-white dark:hover:bg-white/5 cursor-pointer ${selectedLessonIds.includes(lesson.id) ? 'border-cyan-500 bg-white dark:bg-white/5' : 'border-transparent hover:border-slate-200'}`}><div className={`w-4 h-4 rounded border flex items-center justify-center mt-1 ${selectedLessonIds.includes(lesson.id) ? 'bg-cyan-600 border-cyan-600' : 'border-slate-300'}`}>{selectedLessonIds.includes(lesson.id) && <CheckSquare size={10} className="text-white" />}</div><div><p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Aula {lesson.number}: {lesson.title}</p><p className="text-xs text-slate-400">{lesson.planTheme}</p><p className="text-xs text-slate-500 mt-1 line-clamp-2">{lesson.content}</p></div></div>)))}</div>)}
                     </div>
                     <div className="pt-4 border-t border-slate-200 dark:border-white/10"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Instruções Personalizadas (Opcional)</label><textarea value={customInstructions} onChange={(e) => setCustomInstructions(e.target.value)} placeholder="Ex: Quero 5 questões de múltipla escolha e 3 dissertativas. Foque em análise crítica." className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-sm text-slate-800 dark:text-white resize-none" rows={3}/></div>
                 </div>
             </div>
         )}
         {step === 3 && (<div className="flex-1 p-8 md:p-12 flex flex-col animate-fade-in"><h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-8">3. Tipo de Material</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{(['Prova', 'Atividade Avaliativa', 'Trabalho', 'Apresentação', 'Atividade Criativa', 'Quiz'] as ActivityType[]).map((type) => { const Icon = getActivityIcon(type); const isSelected = selectedType === type; return (<button key={type} onClick={() => setSelectedType(type)} className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-4 transition-all h-40 group ${isSelected ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 shadow-md shadow-cyan-500/10' : 'border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 hover:border-cyan-200 hover:bg-slate-50'}`}><Icon size={32} className={`transition-transform group-hover:scale-110 ${isSelected ? 'text-cyan-600' : 'text-slate-400 dark:text-slate-500 group-hover:text-cyan-500'}`} strokeWidth={1.5}/><span className={`font-bold text-sm ${isSelected ? 'text-cyan-700 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-400'}`}>{type}</span></button>); })}</div></div>)}
         <div className="p-6 border-t border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-[#0b1121]">{step > 1 ? (<button onClick={() => setStep(prev => prev - 1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold px-4 py-2"><ChevronLeft size={20}/> Voltar</button>) : (<div></div>)}{step < 3 ? (<button onClick={() => { if (step === 1 && !selectedClassId) return notify("Selecione uma turma.", "warning"); if (step === 2 && knowledgeSource === 'manual' && !manualTopic) return notify("Digite um tema.", "warning"); if (step === 2 && knowledgeSource === 'agenda' && !selectedEventId) return notify("Selecione uma aula da agenda.", "warning"); if (step === 2 && knowledgeSource === 'plans' && selectedLessonIds.length === 0) return notify("Selecione pelo menos uma aula do plano.", "warning"); setStep(prev => prev + 1); }} className="bg-cyan-400 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-transform hover:-translate-y-0.5">Próximo <ArrowRight size={20}/></button>) : (<button onClick={handleGenerate} disabled={isLoading} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-transform hover:-translate-y-0.5">{isLoading ? <Loader2 className="animate-spin" size={20}/> : <Wand2 size={20}/>} Gerar Material</button>)}</div>
      </div>
    </div>
  );
};