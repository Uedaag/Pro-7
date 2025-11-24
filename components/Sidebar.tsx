
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
  onLogout: () => void;
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
  
  const isPremium = user.plan === 'premium';
  const isAdmin = user.role === 'admin';

  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, premium: false },
    { id: 'agenda', label: 'Agenda', icon: Calendar, premium: false },
    { id: 'lesson-plans', label: 'Planos de Aula', icon: BookOpen, premium: false },
    { id: 'classes', label: 'Turmas', icon: Users, premium: false },
    { id: 'community', label: 'Comunidade', icon: MessageCircle, premium: false },
    { id: 'activity-generator', label: 'Gerador IA', icon: BrainCircuit, premium: true },
    { id: 'games', label: 'Jogos', icon: Gamepad2, premium: true },
    { id: 'videos', label: 'Vídeos', icon: Video, premium: true },
  ];

  return (
    <aside 
      className={`
        fixed left-0 top-0 h-screen z-40 transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : 'w-20'}
        bg-slate-50 dark:bg-[#020410] border-r border-slate-200 dark:border-white/5
        flex flex-col shadow-xl
      `}
    >
      {/* Header / Logo */}
      <div className="h-20 flex items-center justify-center border-b border-slate-200 dark:border-white/5 relative">
        <div className="flex items-center gap-3 overflow-hidden px-4 w-full">
           <div className="relative shrink-0">
              <div className="absolute inset-0 bg-cyan-500/20 blur-lg rounded-full"></div>
              <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-black p-2 rounded-lg border border-slate-300 dark:border-white/10">
                <BrainCircuit className="text-cyan-600 dark:text-cyan-400" size={24} />
              </div>
            </div>
            <span className={`font-bold text-xl tracking-tight text-slate-800 dark:text-white transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
              Pro <span className="text-cyan-600 dark:text-cyan-400">7</span>
            </span>
        </div>
        
        {/* Toggle Button */}
        <button 
          onClick={toggleSidebar}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 shadow-md z-50"
        >
          {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          const isLocked = item.premium && !isPremium;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={`
                w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }
              `}
              title={!isOpen ? item.label : undefined}
            >
              <div className={`shrink-0 ${!isOpen && isActive ? 'text-cyan-600 dark:text-cyan-400' : ''}`}>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`font-medium whitespace-nowrap transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                {item.label}
              </span>
              
              {/* Lock Icon for Free Users */}
              {isLocked && isOpen && (
                 <Lock size={14} className="ml-auto text-slate-400" />
              )}

              {isActive && isOpen && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
              )}
            </button>
          );
        })}

        {isAdmin && (
           <div className="mt-8 pt-4 border-t border-slate-200 dark:border-white/5">
              <button
                onClick={() => setCurrentView('admin')}
                className={`
                  w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group
                  ${currentView === 'admin' 
                    ? 'bg-slate-800 text-white shadow-lg' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }
                `}
              >
                 <ShieldCheck size={22} />
                 <span className={`font-bold whitespace-nowrap transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                    Admin
                 </span>
              </button>
           </div>
        )}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#020410]">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all mb-2 ${!isOpen ? 'justify-center' : ''}`}
          title="Alternar Tema"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          {isOpen && <span>{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>}
        </button>

        {/* User Profile / Logout */}
        <div className={`flex items-center gap-3 px-3 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 ${!isOpen ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center shrink-0 text-cyan-700 dark:text-cyan-400 font-bold text-xs">
            {user.name.charAt(0).toUpperCase()}
          </div>
          
          {isOpen && (
            <div className="flex-1 overflow-hidden cursor-pointer" onClick={() => setCurrentView('profile')}>
              <p className="text-sm font-bold text-slate-700 dark:text-white truncate">{user.name}</p>
              <div className="flex items-center gap-1">
                 <div className={`w-2 h-2 rounded-full ${isPremium ? 'bg-amber-500' : 'bg-slate-400'}`}></div>
                 <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate uppercase">{user.plan}</p>
              </div>
            </div>
          )}

          {isOpen && (
            <button 
              onClick={onLogout}
              className="text-slate-400 hover:text-red-500 transition-colors p-1"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
