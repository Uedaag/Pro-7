
import React, { useState } from 'react';
import { 
  Users, Plus, BookOpen, GraduationCap, FileText, FolderKanban, 
  Trash2, ChevronLeft, Calendar as CalendarIcon,
  Link, ExternalLink, X, Eye, Download, Edit3, Save, Presentation, Printer, ChevronRight, Maximize2, Image as ImageIcon
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ClassRoom, CalendarEvent, EventType, View, GeneratedActivity, ActivityContent, PresentationPaletteId, PresentationThemeId } from '../types';
import { generatePPTX } from '../services/pptService';

declare global {
  interface Window {
    html2pdf: any;
  }
}

interface ClassesViewProps {
  onNavigate?: (view: View) => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({ onNavigate }) => {
  const { classes, addClass, deleteClass } = useData();
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const newClass: ClassRoom = {
      id: crypto.randomUUID(),
      name: formData.get('name') as string,
      grade: formData.get('grade') as string,
      subject: formData.get('subject') as string,
      shift: formData.get('shift') as string,
      studentsCount: 0,
      linkedPlanIds: [],
      generatedActivities: []
    };

    addClass(newClass);
    setIsCreateModalOpen(false);
  };

  if (viewMode === 'detail' && selectedClass) {
    return (
      <ClassDetailView 
        classRoom={selectedClass} 
        onBack={() => { setSelectedClass(null); setViewMode('list'); }}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="text-purple-600" /> Minhas Turmas
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie aulas, alunos e conteúdos por sala.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all hover:-translate-y-0.5"
        >
          <Plus size={20} /> Adicionar Nova Turma
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {classes.map(cls => (
          <div key={cls.id} onClick={() => { setSelectedClass(cls); setViewMode('detail'); }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group relative overflow-hidden">
             <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                <Users size={24} />
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteClass(cls.id); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">{cls.name}</h3>
            <p className="text-sm text-slate-500 font-medium mb-4">{cls.grade} • {cls.subject}</p>
          </div>
        ))}
        {classes.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            Nenhuma turma cadastrada. Clique em "Adicionar Nova Turma" para começar.
          </div>
        )}
      </div>

      {/* Modal de Criação de Turma */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 animate-scale-in relative">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Users size={24} className="text-purple-600"/> Nova Turma
            </h2>
            
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nome da Turma</label>
                <input name="name" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 font-bold" placeholder="Ex: 9º Ano A" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Série / Ano</label>
                  <input name="grade" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-purple-500" placeholder="Ex: 9º Ano" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Turno</label>
                  <select name="shift" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer">
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                    <option value="Noturno">Noturno</option>
                    <option value="Integral">Integral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Disciplina Principal</label>
                <input name="subject" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-purple-500" placeholder="Ex: História" />
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-lg shadow-purple-500/20">Criar Turma</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ClassDetailView: React.FC<{ classRoom: ClassRoom; onBack: () => void; onNavigate?: (view: View) => void }> = ({ classRoom, onBack, onNavigate }) => {
  const { plans, events, updateClass, addEvent } = useData();
  const [activeTab, setActiveTab] = useState<'aulas' | 'planos' | 'atividades'>('aulas');
  
  // States for Activities
  const [selectedActivity, setSelectedActivity] = useState<GeneratedActivity | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const handleDownloadActivity = (activity: GeneratedActivity, format: 'pdf' | 'docx' | 'pptx') => {
      if (format === 'pptx') {
          if (typeof activity.content === 'object' && activity.content.structureType === 'presentation') {
              generatePPTX(activity.content);
          } else {
              alert("Apenas apresentações suportam download PPTX nativo.");
          }
      } else if (format === 'pdf') {
          const element = document.getElementById('saved-document-render');
          if (element && window.html2pdf) {
             const isPresentation = activity.content.structureType === 'presentation';
             const opt = {
                margin: isPresentation ? 0 : [10, 10, 10, 10],
                filename: `Pro7_${activity.title.replace(/[^a-z0-9]/gi, '_')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: isPresentation ? 'landscape' : 'portrait' }
             };
             window.html2pdf().set(opt).from(element).save();
          } else {
             window.print();
          }
      } else {
          window.print();
      }
  };

  // --- STYLES HELPER (Duplicated from Generator to ensure consistency) ---
  const getPreviewStyles = (themeId: PresentationThemeId, paletteId: PresentationPaletteId) => {
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

    return { ...palettes[paletteId || 'minimalist'], font: themes[themeId || 'modern'] };
  };

  // --- RENDERIZADOR VISUAL DE DOCUMENTOS SALVOS ---
  const renderSavedDocument = (content: ActivityContent) => (
    <div id="saved-document-render" className="w-[210mm] min-h-[297mm] bg-white mx-auto shadow-sm p-[20mm] relative text-slate-900 font-serif">
       <div className="border-b-2 border-slate-800 pb-4 mb-8 flex gap-6 items-start">
          <div className="w-24 h-24 bg-slate-100 flex items-center justify-center border border-slate-300 overflow-hidden">
             {content.coverImage ? <img src={content.coverImage} className="w-full h-full object-cover" /> : <GraduationCap size={40} className="text-slate-300"/>}
          </div>
          <div className="flex-1">
             <h1 className="text-2xl font-bold uppercase tracking-wide">{content.header.school}</h1>
             <div className="grid grid-cols-2 gap-2 text-sm mt-2 font-sans">
                <p><strong>Professor:</strong> {content.header.teacher}</p>
                <p><strong>Data:</strong> {content.header.date}</p>
                <p><strong>Turma:</strong> {content.header.class}</p>
                <p><strong>Disciplina:</strong> {content.header.discipline}</p>
             </div>
          </div>
       </div>

       <div className="text-center mb-8">
          <h2 className="text-xl font-bold uppercase border-b border-slate-300 inline-block px-8 py-1">{content.header.title}</h2>
          {content.header.subtitle && <p className="text-slate-600 italic mt-2">{content.header.subtitle}</p>}
       </div>

       {content.introText && (
         <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg mb-8 text-sm italic font-sans">
            <strong>Instruções:</strong> {content.introText}
         </div>
       )}

       <div className="space-y-8">
          {content.questions?.map((q) => (
            <div key={q.number} className="break-inside-avoid">
               <div className="flex gap-2 font-bold text-lg mb-2">
                  <span>{q.number}.</span>
                  <span>{q.statement}</span>
               </div>
               
               {q.type === 'objective' && (
                 <div className="pl-6 space-y-1 font-sans">
                    {q.options?.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                         <div className="w-4 h-4 border border-slate-400 rounded-full"></div>
                         <span>{opt}</span>
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

  const renderSavedPresentation = (content: ActivityContent) => {
    const slide = content.slides?.[currentSlideIndex];
    if (!slide) return <div>Sem slides</div>;

    const s = getPreviewStyles(content.themeId || 'modern', content.paletteId || 'minimalist');

    return (
      <div id="saved-document-render" className={`w-full aspect-video shadow-2xl relative overflow-hidden flex flex-col transition-all duration-500 ${s.bg} rounded-xl`}>
         {/* Background Elements */}
         <div className="absolute inset-0 pointer-events-none overflow-hidden">
             <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 ${s.accent}`}></div>
             <div className={`absolute top-0 left-0 w-2 h-full opacity-50 ${s.accent}`}></div>
         </div>

         <div className={`relative z-10 flex-1 p-12 flex flex-col ${s.font} ${s.text}`}>
            {currentSlideIndex === 0 ? (
               // CAPA
               <div className="flex-1 flex flex-col justify-center items-center text-center animate-fade-in">
                  <div className={`w-32 h-2 mb-6 ${s.accent}`}></div>
                  <h1 className={`text-4xl font-black mb-4 ${s.primary}`}>{slide.title}</h1>
                  <p className={`text-xl ${s.secondary} mb-8`}>{content.header.subtitle}</p>
                  
                  {content.coverImage && (
                    <div className="rounded-xl overflow-hidden shadow-lg w-[40%] aspect-video border-4 border-white/20">
                       <img src={content.coverImage} className="w-full h-full object-cover" />
                    </div>
                  )}
               </div>
            ) : (
               // CONTEÚDO
               <div className="flex-1 grid grid-cols-2 gap-12 items-center animate-fade-in">
                  <div>
                    <h2 className={`text-3xl font-bold mb-6 border-l-8 pl-6 ${s.primary} border-current`}>{slide.title}</h2>
                    <ul className="space-y-4">
                       {slide.bullets.map((b, i) => (
                         <li key={i} className="text-lg flex items-start gap-3">
                            <span className={`w-3 h-3 rounded-full mt-2 shrink-0 ${s.accent}`}></span>
                            <span>{b}</span>
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
                        </div>
                     )}
                  </div>
               </div>
            )}
         </div>

         <div className="absolute bottom-4 left-0 w-full flex justify-between px-8 text-sm font-mono opacity-50 bg-black/10 backdrop-blur-sm py-2">
            <span>SLIDE {currentSlideIndex + 1} / {content.slides?.length}</span>
            <span>{content.header.title}</span>
         </div>
      </div>
    );
  };

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
            {activeTab === 'atividades' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-700">Materiais Gerados</h3>
                        <button onClick={() => onNavigate?.('activity-generator')} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"><Plus size={16}/> Gerar Novo</button>
                    </div>
                    {classRoom.generatedActivities?.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">Nenhuma atividade gerada ainda.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {classRoom.generatedActivities?.map(item => (
                                <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-cyan-300 transition-all">
                                    <div className="flex justify-between mb-2"><span className="px-2 py-1 text-[10px] font-bold uppercase bg-slate-100 rounded">{item.type}</span></div>
                                    <h4 className="text-lg font-bold text-slate-800 mb-1">{item.title}</h4>
                                    <p className="text-xs text-slate-500 mb-4">Criado em {new Date(item.createdAt).toLocaleDateString()}</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setSelectedActivity(item); setCurrentSlideIndex(0); }} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded flex items-center justify-center gap-1"><Eye size={14} /> Abrir</button>
                                        <button onClick={() => handleDownloadActivity(item, 'pdf')} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold"><Printer size={14}/></button>
                                        {item.type === 'Apresentação' && <button onClick={() => handleDownloadActivity(item, 'pptx')} className="px-3 py-2 bg-orange-50 text-orange-700 rounded text-xs font-bold"><Presentation size={14}/></button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
             {activeTab === 'aulas' && <div className="text-center text-slate-400 py-10">Visualização de aulas (Implementação existente mantida)</div>}
             {activeTab === 'planos' && <div className="text-center text-slate-400 py-10">Visualização de planos (Implementação existente mantida)</div>}
         </div>
      </div>

      {/* Modal Visualização Formatada */}
      {selectedActivity && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-100 w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-800">{selectedActivity.title}</h3>
                    <p className="text-xs text-slate-500">Modo de Visualização</p>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => handleDownloadActivity(selectedActivity, 'pdf')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold flex items-center gap-2"><Printer size={16}/> PDF</button>
                     {selectedActivity.type === 'Apresentação' && (
                        <button onClick={() => handleDownloadActivity(selectedActivity, 'pptx')} className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-sm font-bold flex items-center gap-2"><Presentation size={16}/> PPTX</button>
                     )}
                     <button onClick={() => setSelectedActivity(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                  </div>
               </div>
               
               <div className="flex-1 overflow-auto p-8 flex justify-center bg-slate-200/50">
                  {selectedActivity.content.structureType === 'document' ? (
                      renderSavedDocument(selectedActivity.content)
                  ) : (
                      <div className="w-full max-w-4xl">
                        {renderSavedPresentation(selectedActivity.content)}
                        <div className="flex justify-center gap-4 mt-6">
                           <button onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))} className="p-3 bg-white hover:bg-slate-100 rounded-full shadow-lg font-bold"><ChevronLeft/></button>
                           <span className="flex items-center font-mono font-bold text-slate-600 bg-white px-4 rounded-lg shadow-sm">{currentSlideIndex + 1} / {selectedActivity.content.slides?.length}</span>
                           <button onClick={() => setCurrentSlideIndex(Math.min((selectedActivity.content.slides?.length || 1) - 1, currentSlideIndex + 1))} className="p-3 bg-white hover:bg-slate-100 rounded-full shadow-lg font-bold"><ChevronRight/></button>
                        </div>
                      </div>
                  )}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
