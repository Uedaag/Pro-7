import React, { useState, useRef, useEffect } from 'react';
import { EscapeRoomData } from '../types';
import { generateSceneImage } from '../services/geminiService';
import { 
  Lock, 
  Unlock, 
  ArrowRight, 
  Trophy, 
  AlertCircle, 
  RotateCcw,
  Image as ImageIcon,
  ScanEye,
  Lightbulb,
  Key,
  CheckCircle2,
  PenTool,
  FileText,
  Terminal,
  Fingerprint,
  ShieldCheck,
  Eye,
  Hash
} from 'lucide-react';

interface EscapeRoomDisplayProps {
  data: EscapeRoomData;
  onReset: () => void;
}

export const EscapeRoomDisplay: React.FC<EscapeRoomDisplayProps> = ({ data, onReset }) => {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro');
  const [feedback, setFeedback] = useState<'none' | 'success' | 'error'>('none');
  
  // Image generation state
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  const answerInputRef = useRef<HTMLInputElement>(null);

  // Focus input when phase changes
  useEffect(() => {
    if (gameState === 'playing' && feedback !== 'success') {
      setTimeout(() => answerInputRef.current?.focus(), 100);
    }
  }, [currentPhaseIndex, gameState, feedback]);

  // Trigger image generation when entering a new phase
  useEffect(() => {
    const loadPhaseImage = async () => {
      if (gameState === 'playing') {
        const prompt = data.phases[currentPhaseIndex].imagePrompt;
        if (prompt) {
          setIsLoadingImage(true);
          setSceneImage(null);
          try {
            const imageUrl = await generateSceneImage(prompt);
            setSceneImage(imageUrl);
          } catch (err) {
            console.error("Failed to load image", err);
          } finally {
            setIsLoadingImage(false);
          }
        }
      }
    };

    loadPhaseImage();
  }, [currentPhaseIndex, gameState, data.phases]);

  // --- Algoritmo de Distância de Levenshtein para Fuzzy Matching ---
  const getLevenshteinDistance = (a: string, b: string) => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      // Substitui pontuação por espaço para evitar colagem de palavras (ex: "azul,amarelo" vira "azul amarelo")
      .replace(/[^a-z0-9\s]/g, " ") 
      .replace(/\s+/g, " ") // remove multiple spaces
      .trim();
  };

  const checkAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    const currentPhase = data.phases[currentPhaseIndex];
    const normalizedUser = normalizeText(userAnswer);
    const normalizedCorrect = normalizeText(currentPhase.answer);

    let isCorrect = false;

    // 1. Verificação de Correspondência Exata (pós-normalização)
    if (normalizedUser === normalizedCorrect) {
      isCorrect = true;
    } 
    // 2. Verificação "Bag of Words" (Independente de Ordem)
    else {
      const userWords = normalizedUser.split(" ").filter(w => w.length > 0);
      const correctWords = normalizedCorrect.split(" ").filter(w => w.length > 0);
      
      if (correctWords.length > 0) {
        const allKeywordsFound = correctWords.every(cw => {
          return userWords.some(uw => {
            if (uw === cw) return true;
            if (cw.length > 3 && uw.length > 3) {
              const dist = getLevenshteinDistance(uw, cw);
              return dist <= 1; 
            }
            return false;
          });
        });
        
        if (allKeywordsFound && userWords.length <= correctWords.length + 3) {
          isCorrect = true;
        }
      }
      
      if (!isCorrect) {
        const distance = getLevenshteinDistance(normalizedUser, normalizedCorrect);
        const maxLen = Math.max(normalizedUser.length, normalizedCorrect.length);
        if (distance <= Math.ceil(maxLen * 0.2)) {
          isCorrect = true;
        }
      }
    }

    if (isCorrect) {
      setFeedback('success');
      setTimeout(() => {
        if (currentPhaseIndex < data.phases.length - 1) {
          setCurrentPhaseIndex(prev => prev + 1);
          setAttempts(0);
          setUserAnswer('');
          setFeedback('none');
          setSceneImage(null);
        } else {
          setGameState('completed');
        }
      }, 2000);
    } else {
      setFeedback('error');
      setAttempts(prev => prev + 1);
      setTimeout(() => setFeedback('none'), 1500);
    }
  };

  const renderIntro = () => (
    <div className="bg-white dark:bg-[#0f172a]/80 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-xl dark:shadow-2xl animate-fade-in max-w-3xl mx-auto backdrop-blur-xl transition-colors duration-300">
      <div className="bg-slate-50 dark:bg-[#020410] p-10 text-center relative overflow-hidden border-b border-slate-200 dark:border-white/5">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full bg-cyan-500/5 blur-3xl pointer-events-none"></div>
        
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-200 dark:bg-slate-900/50 text-cyan-600 dark:text-cyan-400 mb-6 border border-cyan-500/10 dark:border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
          <ShieldCheck size={40} />
        </div>
        
        <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-3 tracking-tighter uppercase">{data.theme}</h1>
        <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-4 py-1.5 rounded-full border border-slate-300 dark:border-slate-700">
          <Fingerprint size={14} className="text-slate-500 dark:text-slate-400" />
          <span className="text-slate-600 dark:text-slate-300 text-xs font-mono tracking-widest uppercase">Nível de Acesso: {data.grade}</span>
        </div>
      </div>
      
      <div className="p-10 space-y-8">
        {/* Aviso de Material Necessário */}
        <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10 rounded-xl p-6 flex items-start gap-5">
          <div className="bg-amber-100 dark:bg-amber-500/10 p-3 rounded-lg shrink-0">
            <PenTool className="text-amber-600 dark:text-amber-500" size={24} />
          </div>
          <div>
            <h3 className="text-amber-700 dark:text-amber-500 font-bold text-sm uppercase mb-2 tracking-wider">Material Obrigatório</h3>
            <p className="text-amber-900/80 dark:text-slate-300/90 text-sm leading-relaxed">
              Este é um exercício de dedução. Utilize <strong>papel e caneta</strong> para anotar códigos, desenhar diagramas e conectar as pistas espalhadas pelos arquivos.
            </p>
          </div>
        </div>

        <div className="relative pl-6 border-l-2 border-cyan-500/30">
          <p className="text-slate-700 dark:text-slate-200 text-lg font-light leading-relaxed italic">
            "{data.intro}"
          </p>
        </div>
        
        <button 
          onClick={() => setGameState('playing')}
          className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.2)] hover:shadow-[0_0_30px_rgba(8,145,178,0.4)] transform transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 text-lg tracking-wider uppercase group"
        >
          <Terminal size={20} className="group-hover:text-cyan-100" />
          Inicializar Missão
        </button>
      </div>
    </div>
  );

  const renderCompleted = () => (
    <div className="bg-white dark:bg-[#0f172a]/90 border border-emerald-500/20 rounded-3xl overflow-hidden shadow-xl dark:shadow-2xl animate-scale-in max-w-2xl mx-auto text-center backdrop-blur-xl transition-colors duration-300">
      <div className="bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/30 dark:to-[#020410] p-12 relative">
        {/* Added pointer-events-none to prevent overlay from blocking button */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-5 pointer-events-none"></div>
        
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-6 border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
          <Trophy size={48} strokeWidth={1.5} />
        </div>
        
        <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">SUCESSO</h2>
        <p className="text-emerald-600 dark:text-emerald-400/80 text-sm uppercase tracking-widest mb-8 font-mono">Todos os arquivos decriptados</p>
        
        <div className="bg-slate-50 dark:bg-[#020410]/50 p-8 rounded-2xl border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 mb-10 text-left shadow-inner">
          <p className="leading-relaxed text-sm md:text-base font-light">{data.outro}</p>
        </div>

        <button 
          onClick={onReset}
          className="relative z-10 px-8 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-medium rounded-lg transition-colors flex items-center gap-2 mx-auto border border-slate-300 dark:border-white/5 hover:border-slate-400 dark:hover:border-white/10 text-sm uppercase tracking-wide cursor-pointer"
        >
          <RotateCcw size={16} />
          Reiniciar Sistema
        </button>
      </div>
    </div>
  );

  if (gameState === 'intro') return renderIntro();
  if (gameState === 'completed') return renderCompleted();

  const currentPhase = data.phases[currentPhaseIndex];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 bg-white dark:bg-[#0f172a]/60 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-lg transition-colors duration-300">
        <button onClick={onReset} className="text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors text-[10px] uppercase tracking-widest flex items-center gap-2 font-bold group">
           <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
             <ArrowRight className="rotate-180" size={12} />
           </div>
           Abortar
        </button>
        
        {/* Progress Dots */}
        <div className="flex gap-3">
          {data.phases.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === currentPhaseIndex 
                  ? 'w-8 bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]' 
                  : idx < currentPhaseIndex 
                    ? 'w-2 bg-emerald-500' 
                    : 'w-2 bg-slate-300 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>
        
        <div className="text-slate-500 dark:text-slate-400 font-mono text-[10px] tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
          FASE {currentPhaseIndex + 1} / {data.phases.length}
        </div>
      </div>

      {/* Game Container */}
      <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-xl dark:shadow-2xl relative transition-all duration-300 backdrop-blur-sm">
        
        {/* Phase Title Bar */}
        <div className="bg-slate-50 dark:bg-[#020410] px-6 py-5 border-b border-slate-200 dark:border-white/5 flex items-center gap-5 transition-colors duration-300">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${feedback === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-cyan-600 dark:text-cyan-400'}`}>
             {feedback === 'success' ? <Unlock size={24} /> : <Lock size={24} />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-600 text-[10px] font-bold font-mono uppercase tracking-[0.2em] mb-1">
              <Hash size={10} /> Arquivo Confidencial
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{currentPhase.title}</h2>
          </div>
        </div>

        {/* Visual Evidence Panel (Image) */}
        <div className="w-full aspect-video md:h-80 bg-slate-100 dark:bg-[#020410] relative overflow-hidden border-b border-slate-200 dark:border-white/5 group">
          {isLoadingImage ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-cyan-600/40 dark:text-cyan-500/40 space-y-4 bg-slate-50 dark:bg-[#020410]">
              <div className="relative">
                <ScanEye size={48} className="animate-pulse text-cyan-600 dark:text-cyan-600" strokeWidth={1} />
                <div className="absolute inset-0 border-t-2 border-cyan-500/20 rounded-full animate-spin"></div>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-700 dark:text-cyan-800 animate-pulse">Renderizando Evidência...</p>
            </div>
          ) : sceneImage ? (
             <>
               <img 
                 src={sceneImage} 
                 alt="Evidência visual" 
                 className="w-full h-full object-cover transition-transform duration-[30s] ease-linear scale-105 hover:scale-110 opacity-90 dark:opacity-80 hover:opacity-100"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-white/10 dark:from-[#0f172a] via-transparent to-transparent"></div>
               
               {/* Overlay UI */}
               <div className="absolute top-4 right-4 flex gap-2">
                 <div className="bg-white/80 dark:bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-cyan-800 dark:text-cyan-200/70 flex items-center gap-2 border border-cyan-500/10 font-mono">
                   <Eye size={10} /> LIVE FEED
                 </div>
               </div>
             </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-700">
              <ImageIcon size={48} strokeWidth={1} className="opacity-20" />
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-5 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-white/5">
          
          {/* Left: Narrative & Clues (3 cols) */}
          <div className="md:col-span-3 p-6 md:p-8 space-y-8 bg-white dark:bg-gradient-to-b dark:from-[#0f172a] dark:to-[#0b1121] transition-colors duration-300">
            <div className="space-y-4">
              <h3 className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em] flex items-center gap-2">
                <FileText size={12} /> Análise de Cenário
              </h3>
              <div className="text-base md:text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-serif pl-4 border-l-2 border-slate-200 dark:border-slate-700 py-1">
                {currentPhase.challenge}
              </div>
            </div>

            {/* Hint System */}
            <div className="pt-6 mt-8 border-t border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-500 dark:text-slate-600 text-[10px] font-mono uppercase tracking-[0.2em] flex items-center gap-2">
                  <Lightbulb size={12} /> Dicas Desbloqueáveis
                </h3>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={`h-1 w-6 rounded-full transition-colors ${i < attempts ? 'bg-red-500/40' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {currentPhase.hints.map((hint, index) => {
                  const isLocked = index >= attempts;
                  return (
                    <div 
                      key={index}
                      className={`p-3 rounded border text-sm transition-all duration-500 relative overflow-hidden ${
                        isLocked 
                          ? 'bg-slate-50 dark:bg-[#020410] border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-700 opacity-60' 
                          : 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-900/50 text-cyan-800 dark:text-cyan-200/80 animate-in fade-in slide-in-from-left-2'
                      }`}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <div className={`shrink-0 ${isLocked ? 'text-slate-400 dark:text-slate-800' : 'text-cyan-600 dark:text-cyan-500'}`}>
                          {isLocked ? <Lock size={14} /> : <Key size={14} />}
                        </div>
                        <p className="font-mono text-xs leading-relaxed">
                          {isLocked ? "••••••••••••••••••••••••••" : hint}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Interaction Panel (2 cols) */}
          <div className="md:col-span-2 bg-slate-50 dark:bg-[#020410] p-6 md:p-8 flex flex-col justify-center transition-colors duration-300">
            <div className="bg-white dark:bg-slate-900/30 p-5 rounded-xl border border-slate-200 dark:border-slate-800/50 relative overflow-hidden mb-6 shadow-sm">
              <h3 className="text-cyan-600 dark:text-cyan-500 font-bold mb-3 flex items-center gap-2 text-[10px] uppercase tracking-widest">
                <Terminal size={12} /> Objetivo
              </h3>
              <p className="text-slate-800 dark:text-white text-sm md:text-base font-medium leading-snug">{currentPhase.question}</p>
            </div>

            <form onSubmit={checkAnswer} className="relative group/input">
              <div className="flex justify-between items-baseline mb-2">
                 <label className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                  Terminal de Entrada
                </label>
                {attempts > 0 && feedback !== 'success' && (
                   <span className="text-[10px] text-red-500 dark:text-red-400 font-mono animate-pulse">
                     ALERTA: TENTATIVA {attempts}/3 FALHOU
                   </span>
                )}
              </div>
              
              <div className={`relative transition-all duration-300 ${feedback === 'error' ? 'animate-shake' : ''}`}>
                 <input
                  ref={answerInputRef}
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="> Digite o código..."
                  className={`w-full bg-white dark:bg-black/50 border-2 rounded-lg py-4 pl-5 pr-16 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-700 outline-none transition-all font-mono tracking-wider text-sm shadow-sm
                    ${feedback === 'success' ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400' : 
                      feedback === 'error' ? 'border-red-500 dark:border-red-900/80 text-red-600 dark:text-red-200' : 
                      'border-slate-200 dark:border-slate-800 focus:border-cyan-600 focus:bg-slate-50 dark:focus:bg-black'}`}
                  disabled={feedback === 'success'}
                  autoComplete="off"
                />
                <button 
                  type="submit"
                  disabled={!userAnswer.trim() || feedback === 'success'}
                  className="absolute right-2 top-2 bottom-2 aspect-square bg-slate-100 dark:bg-slate-800 hover:bg-cyan-600 dark:hover:bg-cyan-600 text-slate-400 dark:text-slate-300 hover:text-white rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-slate-200 dark:border-white/5"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
              
              {/* Feedback Status */}
              <div className="h-8 mt-2 flex items-center">
                {feedback === 'success' && (
                  <div className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-1">
                    <CheckCircle2 size={14} /> SENHA ACEITA. CARREGANDO...
                  </div>
                )}
                {feedback === 'error' && (
                  <div className="text-red-500 dark:text-red-400 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-1">
                    <AlertCircle size={14} /> ACESSO NEGADO. VERIFIQUE AS PISTAS.
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};