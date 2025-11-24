
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { useData } from '../contexts/DataContext';
import { 
  User as UserIcon, Mail, Phone, BookOpen, Award, Briefcase, 
  Moon, Sun, Camera, Save, CheckCircle, Plus, Trash2
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { users, updateUser } = useData();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Form States
  const [formData, setFormData] = useState<Partial<User>>({});
  const [newEducation, setNewEducation] = useState('');
  const [newExpertise, setNewExpertise] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('eduEscapeUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      // Sync with latest data from context
      const contextUser = users.find(u => u.id === user.id) || user;
      setCurrentUser(contextUser);
      setFormData(contextUser);
    }
  }, [users]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddEducation = () => {
    if (newEducation.trim()) {
      setFormData(prev => ({
        ...prev,
        education: [...(prev.education || []), newEducation.trim()]
      }));
      setNewEducation('');
    }
  };

  const handleRemoveEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education?.filter((_, i) => i !== index)
    }));
  };

  const handleAddExpertise = () => {
    if (newExpertise.trim()) {
      setFormData(prev => ({
        ...prev,
        expertise: [...(prev.expertise || []), newExpertise.trim()]
      }));
      setNewExpertise('');
    }
  };

  const handleRemoveExpertise = (index: number) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise?.filter((_, i) => i !== index)
    }));
  };

  const handleThemeChange = (theme: 'light' | 'dark') => {
    setFormData({ ...formData, themePreference: theme });
    // Apply immediately
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSave = () => {
    if (!currentUser) return;

    // Validation
    if (password && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

    // Email check (simplified - in real app check backend)
    if (formData.email !== currentUser.email) {
      const emailExists = users.some(u => u.email === formData.email && u.id !== currentUser.id);
      if (emailExists) {
        setMessage({ type: 'error', text: 'Este email já está em uso.' });
        return;
      }
    }

    // Save
    const updatedUser: User = {
      ...currentUser,
      ...formData,
      // In a real app, password would be handled separately and securely
    };

    updateUser(updatedUser);
    localStorage.setItem('eduEscapeUser', JSON.stringify(updatedUser));
    
    // Simulate password update
    if (password) {
      const db = JSON.parse(localStorage.getItem('pro7_auth_db') || '{}');
      if (formData.email) {
         delete db[currentUser.email]; // Remove old email key if changed
         db[formData.email] = password;
         localStorage.setItem('pro7_auth_db', JSON.stringify(db));
      }
    }

    setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!currentUser) return <div className="p-8 text-center">Carregando perfil...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Meu Perfil</h1>
      <p className="text-slate-500 mb-8">Gerencie suas informações pessoais e preferências.</p>

      {message && (
        <div className={`p-4 mb-6 rounded-xl border flex items-center gap-3 font-bold text-sm ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <CheckCircle size={18} /> {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Theme */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <div className="w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-4 border-white dark:border-slate-700 shadow-lg">
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                    <UserIcon size={48} />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-cyan-600 text-white rounded-full cursor-pointer hover:bg-cyan-500 transition-colors shadow-md">
                <Camera size={16} />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{formData.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold mt-1">{formData.role === 'admin' ? 'Administrador' : 'Professor'}</p>
          </div>

          <div className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4">Tema do Sistema</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleThemeChange('light')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.themePreference === 'light' ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Sun size={20} />
                <span className="text-xs font-bold">Claro</span>
              </button>
              <button 
                onClick={() => handleThemeChange('dark')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.themePreference === 'dark' ? 'bg-slate-800 border-slate-600 text-white' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Moon size={20} />
                <span className="text-xs font-bold">Escuro</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Form Data */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#0f172a] p-8 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Nome Completo</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 text-slate-400" size={18}/>
                  <input 
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-slate-400" size={18}/>
                  <input 
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Email (Login)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18}/>
                <input 
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Sobre / Biografia</label>
              <textarea 
                name="bio"
                value={formData.bio || ''}
                onChange={handleChange}
                rows={3}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-slate-800 dark:text-white resize-none"
                placeholder="Escreva um pouco sobre você..."
              />
            </div>

            <div className="border-t border-slate-100 dark:border-white/5 pt-6">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Alterar Senha</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input 
                  type="password"
                  placeholder="Nova Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-slate-800 dark:text-white"
                />
                <input 
                  type="password"
                  placeholder="Confirmar Nova Senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-slate-800 dark:text-white"
                />
              </div>
            </div>

          </div>

          {/* Education & Expertise */}
          <div className="bg-white dark:bg-[#0f172a] p-8 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
            
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-2">
                <Award size={16}/> Formação Acadêmica
              </label>
              <div className="space-y-2 mb-3">
                {formData.education?.map((edu, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-white/5">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{edu}</span>
                    <button onClick={() => handleRemoveEducation(index)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  value={newEducation} 
                  onChange={(e) => setNewEducation(e.target.value)}
                  placeholder="Adicionar formação..." 
                  className="flex-1 px-4 py-2 bg-white dark:bg-black border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none"
                />
                <button onClick={handleAddEducation} className="p-2 bg-cyan-50 text-cyan-600 rounded-lg hover:bg-cyan-100"><Plus size={20}/></button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-2">
                <Briefcase size={16}/> Áreas de Atuação
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.expertise?.map((exp, index) => (
                  <span key={index} className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium border border-purple-100 dark:border-purple-800 flex items-center gap-2">
                    {exp}
                    <button onClick={() => handleRemoveExpertise(index)} className="hover:text-red-500"><Trash2 size={12}/></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  value={newExpertise} 
                  onChange={(e) => setNewExpertise(e.target.value)}
                  placeholder="Adicionar área..." 
                  className="flex-1 px-4 py-2 bg-white dark:bg-black border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none"
                />
                <button onClick={handleAddExpertise} className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100"><Plus size={20}/></button>
              </div>
            </div>

          </div>

          <div className="flex justify-end">
            <button 
              onClick={handleSave}
              className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-transform hover:-translate-y-1"
            >
              <Save size={20} /> Salvar Alterações
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
