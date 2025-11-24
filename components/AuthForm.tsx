
import React, { useState } from 'react';
import { User, UserRole, UserPlan } from '../types';
import { ShieldCheck, Mail, Lock, User as UserIcon, Loader2, Fingerprint, ArrowRight } from 'lucide-react';

interface AuthFormProps {
  onLogin: (user: User) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulação de delay de rede/API
    setTimeout(() => {
      // Lógica simples para definir permissões baseadas no email (MOCK)
      let role: UserRole = 'teacher';
      let plan: UserPlan = 'free';
      let name = isLogin ? (formData.email.split('@')[0]) : formData.name;

      // Credenciais Hardcoded para Teste
      if (formData.email === 'admin@pro7.com') {
        role = 'admin';
        plan = 'premium';
        name = 'Diretor Pro 7';
      } else if (formData.email === 'marcos@escola.com') {
        plan = 'premium';
        name = 'Prof. Marcos Premium';
      }

      // Criação de usuário simulado
      const user: User = {
        id: crypto.randomUUID(),
        name: name,
        email: formData.email,
        role: role,
        plan: plan,
        status: 'approved',
        joinedAt: new Date().toISOString()
      };

      // Persistir no localStorage para manter sessão
      localStorage.setItem('eduEscapeUser', JSON.stringify(user));
      
      onLogin(user);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500 bg-slate-50 dark:bg-[#020410]">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-soft-light"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-xl dark:shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 dark:bg-[#020410] text-cyan-600 dark:text-cyan-400 mb-6 border border-slate-200 dark:border-white/5 shadow-[0_0_30px_rgba(6,182,212,0.15)] group relative overflow-hidden">
            <div className="absolute inset-0 bg-cyan-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <ShieldCheck size={40} className="relative z-10" />
          </div>
          
          <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
            {isLogin ? 'IDENTIFICAÇÃO' : 'NOVO AGENTE'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-mono tracking-widest uppercase">
            {isLogin ? 'Acesso ao Sistema Tático' : 'Registro de Credenciais'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-cyan-600 dark:text-cyan-500 uppercase tracking-widest ml-1">Nome do Agente</label>
              <div className="relative group">
                <UserIcon size={16} className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 group-focus-within:text-cyan-500 dark:group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type="text"
                  required
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-[#020410] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-all shadow-inner text-sm"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-cyan-600 dark:text-cyan-500 uppercase tracking-widest ml-1">Email Institucional</label>
            <div className="relative group">
              <Mail size={16} className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 group-focus-within:text-cyan-500 dark:group-focus-within:text-cyan-400 transition-colors" />
              <input
                type="email"
                required
                placeholder="email@escola.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-[#020410] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-all shadow-inner text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-cyan-600 dark:text-cyan-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
            <div className="relative group">
              <Lock size={16} className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 group-focus-within:text-cyan-500 dark:group-focus-within:text-cyan-400 transition-colors" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-[#020410] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-all shadow-inner text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 mt-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.5)] transform transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-cyan-400/20 group"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span className="animate-pulse">Autenticando...</span>
              </>
            ) : (
              <>
                <Fingerprint size={20} className={isLogin ? "" : "hidden"} />
                {isLogin ? 'Inicializar Sessão' : 'Registrar Credencial'}
                {!isLogin && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-200 dark:border-white/5">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setFormData({ name: '', email: '', password: '' });
            }}
            className="text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-xs uppercase tracking-wider font-bold transition-colors"
          >
            {isLogin ? 'Não possui credencial? Solicite Acesso' : 'Já possui conta? Acesse o Terminal'}
          </button>
        </div>
        
        {/* Dica para o usuário (Remover em produção) */}
        <div className="mt-4 text-center text-[10px] text-slate-400 bg-slate-100 p-2 rounded">
           <p><strong>Admin:</strong> admin@pro7.com</p>
           <p><strong>Premium:</strong> marcos@escola.com</p>
        </div>
      </div>
    </div>
  );
};
