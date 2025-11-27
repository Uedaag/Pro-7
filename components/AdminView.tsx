import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useNotification } from '../contexts/NotificationContext';
import { User, UserPlan, SystemSettings } from '../types';
import { 
  Users, ShieldCheck, TrendingUp, Search, 
  CheckCircle, Crown, Trash2, Ban, Lock, Settings, Save, AlertTriangle, ToggleLeft, ToggleRight,
  Video, BrainCircuit, FileText, Gamepad2
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { users, posts, updateUsersBatch, deleteUser, systemSettings, saveSystemSettings } = useData();
  const { notify } = useNotification();
  const [filter, setFilter] = useState<'all' | 'pending' | 'premium' | 'blocked'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'settings'>('dashboard');

  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [modifiedUsers, setModifiedUsers] = useState<Set<string>>(new Set());
  const [isSavingUsers, setIsSavingUsers] = useState(false);

  const [localSettings, setLocalSettings] = useState<SystemSettings[]>([]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    setLocalUsers(users);
    setModifiedUsers(new Set());
  }, [users]);

  useEffect(() => {
    if (systemSettings.length > 0) {
      setLocalSettings(systemSettings);
    } else {
       const defaults: SystemSettings[] = [
         { plan: 'free', can_use_ia: false, can_create_classes: true, can_access_escape: false, can_access_videos: false, can_export_pdf: false },
         { plan: 'premium', can_use_ia: true, can_create_classes: true, can_access_escape: true, can_access_videos: true, can_export_pdf: true }
       ];
       setLocalSettings(defaults);
    }
  }, [systemSettings]);


  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'approved').length;
  const premiumUsers = users.filter(u => u.plan === 'premium').length;

  const handleLocalUserChange = (userId: string, changes: Partial<User>) => {
    setLocalUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, ...changes } : u
    ));
    setModifiedUsers(prev => new Set(prev).add(userId));
  };

  const handleSaveUsers = async () => {
    setIsSavingUsers(true);
    const usersToUpdate = localUsers.filter(u => modifiedUsers.has(u.id));
    try {
        await updateUsersBatch(usersToUpdate);
        setModifiedUsers(new Set());
        notify("Alterações nos usuários salvas com sucesso.", "success");
    } catch (error) {
        notify("Erro ao salvar alterações nos usuários.", "error");
    } finally {
        setIsSavingUsers(false);
    }
  };

  const handleSettingChange = (plan: UserPlan, field: keyof SystemSettings) => {
      setLocalSettings(prev => prev.map(s => {
          if (s.plan === plan) {
              return { ...s, [field]: !(s[field] as any) };
          }
          return s;
      }));
  };

  const handleSaveSettings = async () => {
      setIsSavingSettings(true);
      try {
        await saveSystemSettings(localSettings);
        notify("Configurações salvas com sucesso!", "success");
      } catch (e) {
        notify("Erro ao salvar configurações.", "error");
      } finally {
        setIsSavingSettings(false);
      }
  };

  const filteredUsers = localUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' 
      ? true 
      : (filter === 'premium') 
        ? u.plan === filter
        : u.status === filter;
    
    return matchesSearch && matchesFilter;
  });
  // ... rest of component
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slide-in-from-bottom-4 relative">
           {modifiedUsers.size > 0 && (
               <div className="sticky top-0 z-20 bg-amber-50 border-b border-amber-200 p-3 flex justify-between items-center px-6 animate-fade-in">
                   <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                       <AlertTriangle size={18} />
                       Você tem alterações pendentes ({modifiedUsers.size}).
                   </div>
                   <button 
                     onClick={handleSaveUsers}
                     disabled={isSavingUsers}
                     className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-md"
                   >
                       <Save size={14} />
                       {isSavingUsers ? 'Salvando...' : 'Salvar Alterações'}
                   </button>
               </div>
           )}

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
                   <th className="px-6 py-4">Plano Atual</th>
                   <th className="px-6 py-4">Cadastro</th>
                   <th className="px-6 py-4 text-right">Ações Rápidas</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {filteredUsers.map(u => {
                   const isModified = modifiedUsers.has(u.id);
                   return (
                   <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${isModified ? 'bg-amber-50/50' : ''}`}>
                     <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                         {isModified && <div className="w-2 h-2 rounded-full bg-amber-500"></div>}
                         <div>
                            <p className="font-bold text-slate-800">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                         </div>
                       </div>
                     </td>
                     <td className="px-6 py-4">
                        <select 
                           value={u.status}
                           onChange={(e) => handleLocalUserChange(u.id, { status: e.target.value as any })}
                           className={`px-2 py-1 rounded text-xs font-bold border outline-none cursor-pointer
                             ${u.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                               u.status === 'blocked' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}
                           `}
                        >
                           <option value="pending">Pendente</option>
                           <option value="approved">Aprovado</option>
                           <option value="blocked">Bloqueado</option>
                        </select>
                     </td>
                     <td className="px-6 py-4">
                        <select 
                           value={u.plan}
                           onChange={(e) => handleLocalUserChange(u.id, { plan: e.target.value as any })}
                           className={`px-2 py-1 rounded text-xs font-bold border outline-none cursor-pointer flex items-center gap-2
                             ${u.plan === 'premium' ? 'bg-amber-100 text-amber-600 border-amber-200' : 
                               'bg-slate-100 text-slate-500 border-slate-200'}
                           `}
                        >
                           <option value="free">Gratuito</option>
                           <option value="premium">Premium</option>
                        </select>
                     </td>
                     <td className="px-6 py-4 text-sm text-slate-500">
                       {new Date(u.joinedAt).toLocaleDateString()}
                     </td>
                     <td className="px-6 py-4 text-right flex justify-end gap-2">
                       <button onClick={() => deleteUser(u.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Excluir Usuário">
                         <Trash2 size={16} />
                       </button>
                     </td>
                   </tr>
                 )})}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6 animate-slide-in-from-bottom-4">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Configurações Gerais do Sistema</h2>
                <p className="text-sm text-slate-500">Defina quais recursos cada plano pode acessar.</p>
              </div>
              <button 
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-transform hover:-translate-y-0.5"
              >
                 <Save size={20} /> {isSavingSettings ? 'Salvando...' : 'Salvar Configurações'}
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {localSettings.map((setting) => (
                <div key={setting.plan} className={`
                    rounded-2xl border-2 p-6 bg-white relative overflow-hidden
                    ${setting.plan === 'premium' ? 'border-amber-400' : 'border-slate-200'}
                `}>
                    
                    <h3 className={`text-2xl font-black uppercase mb-6 flex items-center gap-2
                       ${setting.plan === 'premium' ? 'text-amber-600' : 'text-slate-600'}
                    `}>
                        {setting.plan === 'premium' && <Crown size={24}/>}
                        Plano {setting.plan}
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                               <BrainCircuit size={16} className="text-purple-500"/> Inteligência Artificial
                            </div>
                            <button onClick={() => handleSettingChange(setting.plan, 'can_use_ia')} className="text-slate-400 hover:text-cyan-600">
                                {setting.can_use_ia ? <ToggleRight size={32} className="text-emerald-500"/> : <ToggleLeft size={32}/>}
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                               <Gamepad2 size={16} className="text-cyan-500"/> Edu Escape
                            </div>
                            <button onClick={() => handleSettingChange(setting.plan, 'can_access_escape')} className="text-slate-400 hover:text-cyan-600">
                                {setting.can_access_escape ? <ToggleRight size={32} className="text-emerald-500"/> : <ToggleLeft size={32}/>}
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                               <Users size={16} className="text-blue-500"/> Criar Turmas
                            </div>
                            <button onClick={() => handleSettingChange(setting.plan, 'can_create_classes')} className="text-slate-400 hover:text-cyan-600">
                                {setting.can_create_classes ? <ToggleRight size={32} className="text-emerald-500"/> : <ToggleLeft size={32}/>}
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                               <Video size={16} className="text-red-500"/> Vídeos
                            </div>
                            <button onClick={() => handleSettingChange(setting.plan, 'can_access_videos')} className="text-slate-400 hover:text-cyan-600">
                                {setting.can_access_videos ? <ToggleRight size={32} className="text-emerald-500"/> : <ToggleLeft size={32}/>}
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                               <FileText size={16} className="text-orange-500"/> Exportar PDF
                            </div>
                            <button onClick={() => handleSettingChange(setting.plan, 'can_export_pdf')} className="text-slate-400 hover:text-cyan-600">
                                {setting.can_export_pdf ? <ToggleRight size={32} className="text-emerald-500"/> : <ToggleLeft size={32}/>}
                            </button>
                        </div>
                    </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};