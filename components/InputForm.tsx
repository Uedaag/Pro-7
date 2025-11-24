import React, { useState } from 'react';
import { BookOpen, GraduationCap, Wand2, Loader2, Search, Clock, Gauge } from 'lucide-react';

interface InputFormProps {
  onSubmit: (topic: string, grade: string, duration: string, difficulty: string) => void;
  isLoading: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('');
  const [duration, setDuration] = useState('1 Aula (50 min)');
  const [difficulty, setDifficulty] = useState('Médio (Investigador)');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && grade.trim()) {
      onSubmit(topic, grade, duration, difficulty);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/10 p-8 rounded-3xl shadow-xl dark:shadow-2xl backdrop-blur-xl relative overflow-hidden group transition-colors duration-300">
      {/* Decorative gradient line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
      
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#020410] text-cyan-600 dark:text-cyan-400 mb-4 border border-slate-200 dark:border-white/5 shadow-inner">
          <Search size={28} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">Configurar Missão</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Defina os parâmetros táticos para a geração do cenário.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tópico */}
          <div>
            <label htmlFor="topic" className="block text-[10px] font-bold text-cyan-600 dark:text-cyan-500 uppercase tracking-widest mb-2 ml-1">
              Arquivo / Tema
            </label>
            <div className="relative group/input">
              <BookOpen size={16} className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 group-focus-within/input:text-cyan-500 dark:group-focus-within/input:text-cyan-400 transition-colors" />
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Revolução Industrial..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-[#020410] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-all shadow-inner text-sm"
                required
              />
            </div>
          </div>

          {/* Ano Escolar */}
          <div>
            <label htmlFor="grade" className="block text-[10px] font-bold text-cyan-600 dark:text-cyan-500 uppercase tracking-widest mb-2 ml-1">
              Nível de Acesso (Ano)
            </label>
            <div className="relative group/input">
              <GraduationCap size={16} className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 group-focus-within/input:text-cyan-500 dark:group-focus-within/input:text-cyan-400 transition-colors" />
              <input
                id="grade"
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Ex: 7º Ano, Ensino Médio..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-[#020410] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-all shadow-inner text-sm"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Duração */}
          <div>
            <label htmlFor="duration" className="block text-[10px] font-bold text-cyan-600 dark:text-cyan-500 uppercase tracking-widest mb-2 ml-1">
              Tempo Estimado
            </label>
            <div className="relative group/input">
              <Clock size={16} className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 group-focus-within/input:text-cyan-500 dark:group-focus-within/input:text-cyan-400 transition-colors" />
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-[#020410] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-slate-800 dark:text-white transition-all shadow-inner text-sm appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-950"
              >
                <option>Rápido (20-30 min)</option>
                <option>1 Aula (50 min)</option>
                <option>2 Aulas (1h 40m)</option>
                <option>Projeto Longo (3+ Aulas)</option>
              </select>
              {/* Custom arrow */}
              <div className="absolute right-4 top-4 pointer-events-none">
                <div className="w-2 h-2 border-r-2 border-b-2 border-slate-400 dark:border-slate-600 transform rotate-45 mb-1"></div>
              </div>
            </div>
          </div>

          {/* Dificuldade */}
          <div>
            <label htmlFor="difficulty" className="block text-[10px] font-bold text-cyan-600 dark:text-cyan-500 uppercase tracking-widest mb-2 ml-1">
              Complexidade dos Enigmas
            </label>
            <div className="relative group/input">
              <Gauge size={16} className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 group-focus-within/input:text-cyan-500 dark:group-focus-within/input:text-cyan-400 transition-colors" />
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-[#020410] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-slate-800 dark:text-white transition-all shadow-inner text-sm appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-950"
              >
                <option>Fácil (Iniciante)</option>
                <option>Médio (Investigador)</option>
                <option>Difícil (Mestre Detetive)</option>
                <option>Hardcore (Apenas Lógica Pura)</option>
              </select>
               {/* Custom arrow */}
               <div className="absolute right-4 top-4 pointer-events-none">
                <div className="w-2 h-2 border-r-2 border-b-2 border-slate-400 dark:border-slate-600 transform rotate-45 mb-1"></div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !topic || !grade}
          className="w-full py-4 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.5)] transform transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-cyan-400/20 mt-4"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span className="animate-pulse">Criando Universo...</span>
            </>
          ) : (
            <>
              <Wand2 size={20} />
              Gerar Missão
            </>
          )}
        </button>
      </form>
    </div>
  );
};