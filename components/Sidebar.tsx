
import React from 'react';
import { 
  LayoutDashboard, 
  Gamepad2, 
  Calendar, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  Moon, 
  Sun, 
  LogOut, 
  BrainCircuit, 
  BookOpen, 
  Video, 
  Lock, 
  ShieldCheck, 
  MessageCircle 
} from 'lucide-react';
import { View, User } from '../types';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  currentView: View;
  setCurrentView: (view: View) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  user: User;
  onLogout: () => Promise<void>;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  toggleSidebar, 
  currentView, 
  setCurrentView, 
  isDarkMode, 
  toggleTheme, 
  user, 
  onLogout 
}) => {
  
  const handleLogoutClick = async () => {
    // Removido o window.confirm para evitar bloqueios do navegador e garantir logout imediato
    try {
      await onLogout();
    } catch (error) {
      console.error("Erro ao tentar sair:", error);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, premium: false },
    { id: 'agenda', label: 'Agenda', icon: Calendar, premium: false },
    { id: 'lesson-plans', label: 'Planos de Aula', icon: BookOpen, premium: false },
    { id: 'classes', label: 'Turmas', icon: Users, premium: false },
    { id: 'community', label: 'Comunidade', icon: MessageCircle, premium: false },
    { id: 'games', label: 'Edu Escape', icon: Gamepad2, premium: true },
    { id: 'activity-generator', label: 'Gerador IA', icon: BrainCircuit, premium: true },
    { id: 'videos', label: 'Vídeos', icon: Video, premium: true },
  ];

  if (user.role === 'admin') {
    menuItems.push({ id: 'admin', label: 'Administração', icon: ShieldCheck, premium: false });
  }

  return (
    <aside 
      className={`
        fixed top-0 left-0 z-40 h-screen bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-white/5 
        transition-all duration-300 ease-in-out flex flex-col
        ${isOpen ? 'w-64' : 'w-20'}
      `}
    >
      {/* Header */}
      <div className="h-20 flex items-center justify-between px-4 shrink-0 border-b border-slate-100 dark:border-white/5">
        <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
          <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center text-white shrink-0">
            <span className="font-black text-sm">P7</span>
          </div>
          <span className="font-black text-xl text-slate-800 dark:text-white tracking-tight whitespace-nowrap">
            Pro <span className="text-cyan-600">7</span>
          </span>
        </div>
        
        <button 
          onClick={toggleSidebar}
          className="p-2 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-500 transition-colors"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Navigation - Scrollable Area */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          const isLocked = item.premium && user.plan !== 'premium' && user.role !== 'admin';

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative
                ${isActive 
                  ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }
              `}
            >
              <div className={`relative ${!isOpen && 'mx-auto'}`}>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {isLocked && (
                  <div className="absolute -top-1 -right-1 bg-amber-100 text-amber-600 rounded-full p-[2px] border border-white dark:border-slate-900">
                    <Lock size={8} />
                  </div>
                )}
              </div>
              
              <span className={`font-medium text-sm whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute'}`}>
                {item.label}
              </span>

              {!isOpen && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sticky Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0b1121] shrink-0 flex flex-col gap-4">
        
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className={`flex items-center justify-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/5 transition-all text-slate-600 dark:text-slate-400 ${!isOpen && 'aspect-square'}`}
          title="Alternar Tema"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          {isOpen && <span className="text-sm font-bold">Tema {isDarkMode ? 'Escuro' : 'Claro'}</span>}
        </button>

        {/* User Profile */}
        <div className={`flex items-center gap-3 ${!isOpen && 'justify-center'}`}>
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.name} 
              className="w-10 h-10 rounded-full object-cover shadow-lg shadow-cyan-500/20 border-2 border-white dark:border-slate-700 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-cyan-500/20">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          
          {isOpen && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user.plan === 'premium' ? 'Plano Premium' : 'Plano Gratuito'}</p>
            </div>
          )}
        </div>

        {/* Logout Button - Always Visible */}
        <button 
          type="button"
          onClick={handleLogoutClick}
          className={`
            flex items-center justify-center gap-2 w-full p-3 rounded-xl 
            bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/30 
            text-[#E53935] dark:text-[#FF6E6E] font-bold text-sm transition-colors
            ${!isOpen && 'aspect-square p-0'}
          `}
          title="Sair da conta"
        >
          <LogOut size={20} />
          {isOpen && <span>Sair</span>}
        </button>

      </div>
    </aside>
  );
};
