
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { 
  ShieldCheck, Mail, Lock, User as UserIcon, Loader2, 
  ArrowRight, AlertCircle, CheckCircle, Eye, EyeOff, BrainCircuit 
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface AuthFormProps {
  onLogin: (user: User) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const { users, addUser } = useData();
  
  // Estado do Modo (Login vs Cadastro)
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Estados do Formulário
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

  // Forçar modo claro ao montar
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null); // Limpar erro ao digitar
  };

  // --- SIMULAÇÃO DE BANCO DE SENHAS (LOCAL) ---
  // Como o User type não tem senha, usamos localStorage para simular a validação de senha
  const saveCredential = (email: string, pass: string) => {
    const db = JSON.parse(localStorage.getItem('pro7_auth_db') || '{}');
    db[email] = pass;
    localStorage.setItem('pro7_auth_db', JSON.stringify(db));
  };

  const checkCredential = (email: string, pass: string) => {
    const db = JSON.parse(localStorage.getItem('pro7_auth_db') || '{}');
    // Para usuários mockados iniciais, aceita qualquer senha não vazia
    if (!db[email] && (email === 'admin@pro7.com' || email.includes('@escola.com'))) return true;
    return db[email] === pass;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      // 1. Validação Básica
      if (!formData.email || !formData.password) {
        setError("Preencha todos os campos.");
        setIsLoading(false);
        return;
      }

      // 2. Buscar Usuário
      const user = users.find(u => u.email === formData.email);

      if (!user) {
        setError("Email não encontrado no sistema.");
        setIsLoading(false);
        return;
      }

      // 3. Verificar Senha (Simulado)
      if (!checkCredential(formData.email, formData.password)) {
        setError("Senha incorreta.");
        setIsLoading(false);
        return;
      }

      // 4. Verificar Status
      if (user.status === 'blocked') {
        setError("Conta bloqueada. Contate o administrador.");
        setIsLoading(false);
        return;
      }

      // Sucesso
      localStorage.setItem('eduEscapeUser', JSON.stringify(user));
      onLogin(user);
      setIsLoading(false);
    }, 1500);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      // 1. Validação de Campos Vazios
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        setError("Por favor, preencha todos os campos.");
        setIsLoading(false);
        return;
      }

      // 2. Validação de Senha
      if (formData.password !== formData.confirmPassword) {
        setError("As senhas não coincidem.");
        setIsLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres.");
        setIsLoading(false);
        return;
      }

      // 3. Verificar se Email já existe
      const existingUser = users.find(u => u.email === formData.email);
      if (existingUser) {
        setError("Este email já está cadastrado.");
        setIsLoading(false);
        return;
      }

      // 4. Criar Usuário
      const newUser: User = {
        id: crypto.randomUUID(),
        name: formData.name,
        email: formData.email,
        role: 'teacher', // Padrão
        plan: 'free',    // Padrão Gratuito
        status: 'approved', // Aprovado para acessar Dashboard Free imediatamente
        joinedAt: new Date().toISOString()
      };

      // Salvar senha simulada
      saveCredential(formData.email, formData.password);

      // Salvar no Contexto
      addUser(newUser);
      localStorage.setItem('eduEscapeUser', JSON.stringify(newUser));

      setSuccess("Conta criada com sucesso! Redirecionando...");
      
      // Auto Login após 1.5s
      setTimeout(() => {
        onLogin(newUser);
      }, 1500);

    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-sans text-slate-900">
      
      <div className="w-full max-w-[450px] bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden relative animate-fade-in border border-slate-100">
        
        {/* Header Visual */}
        <div className="h-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600"></div>
        
        <div className="p-8 pt-10">
          {/* Logo */}
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

          {/* Mensagens de Feedback */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl flex items-center gap-3 animate-shake">
              <AlertCircle size={18} /> {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-bold rounded-xl flex items-center gap-3 animate-fade-in">
              <CheckCircle size={18} /> {success}
            </div>
          )}

          {/* Formulário */}
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
            </div>

          </form>

          {/* Footer Links */}
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
