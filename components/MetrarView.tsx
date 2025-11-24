
import React, { useState } from 'react';
import { Wand2, Loader2, Folder, Plus, Edit3, Trash2, Save, X } from 'lucide-react';
import { BimesterPlan, LessonRow, User } from '../types';
import { generateBimesterPlan } from '../services/geminiService';
import { useData } from '../contexts/DataContext';

export const MetrarView: React.FC<{ user: User }> = ({ user }) => {
  const { plans, addPlan, updatePlan, deletePlan } = useData();
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedPlan, setSelectedPlan] = useState<BimesterPlan | null>(null);
  
  const [formData, setFormData] = useState({
    className: '', subject: '', bimester: '1º', totalLessons: 10, theme: '', bnccFocus: ''
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const rawLessons = await generateBimesterPlan(formData.subject, formData.className, formData.totalLessons, formData.theme, formData.bnccFocus);
      const newLessons: LessonRow[] = rawLessons.map((l, index) => ({ ...l, id: crypto.randomUUID(), number: index + 1 }));
      
      const newPlan: any = {
        userId: user.id,
        ...formData,
        lessons: newLessons
      };

      await addPlan(newPlan);
      alert("Plano gerado e salvo!");
    } catch (e) { alert("Erro ao gerar."); }
    finally { setIsLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if(window.confirm("Excluir plano?")) {
        await deletePlan(id);
        setSelectedPlan(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-12 animate-fade-in">
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Wand2 className="text-cyan-600"/> Gerador de Plano Bimestral</h2>
        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <input required placeholder="Turma (ex: 5º Ano A)" className="p-3 border rounded-xl" value={formData.className} onChange={e=>setFormData({...formData, className: e.target.value})}/>
           <input required placeholder="Disciplina" className="p-3 border rounded-xl" value={formData.subject} onChange={e=>setFormData({...formData, subject: e.target.value})}/>
           <input required placeholder="Tema" className="p-3 border rounded-xl" value={formData.theme} onChange={e=>setFormData({...formData, theme: e.target.value})}/>
           <button type="submit" disabled={isLoading} className="md:col-span-3 py-3 bg-cyan-600 text-white rounded-xl font-bold flex justify-center items-center gap-2">{isLoading ? <Loader2 className="animate-spin"/> : <Wand2/>} Gerar Plano</button>
        </form>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {plans.map(plan => (
            <div key={plan.id} onClick={() => setSelectedPlan(plan)} className="bg-white p-6 rounded-2xl border hover:shadow-md cursor-pointer group relative">
               <div className="absolute top-4 right-4 text-cyan-100"><Folder size={40}/></div>
               <h3 className="font-bold text-lg">{plan.subject}</h3>
               <p className="text-sm text-slate-500">{plan.className} • {plan.bimester}</p>
            </div>
         ))}
      </section>

      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl flex flex-col overflow-hidden">
              <div className="p-6 border-b flex justify-between">
                 <h2 className="text-xl font-bold">{selectedPlan.subject} - {selectedPlan.className}</h2>
                 <div className="flex gap-2">
                    <button onClick={() => handleDelete(selectedPlan.id)} className="text-red-500"><Trash2/></button>
                    <button onClick={() => setSelectedPlan(null)}><X/></button>
                 </div>
              </div>
              <div className="flex-1 overflow-auto p-6 space-y-4">
                 {selectedPlan.lessons.map(l => (
                    <div key={l.id} className="p-4 border rounded-xl bg-slate-50">
                       <h4 className="font-bold">Aula {l.number}: {l.title}</h4>
                       <p className="text-sm">{l.content}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
