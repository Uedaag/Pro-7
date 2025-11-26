
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
import { VideosView } from './components/VideosView'; // Atualizado para o novo componente real
import { ProfileView } from './components/ProfileView';
import { AIChatAssistant } from './components/AIChatAssistant';
import { User, View } from './types';
import { DataProvider, useData } from './contexts/DataContext';
import { Crown, Lock, ShieldCheck, Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, loading, signOut } = useData();
  
  // Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Sync Theme
  useEffect(() => {
    if (currentUser?.themePreference === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, [currentUser]);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newMode;
    });
  };

  // --- ACCESS CONTROL (GATEKEEPER) ---
  const isPremiumFeature = (view: View) => {
    return ['games', 'activity-generator', 'videos'].includes(view);
  };

  const hasAccess = (view: View) => {
    if (!currentUser) return false;
    
    // Admin tem acesso irrestrito (Master Key)
    if (currentUser.role === 'admin') return true;
    
    // Se for admin no email mas o role não atualizou, libera também
    if (currentUser.email.toLowerCase().includes('admin')) return true;
    
    // Se chegou aqui, não é admin (currentUser.role é 'teacher')
    if (view === 'admin') return false;
    
    if (isPremiumFeature(view) && currentUser.plan !== 'premium') return false;
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
    if (!currentUser) return null;

    if (!hasAccess(currentView)) {
       if (currentView === 'admin') return <AdminGate />;
       return <PremiumGate />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard user={currentUser} onNavigate={setCurrentView} />;
      case 'games':
        return <GamesContainer />;
      case 'profile':
        return <ProfileView />;
      case 'agenda':
        return <AgendaView user={currentUser} />;
      case 'classes':
        return <ClassesView user={currentUser} onNavigate={setCurrentView} />;
      case 'lesson-plans':
        return <MetrarView user={currentUser} />; 
      case 'videos':
        return <VideosView />;
      case 'activity-generator':
        return <ActivityGeneratorView />;
      case 'admin':
        return <AdminView />;
      case 'community':
        return <CommunityView />;
      default:
        return <Dashboard user={currentUser} onNavigate={setCurrentView} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-600" size={40} />
      </div>
    );
  }

  if (!currentUser) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020410] transition-colors duration-300 font-sans text-slate-900 dark:text-white">
      <Sidebar 
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        currentView={currentView}
        setCurrentView={setCurrentView}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        user={currentUser}
        onLogout={signOut}
      />
      
      <main 
        className={`
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'ml-64' : 'ml-20'}
          p-8 min-h-screen relative
        `}
      >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-50 pointer-events-none mix-blend-soft-light dark:opacity-20"></div>
        <div className="relative z-10">
            {renderView()}
        </div>
      </main>

      <AIChatAssistant />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
};

export default App;
