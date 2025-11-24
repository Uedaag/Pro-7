
import React, { useState } from 'react';
import { Wand2, Loader2, Save } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { generateEducationalActivity } from '../services/geminiService';
import { ActivityContent } from '../types';

export const ActivityGeneratorView: React.FC = () => {
  const { classes, updateClass } = useData();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [activityType, setActivityType] = useState<any>('Prova');
  const [result, setResult] = useState<ActivityContent | null>(null);

  const currentClass = classes.find(c => c.id === selectedClassId);

  const handleGenerate = async () => {
    if (!currentClass) return;
    setIsLoading(true);
    try {
      // Simulação de conteúdo vindo de selectedLessons (simplificado para o exemplo)
      const contents = [`Conteúdo da turma ${currentClass.name}`];
      const data = await generateEducationalActivity(activityType, currentClass.subject, currentClass.grade, contents, 'Padrão');
      setResult(data);
    } catch (e) { alert("Erro ao gerar"); }
    finally { setIsLoading(false); }
  };

  const handleSave = async () => {
    if (!currentClass || !result) return;
    const newActivity: any = {
       id: crypto.randomUUID(), // Temporário para UI
       classId: currentClass.id,
       type: activityType,
       title: result.header.title,
       content: result,
       relatedLessonIds: []
    };
    
    // updateClass no Context deve lidar com o insert na tabela activities
    const updatedClass = {
        ...currentClass,
        generatedActivities: [...currentClass.generatedActivities, newActivity]
    };
    
    await updateClass(updatedClass);
    alert("Salvo com sucesso!");
    setResult(null);
    setStep(1);
  };

  // Render simplificado focado na lógica de salvar
  return (
    <div className="max-w-4xl mx-auto py-8">
       {!result ? (
         <div className="bg-white p-8 rounded-3xl shadow-lg space-y-6">
            <h2 className="text-2xl font-bold">Gerador de Atividades</h2>
            <select className="w-full p-3 border rounded-xl" onChange={e => setSelectedClassId(e.target.value)} value={selectedClassId}>
               <option value="">Selecione uma turma...</option>
               {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={handleGenerate} disabled={!selectedClassId || isLoading} className="w-full py-4 bg-cyan-600 text-white font-bold rounded-xl flex justify-center items-center gap-2">
               {isLoading ? <Loader2 className="animate-spin"/> : <Wand2/>} Gerar
            </button>
         </div>
       ) : (
         <div className="bg-white p-8 rounded-3xl shadow-lg">
            <h2 className="text-2xl font-bold mb-4">{result.header.title}</h2>
            <div className="p-4 bg-slate-50 rounded-xl mb-6 border">Preview do conteúdo...</div>
            <button onClick={handleSave} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl flex justify-center items-center gap-2">
               <Save/> Salvar na Turma
            </button>
         </div>
       )}
    </div>
  );
};
