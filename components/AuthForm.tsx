
import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, Mail, Lock, User as UserIcon, Loader2, 
  ArrowRight, AlertCircle, CheckCircle, Eye, EyeOff, BrainCircuit, WifiOff
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

export const AuthForm: React.FC = () => {
  const { signIn, signUp } = useData();
  
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Timer de segurança para evitar travamento eterno
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const startSafetyTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setError("O servidor demorou a responder. Verifique sua internet e tente novamente.");
      }
    }, 15000); // 15 segundos de limite máximo
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    startSafetyTimer();

    try {
      if (!formData.email || !formData.password) {
        throw new Error("Preencha todos os campos.");
      }

      const { error } = await signIn(formData.email, formData.password);
      if (error) throw error;
      
      // O redirecionamento acontece via AuthStateChange no App.tsx
      // Mas limpamos o timer aqui
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

    } catch (err: any) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setError(err.message || "Erro ao fazer login. Verifique sua senha.");
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    startSafetyTimer();

    try {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        throw new Error("Por favor, preencha todos os campos.");
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error("As senhas não coincidem.");
      }

      if (formData.password.length < 6) {
        throw new Error("A senha deve ter pelo menos 6 caracteres.");
      }

      const { error } = await signUp(formData.email, formData.password, formData.name);
      if (error) throw error;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      setSuccess("Conta criada com sucesso! Você já pode entrar.");
      setTimeout(() => {
         setMode('login');
         setSuccess(null);
         setIsLoading(false);
      }, 2000);

    } catch (err: any) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setError(err.message || "Erro ao criar conta.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-sans text-slate-900">
      <div className="w-full max-w-[450px] bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden relative animate-fade-in border border-slate-100">
        <div className="h-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600"></div>
        
        <div className="p-8 pt-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600 mb-4 shadow-sm border border-cyan-100">
              <BrainCircuit size={32} strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              {mode === 'login' ? 'Bem-vindo ao Pro 7' : 'Criar Nova Conta'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {mode === 'login' ? 'Faça login para acessar seu painel.' : 'Comece a usar o sistema gratuitamente.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl flex items-center gap-3 animate-shake">
              {error.includes('servidor') ? <WifiOff size={18} /> : <AlertCircle size={18} />}
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-bold rounded-xl flex items-center gap-3 animate-fade-in">
              <CheckCircle size={18} /> {success}
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-5">
            {mode === 'register' && (
              <div className="space-y-1 animate-slide-in-from-bottom-4">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input 
                    name="name"
                    type="text" 
                    placeholder="Ex: João Silva"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all text-sm font-medium text-slate-800 placeholder-slate-400"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input 
                  name="email"
                  type="email" 
                  placeholder="seu@email.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all text-sm font-medium text-slate-800 placeholder-slate-400"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input 
                  name="password"
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all text-sm font-medium text-slate-800 placeholder-slate-400"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="space-y-1 animate-slide-in-from-bottom-4">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Confirmar Senha</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input 
                    name="confirmPassword"
                    type="password" 
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all text-sm font-medium text-slate-800 placeholder-slate-400"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Processando...</span>
                  </>
                ) : (
                  mode === 'login' ? (
                    <>Entrar no Sistema <ArrowRight size={18} /></>
                  ) : (
                    <>Criar Conta Gratuita <ArrowRight size={18} /></>
                  )
                )}
              </button>
              {isLoading && (
                 <p className="text-[10px] text-center text-slate-400 mt-2 animate-pulse">
                   Aguardando resposta do servidor...
                 </p>
              )}
            </div>
          </form>

          <div className="mt-8 text-center space-y-4">
            {mode === 'login' && (
              <button className="text-xs font-bold text-slate-400 hover:text-cyan-600 transition-colors">
                Esqueci minha senha
              </button>
            )}
            
            <div className="pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                {mode === 'login' ? 'Ainda não tem uma conta?' : 'Já possui cadastro?'}
              </p>
              <button 
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError(null);
                  setSuccess(null);
                  setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                }}
                className="text-cyan-600 font-bold hover:text-cyan-700 mt-1"
              >
                {mode === 'login' ? 'Criar conta agora' : 'Fazer login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
