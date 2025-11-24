
import React, { useState, useEffect } from 'react';
import { AuthForm } from './components/AuthForm';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { GamesContainer } from './components/GamesContainer';
import { AgendaView } from './components/AgendaView';
import { MetrarView } from './components/MetrarView';
import { ClassesView } from './components/ClassesView';
import { ActivityGeneratorView } from './components/ActivityGeneratorView';
import { AdminView } from './components/AdminView';
import { CommunityView } from './components/CommunityView';
import { 
  ProfileView, 
  VideosView 
} from './components/PlaceholderViews';
import { User, View } from './types';
import { DataProvider } from './contexts/DataContext';
import { Crown, Lock, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  const [isDarkMode, setIsDarkMode] = useState(false);

  // --- Initialization & Auth Logic ---
  useEffect(() => {
    // Check Auth
    const savedUser = localStorage.getItem('eduEscapeUser');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        // Garantir campos novos se for login antigo
        if (!u.plan) u.plan = 'free';
        if (!u.role) u.role = 'teacher';
        if (!u.status) u.status = 'approved';
        setUser(u);
      } catch (e) {
        localStorage.removeItem('eduEscapeUser');
      }
    }
    
    setIsDarkMode(false);
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');

    setIsInitializing(false);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newMode;
    });
  };

  const handleLogin = (userData: User) => {
    // Ao logar, definimos defaults para teste se não vierem
    const fullUser: User = {
       ...userData,
       role: userData.role || 'teacher',
       plan: userData.plan || 'free',
       status: userData.status || 'approved',
       joinedAt: new Date().toISOString()
    };
    setUser(fullUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('eduEscapeUser');
    setUser(null);
    setCurrentView('dashboard'); 
  };

  // --- ACCESS CONTROL (GATEKEEPER) ---
  const isPremiumFeature = (view: View) => {
    return ['games', 'activity-generator', 'videos'].includes(view);
  };

  const hasAccess = (view: View) => {
    if (!user) return false;
    if (view === 'admin' && user.role !== 'admin') return false;
    if (isPremiumFeature(view) && user.plan !== 'premium') return false;
    return true;
  };

  const PremiumGate = () => (
     <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-fade-in">
        <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-amber-500/20">
           <Lock size={48} className="text-amber-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-4">Recurso Exclusivo Premium</h2>
        <p className="text-slate-500 max-w-md mb-8 text-lg">
           Desbloqueie o poder total da IA, Jogos Educativos e Downloads ilimitados fazendo o upgrade do seu plano.
        </p>
        <button className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl shadow-xl transform transition-transform hover:scale-105 flex items-center gap-3 text-lg">
           <Crown size={24} /> Quero ser Premium
        </button>
     </div>
  );

  const AdminGate = () => (
     <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-fade-in">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
           <ShieldCheck size={48} className="text-red-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-4">Acesso Negado</h2>
        <p className="text-slate-500 max-w-md">
           Esta área é restrita aos administradores do sistema Pro 7.
        </p>
     </div>
  );

  const renderView = () => {
    if (!user) return <AuthForm onLogin={handleLogin} />;

    // Verificação de Acesso
    if (!hasAccess(currentView)) {
       if (currentView === 'admin') return <AdminGate />;
       return <PremiumGate />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard user={user} onNavigate={setCurrentView} />;
      case 'games':
        return <GamesContainer />;
      case 'profile':
        return <ProfileView />;
      case 'agenda':
        return <AgendaView />;
      case 'classes':
        return <ClassesView onNavigate={setCurrentView} />;
      case 'lesson-plans':
        return <MetrarView />; 
      case 'videos':
        return <VideosView />;
      case 'activity-generator':
        return <ActivityGeneratorView />;
      case 'admin':
        return <AdminView />;
      case 'community':
        return <CommunityView />;
      default:
        return <Dashboard user={user} onNavigate={setCurrentView} />;
    }
  };

  if (isInitializing) {
    return <div className="min-h-screen bg-slate-50 transition-colors"></div>;
  }

  if (!user) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return (
    <DataProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-[#020410] transition-colors duration-300 font-sans text-slate-900 dark:text-white">
        <Sidebar 
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          currentView={currentView}
          setCurrentView={setCurrentView}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          user={user}
          onLogout={handleLogout}
        />
        
        <main 
          className={`
            transition-all duration-300 ease-in-out
            ${isSidebarOpen ? 'ml-64' : 'ml-20'}
            p-8 min-h-screen relative
          `}
        >
          {/* Background Texture */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-50 pointer-events-none mix-blend-soft-light dark:opacity-20"></div>
          
          <div className="relative z-10">
             {renderView()}
          </div>
        </main>
      </div>
    </DataProvider>
  );
};

export default App;
