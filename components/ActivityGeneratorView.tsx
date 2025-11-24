
import React, { useState, useRef } from 'react';
import { 
  BrainCircuit, ArrowRight, ChevronLeft, ChevronRight, CheckSquare, 
  FileText, Presentation, GraduationCap, Palette, Loader2, Save, 
  Download, Copy, Calendar, X, Play, Maximize2, Image as ImageIcon,
  Edit3, Printer, Wand2, LayoutTemplate
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { generateEducationalActivity } from '../services/geminiService';
import { generatePPTX } from '../services/pptService';
import { GeneratedActivity, ActivityContent, Slide, PresentationThemeId, PresentationPaletteId } from '../types';

declare global {
  interface Window {
    html2pdf: any;
  }
}

export const ActivityGeneratorView: React.FC = () => {
  const { classes, updateClass } = useData();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Seleções
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [activityType, setActivityType] = useState<'Prova' | 'Atividade Avaliativa' | 'Trabalho' | 'Apresentação' | 'Atividade Criativa' | 'Quiz'>('Prova');
  const [config, setConfig] = useState({ difficulty: 'Médio', count: 5, details: '' });
  
  // Visual Configuration
  const [selectedTheme, setSelectedTheme] = useState<PresentationThemeId>('modern');
  const [selectedPalette, setSelectedPalette] = useState<PresentationPaletteId>('minimalist');

  // Resultado Estruturado
  const [result, setResult] = useState<ActivityContent | null>(null);

  // Estados do Player de Apresentação
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);

  const { events, plans } = useData();
  const currentClass = classes.find(c => c.id === selectedClassId);
  
  const getClassLessons = () => {
    if (!selectedClassId) return [];
    const agendaLessons = events.filter(e => e.classId === selectedClassId && e.type === 'aula').map(e => ({ id: e.id, title: e.title, content: e.description || '', source: 'Agenda' }));
    const metrarLessons = plans.filter(p => currentClass?.linkedPlanIds.includes(p.id)).flatMap(p => p.lessons.map(l => ({ id: l.id, title: l.title, content: l.content, source: 'Plano' })));
    return [...agendaLessons, ...metrarLessons];
  };
  const availableLessons = getClassLessons();

  const handleGenerate = async () => {
    if (!currentClass) return;
    setIsLoading(true);
    try {
      const contents = availableLessons.filter(l => selectedLessons.includes(l.id)).map(l => `${l.title}: ${l.content}`);
      const generatedData = await generateEducationalActivity(
        activityType, currentClass.subject, currentClass.grade, contents, 
        `Dificuldade: ${config.difficulty}. Qtd: ${config.count}. Detalhes: ${config.details}`,
        selectedTheme,
        selectedPalette
      );
      setResult(generatedData);
    } catch (e) { alert("Erro ao gerar. Tente novamente."); }
    finally { setIsLoading(false); }
  };

  const handleSave = () => {
    if (!currentClass || !result) return;
    const newActivity: GeneratedActivity = {
      id: crypto.randomUUID(), type: activityType, title: result.header.title,
      content: result, createdAt: new Date().toISOString(), relatedLessonIds: selectedLessons
    };
    updateClass({ ...currentClass, generatedActivities: [...currentClass.generatedActivities, newActivity] });
    alert(`Atividade "${result.header.title}" salva com sucesso na turma ${currentClass.name}!`);
  };

  const handleDownload = (format: 'pdf' | 'docx' | 'pptx') => {
    if (!result) return;
    
    if (format === 'pptx') {
      if (result.structureType === 'presentation') {
         generatePPTX(result);
      } else {
         alert("O formato PPTX é exclusivo para apresentações.");
      }
    } else if (format === 'pdf') {
      const isPresentation = result.structureType === 'presentation';
      const elementId = isPresentation ? 'presentation-full-render-for-pdf' : 'document-render';
      const element = document.getElementById(elementId);

      if (element && window.html2pdf) {
        const opt = {
          margin: isPresentation ? 0 : [10, 10, 10, 10], 
          filename: `Pro7_${result.header.title.replace(/[^a-z0-9]/gi, '_')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: isPresentation ? 'landscape' : 'portrait' 
          }
        };
        window.html2pdf().set(opt).from(element).save();
      } else {
        window.print();
      }
    } else {
       window.print();
    }
  };

  const getPreviewStyles = () => {
    const pId = result?.paletteId || selectedPalette;
    const tId = result?.themeId || selectedTheme;
    
    const palettes: Record<PresentationPaletteId, any> = {
      minimalist: { bg: 'bg-white', text: 'text-slate-800', primary: 'text-teal-700', accent: 'bg-teal-400', secondary: 'text-slate-400' },
      classic: { bg: 'bg-[#FAF9F6]', text: 'text-[#1B2845]', primary: 'text-[#1B2845]', accent: 'bg-[#C9A227]', secondary: 'text-[#6B4226]' },
      vibrant: { bg: 'bg-gray-900', text: 'text-gray-100', primary: 'text-cyan-400', accent: 'bg-pink-500', secondary: 'text-purple-400' },
      school: { bg: 'bg-white', text: 'text-gray-800', primary: 'text-blue-600', accent: 'bg-red-500', secondary: 'text-yellow-500' },
      contemporary: { bg: 'bg-[#2B2D42]', text: 'text-white', primary: 'text-[#00A6FB]', accent: 'bg-[#EF233C]', secondary: 'text-gray-400' }
    };

    const themes: Record<PresentationThemeId, string> = {
      modern: 'font-sans',
      classic: 'font-serif',
      creative: 'font-mono' 
    };

    return { ...palettes[pId], font: themes[tId] };
  };

  const styles = getPreviewStyles();

  const renderSingleSlideContent = (slide: Slide, index: number, isPreview = false) => {
      const s = styles;
      return (
        <div className={`aspect-video relative overflow-hidden flex flex-col transition-all duration-500 ${s.bg} ${isPresenting ? 'fixed inset-0 z-[100] w-screen h-screen' : 'w-full rounded-xl shadow-2xl'} ${!isPresenting && !isPreview ? 'shadow-2xl' : ''}`}>
             <div className="absolute inset-0 pointer-events-none overflow-hidden">
                 <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 ${s.accent}`}></div>
                 <div className={`absolute top-0 left-0 w-2 h-full opacity-50 ${s.accent}`}></div>
             </div>
    
             <div className={`relative z-10 flex-1 p-12 flex flex-col ${s.font} ${s.text}`}>
                {index === 0 ? (
                   <div className="flex-1 flex flex-col justify-center items-center text-center animate-fade-in">
                      <div className={`w-32 h-2 mb-6 ${s.accent}`}></div>
                      <h1 contentEditable suppressContentEditableWarning className={`text-5xl font-black mb-4 ${s.primary} outline-none`}>{slide.title}</h1>
                      <p contentEditable suppressContentEditableWarning className={`text-2xl ${s.secondary} mb-8 outline-none`}>{result?.header.subtitle}</p>
                      
                      {result?.coverImage ? (
                        <div className="rounded-xl overflow-hidden shadow-lg w-[40%] aspect-video border-4 border-white/20">
                           <img src={result.coverImage} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-1/3 h-1/3 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400">Gerando Capa...</div>
                      )}
                   </div>
                ) : (
                   <div className="flex-1 grid grid-cols-2 gap-12 items-center animate-fade-in">
                      <div>
                        <h2 contentEditable suppressContentEditableWarning className={`text-4xl font-bold mb-8 border-l-8 pl-6 outline-none ${s.primary} border-current`}>{slide.title}</h2>
                        <ul className="space-y-6">
                           {slide.bullets.map((b, i) => (
                             <li key={i} className="text-xl flex items-start gap-3">
                                <span className={`w-3 h-3 rounded-full mt-2 shrink-0 ${s.accent}`}></span>
                                <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-white/20 rounded px-1">{b}</span>
                             </li>
                           ))}
                        </ul>
                      </div>
                      <div className={`flex items-center justify-center rounded-2xl h-full overflow-hidden shadow-inner bg-black/5 relative`}>
                         {slide.imageUrl ? (
                            <img src={slide.imageUrl} className="w-full h-full object-cover" />
                         ) : (
                            <div className="flex flex-col items-center text-slate-300">
                               <ImageIcon size={64} />
                               <span className="text-xs mt-2">Imagem IA...</span>
                            </div>
                         )}
                      </div>
                   </div>
                )}
             </div>
    
             {!isPresenting && !isPreview && (
                 <div className="absolute bottom-4 left-0 w-full flex justify-between px-8 text-sm font-mono opacity-0 hover:opacity-100 transition-opacity bg-black/10 backdrop-blur-sm py-2">
                    <span>SLIDE {index + 1} / {result?.slides?.length}</span>
                    <span>{result?.header.title}</span>
                 </div>
             )}
          </div>
      );
  }

  const renderPresentation = () => {
    const slide = result?.slides?.[currentSlideIndex];
    if (!slide) return <div>Sem slides</div>;

    return (
        <>
            <div id="presentation-render">
                {renderSingleSlideContent(slide, currentSlideIndex)}
            </div>
            <div id="presentation-full-render-for-pdf" className="fixed top-0 left-[-9999px]">
                {result?.slides?.map((s, idx) => (
                    <div key={idx} className="mb-4 w-[297mm] h-[210mm] overflow-hidden">
                        {renderSingleSlideContent(s, idx, true)}
                    </div>
                ))}
            </div>
        </>
    );
  };

  const renderDocument = () => (
    <div id="document-render" className="w-[210mm] min-h-[297mm] bg-white mx-auto shadow-2xl p-[20mm] relative text-slate-900 font-serif print:shadow-none print:w-full document-container">
       <div className="border-b-2 border-slate-800 pb-4 mb-8 flex gap-6 items-start">
          <div className="w-24 h-24 bg-slate-100 flex items-center justify-center border border-slate-300 overflow-hidden">
             {result?.coverImage ? <img src={result.coverImage} className="w-full h-full object-cover" /> : <GraduationCap size={40} className="text-slate-300"/>}
          </div>
          <div className="flex-1">
             <h1 className="text-2xl font-bold uppercase tracking-wide">{result?.header.school}</h1>
             <div className="grid grid-cols-2 gap-2 text-sm mt-2 font-sans">
                <p><strong>Professor:</strong> {result?.header.teacher}</p>
                <p><strong>Data:</strong> {result?.header.date}</p>
                <p><strong>Turma:</strong> {result?.header.class}</p>
                <p><strong>Disciplina:</strong> {result?.header.discipline}</p>
             </div>
          </div>
       </div>

       <div className="text-center mb-8">
          <h2 contentEditable suppressContentEditableWarning className="text-xl font-bold uppercase border-b border-slate-300 inline-block px-8 py-1 outline-none">{result?.header.title}</h2>
          {result?.header.subtitle && <p contentEditable suppressContentEditableWarning className="text-slate-600 italic mt-2 outline-none">{result.header.subtitle}</p>}
       </div>

       {result?.introText && (
         <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg mb-8 text-sm italic font-sans">
            <strong>Instruções:</strong> <span contentEditable suppressContentEditableWarning className="outline-none">{result.introText}</span>
         </div>
       )}

       <div className="space-y-8">
          {result?.questions?.map((q) => (
            <div key={q.number} className="break-inside-avoid">
               <div className="flex gap-2 font-bold text-lg mb-2">
                  <span>{q.number}.</span>
                  <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-yellow-50">{q.statement}</span>
               </div>
               
               {q.type === 'objective' && (
                 <div className="pl-6 space-y-1 font-sans">
                    {q.options?.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                         <div className="w-4 h-4 border border-slate-400 rounded-full"></div>
                         <span contentEditable suppressContentEditableWarning className="outline-none">{opt}</span>
                      </div>
                    ))}
                 </div>
               )}

               {q.type === 'discursive' && (
                 <div className="mt-2 space-y-3">
                    {Array.from({ length: q.lines || 3 }).map((_, i) => (
                      <div key={i} className="border-b border-slate-300 h-6"></div>
                    ))}
                 </div>
               )}
            </div>
          ))}
       </div>
       
       <div className="mt-12 pt-4 border-t border-slate-300 text-center text-xs text-slate-400 font-sans">
          Material gerado pelo sistema Pro 7 - {new Date().getFullYear()}
       </div>
    </div>
  );

  // --- RENDERIZAR RESULTADO ---
  if (result) {
    return (
      <div className="min-h-screen bg-slate-100 pb-20 animate-fade-in">
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm no-print">
          <div className="flex items-center gap-4">
             <button onClick={() => setResult(null)} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-bold text-sm">
               <ChevronLeft size={16}/> Voltar
             </button>
             <div className="h-6 w-px bg-slate-200"></div>
             <h2 className="font-bold text-slate-800">{result.header.title}</h2>
          </div>
          
          <div className="flex items-center gap-2">
             {result.structureType === 'presentation' && (
                <div className="flex items-center gap-2 mr-4 bg-slate-100 rounded-lg p-1">
                   <button onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))} className="p-2 hover:bg-white rounded shadow-sm"><ChevronLeft size={16}/></button>
                   <span className="text-xs font-mono font-bold w-12 text-center">{currentSlideIndex + 1} / {result.slides?.length}</span>
                   <button onClick={() => setCurrentSlideIndex(Math.min((result.slides?.length || 1) - 1, currentSlideIndex + 1))} className="p-2 hover:bg-white rounded shadow-sm"><ChevronRight size={16}/></button>
                   <button onClick={() => setIsPresenting(!isPresenting)} className="p-2 hover:bg-cyan-100 text-cyan-600 rounded ml-2" title="Tela Cheia"><Maximize2 size={16}/></button>
                </div>
             )}

             <button onClick={() => handleDownload('pdf')} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-lg flex items-center gap-2 text-sm">
               <Printer size={16}/> PDF
             </button>
             {result.structureType === 'presentation' && (
               <button onClick={() => handleDownload('pptx')} className="px-4 py-2 text-orange-600 font-bold hover:bg-orange-50 rounded-lg flex items-center gap-2 text-sm">
                 <Presentation size={16}/> Baixar PPTX
               </button>
             )}
             <button onClick={handleSave} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg flex items-center gap-2 text-sm shadow-lg shadow-cyan-500/20">
               <Save size={16}/> Salvar na Turma
             </button>
          </div>
        </div>

        <div className="p-8 overflow-auto h-[calc(100vh-80px)] flex justify-center bg-slate-200/50 print:bg-white print:h-auto print:p-0 print:overflow-visible">
           {result.structureType === 'presentation' ? renderPresentation() : renderDocument()}
        </div>
      </div>
    );
  }

  // --- RENDERIZAR WIZARD ---
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Gerador de Conteúdo Profissional</h1>
        <p className="text-slate-500">Crie materiais didáticos visualmente ricos e estruturados com IA.</p>
      </div>

      <div className="flex justify-center gap-2 mb-10">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`h-2 w-12 rounded-full transition-all ${step >= i ? 'bg-cyan-600' : 'bg-slate-200'}`} />
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 min-h-[400px]">
        {step === 1 && (
          <div className="space-y-6 animate-slide-in-from-bottom-4">
            <h2 className="text-xl font-bold text-slate-800">1. Selecione a Turma</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map(cls => (
                <button key={cls.id} onClick={() => { setSelectedClassId(cls.id); setStep(2); }} className="p-5 border border-slate-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 text-left transition-all group">
                  <h3 className="font-bold text-slate-800 group-hover:text-cyan-700">{cls.name}</h3>
                  <p className="text-sm text-slate-500">{cls.subject} • {cls.grade}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-slide-in-from-bottom-4">
            <h2 className="text-xl font-bold text-slate-800">2. Base de Conhecimento</h2>
            <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-xl p-2">
              {availableLessons.map(l => (
                <label key={l.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <input type="checkbox" checked={selectedLessons.includes(l.id)} onChange={() => setSelectedLessons(prev => prev.includes(l.id) ? prev.filter(x => x !== l.id) : [...prev, l.id])} className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500" />
                  <div>
                    <span className="font-bold text-slate-700 block">{l.title}</span>
                    <span className="text-xs text-slate-400 uppercase">{l.source}</span>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="text-slate-500 font-bold">Voltar</button>
              <button onClick={() => setStep(3)} disabled={selectedLessons.length === 0} className="bg-cyan-600 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50">Próximo</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-slide-in-from-bottom-4">
            <h2 className="text-xl font-bold text-slate-800">3. Tipo de Material</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { id: 'Prova', icon: CheckSquare }, { id: 'Atividade Avaliativa', icon: FileText },
                { id: 'Trabalho', icon: GraduationCap }, { id: 'Apresentação', icon: Presentation },
                { id: 'Atividade Criativa', icon: Palette }, { id: 'Quiz', icon: BrainCircuit }
              ].map(t => (
                <button key={t.id} onClick={() => { setActivityType(t.id as any); setStep(4); }} className="p-6 border border-slate-200 rounded-xl hover:border-cyan-500 hover:shadow-lg flex flex-col items-center gap-3 transition-all text-center">
                  <t.icon size={32} className="text-slate-400" />
                  <span className="font-bold text-slate-700">{t.id}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} className="text-slate-500 font-bold mt-4">Voltar</button>
          </div>
        )}

        {step === 4 && (
           <div className="space-y-6 animate-slide-in-from-bottom-4">
             <h2 className="text-xl font-bold text-slate-800">4. Estilo Visual</h2>
             
             {/* TEMAS */}
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Modelo de Layout</label>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { id: 'modern', name: 'Moderno', desc: 'Limpo e Corporativo' },
                        { id: 'classic', name: 'Clássico', desc: 'Elegante e Sério' },
                        { id: 'creative', name: 'Criativo', desc: 'Jovem e Dinâmico' }
                    ].map(t => (
                        <button key={t.id} onClick={() => setSelectedTheme(t.id as any)} className={`p-4 border rounded-xl text-left transition-all ${selectedTheme === t.id ? 'ring-2 ring-cyan-500 bg-cyan-50 border-cyan-500' : 'hover:bg-slate-50'}`}>
                           <h3 className="font-bold text-slate-800">{t.name}</h3>
                           <p className="text-xs text-slate-500">{t.desc}</p>
                        </button>
                    ))}
                </div>
             </div>

             {/* PALETAS */}
             <div className="space-y-2 mt-4">
                <label className="text-xs font-bold text-slate-500 uppercase">Paleta de Cores</label>
                <div className="grid grid-cols-5 gap-2">
                    {[
                        { id: 'minimalist', name: 'Minimal', colors: ['bg-white', 'bg-teal-700'] },
                        { id: 'classic', name: 'Gold', colors: ['bg-[#FAF9F6]', 'bg-[#1B2845]'] },
                        { id: 'vibrant', name: 'Neon', colors: ['bg-gray-900', 'bg-cyan-400'] },
                        { id: 'school', name: 'Escolar', colors: ['bg-white', 'bg-blue-600'] },
                        { id: 'contemporary', name: 'Dark', colors: ['bg-[#2B2D42]', 'bg-[#EF233C]'] }
                    ].map(p => (
                        <button key={p.id} onClick={() => setSelectedPalette(p.id as any)} className={`p-2 border rounded-xl flex flex-col items-center gap-2 transition-all ${selectedPalette === p.id ? 'ring-2 ring-cyan-500 scale-105' : 'opacity-70 hover:opacity-100'}`}>
                            <div className="flex gap-1">
                                {p.colors.map((c, i) => <div key={i} className={`w-4 h-4 rounded-full border border-black/10 ${c}`}></div>)}
                            </div>
                            <span className="text-[10px] font-bold text-slate-600">{p.name}</span>
                        </button>
                    ))}
                </div>
             </div>

             <div className="flex justify-between mt-6">
                <button onClick={() => setStep(3)} className="text-slate-500 font-bold">Voltar</button>
                <button onClick={() => setStep(5)} className="bg-cyan-600 text-white px-6 py-2 rounded-lg font-bold">Próximo</button>
             </div>
           </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-slide-in-from-bottom-4">
            <h2 className="text-xl font-bold text-slate-800">Configuração Final</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dificuldade</label>
                <select value={config.difficulty} onChange={e => setConfig({...config, difficulty: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 font-bold">
                  <option>Fácil</option><option>Médio</option><option>Difícil</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Qtd. Itens/Slides</label>
                <input type="number" value={config.count} onChange={e => setConfig({...config, count: Number(e.target.value)})} className="w-full p-3 border rounded-xl bg-slate-50 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Detalhes Extras</label>
                <textarea value={config.details} onChange={e => setConfig({...config, details: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 resize-none" rows={3} placeholder="Ex: Focar em exemplos práticos..." />
              </div>
            </div>
            <button onClick={handleGenerate} disabled={isLoading} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
              {isLoading ? "Gerando Material Rico..." : "Gerar com IA"}
            </button>
            <button onClick={() => setStep(4)} className="text-slate-500 font-bold w-full mt-2">Voltar</button>
          </div>
        )}
      </div>
    </div>
  );
};
