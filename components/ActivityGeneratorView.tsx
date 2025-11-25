import React, { useState } from 'react';
import { 
  Wand2, Loader2, Save, Users, Calendar, BookOpen, Type, 
  CheckSquare, FileText, GraduationCap, Presentation, Palette, BrainCircuit,
  ChevronLeft, ArrowRight
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { generateEducationalActivity } from '../services/geminiService';
import { ActivityContent, ActivityType, GeneratedActivity } from '../types';

export const ActivityGeneratorView: React.FC = () => {
  const { classes, events, plans, addActivity } = useData();
  
  // Controle de Passos
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados dos Dados
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedContentSource, setSelectedContentSource] = useState<'manual' | 'agenda' | 'plan'>('manual');
  const [selectedContentText, setSelectedContentText] = useState('');
  const [manualTopic, setManualTopic] = useState('');
  const [selectedType, setSelectedType] = useState<ActivityType>('Prova');
  
  // Resultado
  const [result, setResult] = useState<ActivityContent | null>(null);

  // Derivados
  const currentClass = classes.find(c => c.id === selectedClassId);
  
  // Filtra conteúdos recentes da agenda e planos para sugerir
  const recentEvents = events
    .filter(e => e.classId === selectedClassId || e.className === currentClass?.name)
    .slice(0, 3);
    
  const recentPlans = plans
    .filter(p => p.className === currentClass?.name)
    .slice(0, 3);

  const handleNext = () => {
    if (step === 1 && selectedClassId) setStep(2);
    else if (step === 2 && (selectedContentText || manualTopic)) setStep(3);
    else if (step === 3) handleGenerate();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleGenerate = async () => {
    if (!currentClass) return;
    setIsLoading(true);

    try {
      // Define o conteúdo final
      const finalContent = selectedContentSource === 'manual' ? manualTopic : selectedContentText;
      const contentsArray = [finalContent];

      const data = await generateEducationalActivity(
        selectedType, 
        currentClass.subject, 
        currentClass.grade, 
        contentsArray, 
        'Padrão'
      );
      
      setResult(data);
    } catch (e: any) { 
      alert("Erro ao gerar atividade: " + e.message); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleSave = async () => {
    if (!currentClass || !result) return;
    setIsSaving(true);
    
    try {
        const newActivity: GeneratedActivity = {
           id: '', // O ID será gerado pelo banco
           classId: currentClass.id,
           type: selectedType,
           title: result.header.title,
           content: result,
           createdAt: new Date().toISOString(),
           relatedLessonIds: []
        };
        
        // Usa a função correta para inserir na tabela activities
        await addActivity(newActivity);

        alert("Atividade salva com sucesso na turma!");
        
        // Reset
        setResult(null);
        setStep(1);
        setSelectedClassId('');
        setManualTopic('');
        setSelectedContentText('');
    } catch (e: any) {
        alert("Erro ao salvar atividade: " + e.message);
    } finally {
        setIsSaving(false);
    }
  };

  // --- RENDERIZADORES DE ETAPAS ---

  const renderProgressBar = () => (
    <div className="flex justify-center mb-8 gap-2">
      {[1, 2, 3].map(i => (
        <div 
          key={i} 
          className={`h-2 w-16 rounded-full transition-colors ${
            step >= i ? 'bg-cyan-600' : 'bg-slate-200 dark:bg-slate-700'
          }`}
        />
      ))}
    </div>
  );

  const renderStep1_ClassSelection = () => (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">1. Selecione a Turma</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.length === 0 ? (
          <div className="col-span-3 text-center py-10 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
            Nenhuma turma encontrada. Crie turmas no menu "Turmas".
          </div>
        ) : (
          classes.map(cls => (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`p-6 rounded-xl border text-left transition-all group ${
                selectedClassId === cls.id 
                  ? 'bg-cyan-50 border-cyan-500 ring-1 ring-cyan-500' 
                  : 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-white/10 hover:border-cyan-400'
              }`}
            >
              <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-cyan-700">{cls.name}</h3>
              <p className="text-sm text-slate-500">{cls.subject} • {cls.grade}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );

  const renderStep2_ContentSelection = () => (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">2. Base de Conhecimento</h2>
      
      <div className="space-y-4">
        {/* Opção Manual */}
        <label 
          className={`block p-4 rounded-xl border cursor-pointer transition-all ${
            selectedContentSource === 'manual' 
              ? 'bg-cyan-50 border-cyan-500 ring-1 ring-cyan-500' 
              : 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-white/10 hover:border-cyan-300'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <input 
              type="radio" 
              name="source" 
              checked={selectedContentSource === 'manual'} 
              onChange={() => setSelectedContentSource('manual')}
              className="text-cyan-600 focus:ring-cyan-500"
            />
            <span className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Type size={18}/> Digitar Tema Manualmente</span>
          </div>
          {selectedContentSource === 'manual' && (
            <input 
              autoFocus
              type="text" 
              placeholder="Ex: Revolução Industrial e seus impactos sociais..."
              className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-900"
              value={manualTopic}
              onChange={(e) => setManualTopic(e.target.value)}
            />
          )}
        </label>

        {/* Sugestões da Agenda */}
        {recentEvents.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase ml-1">Da sua Agenda</p>
            {recentEvents.map(evt => (
              <label 
                key={evt.id}
                className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedContentSource === 'agenda' && selectedContentText === evt.title
                    ? 'bg-cyan-50 border-cyan-500 ring-1 ring-cyan-500' 
                    : 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-white/10 hover:border-cyan-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="source" 
                    checked={selectedContentSource === 'agenda' && selectedContentText === evt.title} 
                    onChange={() => {
                      setSelectedContentSource('agenda');
                      setSelectedContentText(evt.title);
                    }}
                    className="text-cyan-600 focus:ring-cyan-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white block">{evt.title}</span>
                    <span className="text-xs text-slate-400 uppercase flex items-center gap-1"><Calendar size={10}/> Agenda: {new Date(evt.start).toLocaleDateString()}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3_TypeSelection = () => {
    const types: { id: ActivityType, icon: any, label: string }[] = [
      { id: 'Prova', icon: CheckSquare, label: 'Prova' },
      { id: 'Atividade Avaliativa', icon: FileText, label: 'Atividade Avaliativa' },
      { id: 'Trabalho', icon: GraduationCap, label: 'Trabalho' },
      { id: 'Apresentação', icon: Presentation, label: 'Apresentação' },
      { id: 'Atividade Criativa', icon: Palette, label: 'Atividade Criativa' },
      { id: 'Quiz', icon: BrainCircuit, label: 'Quiz' },
    ];

    return (
      <div className="animate-fade-in">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">3. Tipo de Material</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {types.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`p-6 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all h-40 ${
                selectedType === t.id
                  ? 'bg-cyan-50 border-cyan-500 ring-1 ring-cyan-500 text-cyan-700' 
                  : 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-cyan-400 hover:text-cyan-600'
              }`}
            >
              <t.icon size={32} strokeWidth={1.5} />
              <span className="font-bold text-sm">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // --- RENDERIZADORES ---

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-fade-in">
        <Loader2 className="animate-spin text-cyan-600 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Criando Material...</h2>
        <p className="text-slate-500 text-center max-w-md">
          A IA está estruturando sua {selectedType} sobre "{selectedContentSource === 'manual' ? manualTopic : selectedContentText}".
        </p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-4xl mx-auto py-8 animate-fade-in">
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden">
          <div className="p-8 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#020410]">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-bold uppercase tracking-wider">
                {selectedType}
              </span>
              <button onClick={() => setResult(null)} className="text-slate-400 hover:text-red-500 text-sm font-bold">
                Descartar
              </button>
            </div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2">{result.header.title}</h1>
            <p className="text-slate-500 dark:text-slate-400">{result.header.subtitle}</p>
          </div>

          <div className="p-8 space-y-8 bg-slate-50/50 dark:bg-[#0b1121]">
            {/* Preview do Conteúdo (Resumo) */}
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-2">Introdução Gerada</h3>
              <p className="text-slate-700 dark:text-slate-300 italic bg-white dark:bg-black/20 p-4 rounded-lg border border-slate-100 dark:border-white/5">
                "{result.introText}"
              </p>
              
              <div className="mt-6 flex gap-4">
                <div className="flex-1 bg-white dark:bg-black/20 p-4 rounded-lg border border-slate-100 dark:border-white/5">
                  <span className="block text-2xl font-bold text-slate-800 dark:text-white">{result.questions?.length || 0}</span>
                  <span className="text-xs text-slate-500 uppercase font-bold">Questões</span>
                </div>
                <div className="flex-1 bg-white dark:bg-black/20 p-4 rounded-lg border border-slate-100 dark:border-white/5">
                   <span className="block text-2xl font-bold text-slate-800 dark:text-white">{result.slides?.length || 0}</span>
                   <span className="text-xs text-slate-500 uppercase font-bold">Slides</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3 transition-transform hover:-translate-y-1 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20} />}
              {isSaving ? 'Salvando...' : `Salvar na Turma (${currentClass?.name})`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 text-center md:text-left">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Gerador de Conteúdo Profissional</h1>
        <p className="text-slate-500 dark:text-slate-400">Crie materiais didáticos visualmente ricos e estruturados com IA.</p>
      </div>

      <div className="bg-white dark:bg-white/[0.02] rounded-3xl shadow-xl border border-slate-200 dark:border-white/10 p-8 min-h-[500px] flex flex-col relative">
        {renderProgressBar()}

        <div className="flex-1">
          {step === 1 && renderStep1_ClassSelection()}
          {step === 2 && renderStep2_ContentSelection()}
          {step === 3 && renderStep3_TypeSelection()}
        </div>

        {/* Footer Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100 dark:border-white/5">
          <button 
            onClick={handleBack}
            disabled={step === 1}
            className={`flex items-center gap-2 font-bold transition-colors ${step === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}
          >
            <ChevronLeft size={20} /> Voltar
          </button>

          {step < 3 ? (
             <button 
               onClick={handleNext}
               disabled={step === 1 ? !selectedClassId : !selectedContentText && !manualTopic}
               className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
             >
               Próximo <ArrowRight size={20} />
             </button>
          ) : (
            <button 
               onClick={handleGenerate}
               className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all hover:scale-105"
             >
               <Wand2 size={20} /> Gerar Material
             </button>
          )}
        </div>
      </div>
    </div>
  );
};