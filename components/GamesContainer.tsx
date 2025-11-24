import React, { useState } from 'react';
import { InputForm } from './InputForm';
import { EscapeRoomDisplay } from './EscapeRoomDisplay';
import { generateEscapeRoom } from '../services/geminiService';
import { EscapeRoomData } from '../types';
import { Sparkles, BrainCircuit, Gamepad2 } from 'lucide-react';

export const GamesContainer: React.FC = () => {
  const [data, setData] = useState<EscapeRoomData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (topic: string, grade: string, duration: string, difficulty: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateEscapeRoom(topic, grade, duration, difficulty);
      setData(result);
    } catch (err) {
      console.error(err);
      setError("Ocorreu um erro ao gerar o Escape Room. Por favor, verifique sua chave API ou tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setData(null);
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {!data ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] relative z-10">
           {/* Hero Text */}
          <div className="text-center mb-12 space-y-6">
            <h1 className="text-4xl md:text-6xl font-black text-slate-800 dark:text-white tracking-tighter">
              GERADOR DE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 animate-gradient-x">
                 MISSÕES
              </span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
              Crie experiências de aprendizado imersivo em segundos.
            </p>
          </div>

          {error && (
             <div className="w-full max-w-md mb-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-center text-sm">
               {error}
             </div>
          )}

          <InputForm onSubmit={handleGenerate} isLoading={isLoading} />

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full border-t border-slate-200 dark:border-white/5 pt-12">
            <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all text-left group">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <Sparkles size={20} />
              </div>
              <h3 className="text-slate-800 dark:text-white font-bold mb-2 text-sm uppercase tracking-wider">Narrativa</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Histórias envolventes criadas por IA.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all text-left group">
              <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-500/10 rounded-lg flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                <BrainCircuit size={20} />
              </div>
              <h3 className="text-slate-800 dark:text-white font-bold mb-2 text-sm uppercase tracking-wider">Lógica</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Desafios que estimulam a dedução.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all text-left group">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                <Gamepad2 size={20} />
              </div>
              <h3 className="text-slate-800 dark:text-white font-bold mb-2 text-sm uppercase tracking-wider">Visual</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Cenas geradas automaticamente.</p>
            </div>
          </div>
        </div>
      ) : (
        <EscapeRoomDisplay data={data} onReset={handleReset} />
      )}
    </div>
  );
};