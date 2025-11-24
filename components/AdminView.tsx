
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { User } from '../types';
import { 
  Users, ShieldCheck, TrendingUp, Search, 
  CheckCircle, Crown, Trash2, Ban, Lock
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { users, posts, updateUser, deleteUser } = useData();
  const [filter, setFilter] = useState<'all' | 'pending' | 'premium' | 'blocked'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'settings'>('dashboard');

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'approved').length;
  const premiumUsers = users.filter(u => u.plan === 'premium').length;

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' 
      ? true 
      : filter === 'premium' 
        ? u.plan === 'premium'
        : u.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  const handleApprove = async (user: User) => {
    await updateUser({ ...user, status: 'approved' });
  };

  const handleBlock = async (user: User) => {
    await updateUser({ ...user, status: 'blocked' });
  };

  const handleTogglePremium = async (user: User) => {
    const newPlan = user.plan === 'premium' ? 'free' : 'premium';
    await updateUser({ ...user, plan: newPlan });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-8 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <ShieldCheck className="text-cyan-400" size={32} />
            PAINEL ADMINISTRATIVO
          </h1>
          <p className="text-slate-400 mt-1 font-mono text-sm">Controle de Acesso e Moderação Global</p>
        </div>
        <div className="flex bg-slate-800 rounded-lg p-1">
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Dashboard</button>
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Professores</button>
          <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Configurações</button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-in-from-bottom-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Users size={24}/></div>
                <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">Total</span>
             </div>
             <h3 className="text-3xl font-black text-slate-800">{totalUsers}</h3>
             <p className="text-sm text-slate-500 font-medium">Professores Cadastrados</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><CheckCircle size={24}/></div>
                <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded">Ativos</span>
             </div>
             <h3 className="text-3xl font-black text-slate-800">{activeUsers}</h3>
             <p className="text-sm text-slate-500 font-medium">Contas Aprovadas</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><Crown size={24}/></div>
                <span className="text-xs font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded">VIP</span>
             </div>
             <h3 className="text-3xl font-black text-slate-800">{premiumUsers}</h3>
             <p className="text-sm text-slate-500 font-medium">Assinantes Premium</p>
          </div>
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><TrendingUp size={24}/></div>
                <span className="text-xs font-bold bg-purple-50 text-purple-600 px-2 py-1 rounded">Atividade</span>
             </div>
             <h3 className="text-3xl font-black text-slate-800">{posts.length}</h3>
             <p className="text-sm text-slate-500 font-medium">Posts na Comunidade</p>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slide-in-from-bottom-4">
           <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50">
              <div className="relative w-full md:w-96">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   type="text" 
                   placeholder="Buscar professor por nome ou email..."
                   className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              <div className="flex gap-2">
                 {(['all', 'pending', 'premium', 'blocked'] as const).map(f => (
                   <button 
                     key={f}
                     onClick={() => setFilter(f)}
                     className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${filter === f ? 'bg-slate-800 text-white' : 'bg-white border border-slate-300 text-slate-500 hover:bg-slate-100'}`}
                   >
                     {f === 'all' ? 'Todos' : f}
                   </button>
                 ))}
              </div>
           </div>

           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead className="bg-slate-100 text-slate-500 text-xs uppercase font-bold">
                 <tr>
                   <th className="px-6 py-4">Professor</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4">Plano</th>
                   <th className="px-6 py-4">Cadastro</th>
                   <th className="px-6 py-4 text-right">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {filteredUsers.map(u => (
                   <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                     <td className="px-6 py-4">
                       <div>
                         <p className="font-bold text-slate-800">{u.name}</p>
                         <p className="text-xs text-slate-500">{u.email}</p>
                       </div>
                     </td>
                     <td className="px-6 py-4">
                       {u.status === 'pending' && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">Pendente</span>}
                       {u.status === 'approved' && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">Aprovado</span>}
                       {u.status === 'blocked' && <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">Bloqueado</span>}
                     </td>
                     <td className="px-6 py-4">
                       {u.plan === 'premium' ? (
                          <span className="flex items-center gap-1 text-amber-600 font-bold text-xs"><Crown size={14}/> Premium</span>
                       ) : (
                          <span className="text-slate-500 text-xs font-bold">Gratuito</span>
                       )}
                     </td>
                     <td className="px-6 py-4 text-sm text-slate-500">
                       {new Date(u.joinedAt).toLocaleDateString()}
                     </td>
                     <td className="px-6 py-4 text-right flex justify-end gap-2">
                       {u.status === 'pending' && (
                         <button onClick={() => handleApprove(u)} className="p-2 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200" title="Aprovar">
                           <CheckCircle size={16} />
                         </button>
                       )}
                       {u.status !== 'blocked' ? (
                          <button onClick={() => handleBlock(u)} className="p-2 bg-red-50 text-red-400 rounded hover:bg-red-100" title="Bloquear">
                            <Ban size={16} />
                          </button>
                       ) : (
                          <button onClick={() => handleApprove(u)} className="p-2 bg-slate-100 text-slate-500 rounded hover:bg-emerald-100 hover:text-emerald-600" title="Desbloquear">
                             <CheckCircle size={16} />
                          </button>
                       )}
                       
                       <button onClick={() => handleTogglePremium(u)} className={`p-2 rounded transition-colors ${u.plan === 'premium' ? 'bg-amber-100 text-amber-600 hover:bg-slate-100 hover:text-slate-400' : 'bg-slate-100 text-slate-400 hover:bg-amber-100 hover:text-amber-600'}`}>
                         <Crown size={16} />
                       </button>

                       <button onClick={() => deleteUser(u.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded" title="Excluir Usuário">
                         <Trash2 size={16} />
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}
      {activeTab === 'settings' && (
        <div>Configurações Gerais (Em breve)</div>
      )}
    </div>
  );
};
