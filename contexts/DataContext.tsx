import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  CalendarEvent,
  DataContextType,
  BimesterPlan,
  ClassRoom,
  User,
  Post,
  GeneratedActivity,
  SystemSettings
} from '../types';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

interface ExtendedDataContextType extends DataContextType {
  addActivity: (activity: GeneratedActivity) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<ExtendedDataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [plans, setPlans] = useState<BimesterPlan[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings[]>([]);

  // --- AUTHENTICATION ---
  const handleSessionChange = async (session: Session | null) => {
    if (!session?.user) {
      console.log('[AUTH] Sem sessão, limpando store');
      setCurrentUser(null);
      setEvents([]);
      setPlans([]);
      setClasses([]);
      setUsers([]);
      setLoading(false);
      return;
    }

    const user = session.user;
    const isAdmin = user.email?.toLowerCase().includes('admin') ?? false;

    const baseUser: User = {
      id: user.id,
      name: (user.user_metadata as any)?.name || user.email?.split('@')[0] || 'Usuário',
      email: user.email || '',
      role: isAdmin ? 'admin' : 'teacher',
      plan: isAdmin ? 'premium' : 'free',
      status: 'approved',
      joinedAt: user.created_at,
      themePreference: 'light'
    };

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile && !error) {
        setCurrentUser({
          ...baseUser,
          name: profile.name || baseUser.name,
          role: profile.role || baseUser.role,
          plan: profile.plan || baseUser.plan,
          status: profile.status || baseUser.status,
          themePreference: profile.theme_preference,
          avatarUrl: profile.avatar_url,
          phone: profile.phone,
          bio: profile.bio,
          education: profile.education,
          expertise: profile.expertise
        });
      } else {
        setCurrentUser(baseUser);
      }
    } catch (e) {
      setCurrentUser(baseUser);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      await handleSessionChange(data.session);
    };
    init();
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => handleSessionChange(session));
    return () => listener.subscription.unsubscribe();
  }, []);

  // --- DATA FETCHING ---
  useEffect(() => {
    if (currentUser?.id) {
      fetchAllData(currentUser.id);
    }
  }, [currentUser?.id]);

  const fetchAllData = async (userId: string) => {
    if (!currentUser) return;
    console.log('[DATA] Carregando dados para userId:', userId);

    // 1. Agenda
    try {
      const { data, error } = await supabase.from('events').select('*').eq('user_id', userId);
      if (error) throw error;
      if (data) {
        setEvents(data.map((e: any) => ({
          id: e.id, userId: e.user_id, title: e.title, type: e.type, start: e.start, end: e.end, description: e.description, classId: e.class_id, className: e.class_name
        })));
      }
    } catch (err: any) {
      console.error('[DATA] Erro agenda:', err.message || err);
    }

    // 2. Planos
    try {
      const { data, error } = await supabase.from('plans').select('*').eq('user_id', userId);
      if (error) throw error;
      if (data) {
        setPlans(data.map((p: any) => ({
          id: p.id, userId: p.user_id, className: p.class_name, subject: p.subject, bimester: p.bimester, totalLessons: p.total_lessons, theme: p.theme, bnccFocus: p.bncc_focus,
          lessons: typeof p.lessons === 'string' ? JSON.parse(p.lessons) : p.lessons, 
          createdAt: p.created_at
        })));
      }
    } catch (err: any) {
      console.error('[DATA] Erro planos:', err.message || err);
    }

    // 3. Turmas
    let loadedClasses: any[] = [];
    try {
      const { data, error } = await supabase.from('classes').select('*').eq('user_id', userId);
      if (error) throw error;
      if (data) {
        loadedClasses = data;
        setClasses(data.map((c: any) => ({
          id: c.id, userId: c.user_id, name: c.name, grade: c.grade, subject: c.subject, shift: c.shift, studentsCount: c.students_count, linkedPlanIds: c.linked_plan_ids || [], generatedActivities: []
        })));
      }
    } catch (err: any) {
      console.error('[DATA] Erro turmas:', err.message || err);
    }

    // 4. Comunidade
    try {
      const { data, error } = await supabase.from('community').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setPosts(data.map((p: any) => ({
          id: p.id, userId: p.user_id, userName: p.user_name, content: p.content, likes: p.likes, createdAt: p.created_at, isPinned: p.is_pinned
        })));
      }
    } catch (err: any) {
      console.error('[DATA] Erro comunidade:', err.message || err);
    }

    // 5. Configurações
    try {
      const { data } = await supabase.from('configuracoes_sistema').select('*');
      if (data && data.length > 0) setSystemSettings(data as SystemSettings[]);
    } catch (err) { /* Ignora erros */ }

    // 6. Atividades (Delayed Load)
    try {
      if (loadedClasses.length > 0) {
        const classIds = loadedClasses.map((c) => c.id);
        const { data, error } = await supabase.from('activities').select('*').in('class_id', classIds);
        
        if (error) throw error;

        if (data) {
          const activitiesByClass: Record<string, GeneratedActivity[]> = {};
          data.forEach((a: any) => {
            const content = typeof a.content === 'string' ? JSON.parse(a.content) : a.content;
            const act: GeneratedActivity = { 
              id: a.id, classId: a.class_id, type: a.type, title: a.title, content, createdAt: a.created_at, relatedLessonIds: a.related_lesson_ids || []
            };
            if (!activitiesByClass[a.class_id]) activitiesByClass[a.class_id] = [];
            activitiesByClass[a.class_id].push(act);
          });
          setClasses((prev) => prev.map((c) => ({ ...c, generatedActivities: activitiesByClass[c.id] || [] })));
        }
      }
    } catch (err: any) {
      console.error('[DATA] Erro atividades:', err.message || err);
    }

    // 7. Admin Users
    if (currentUser.role === 'admin') {
      try {
        const { data } = await supabase.from('profiles').select('*');
        if (data) {
          setUsers(data.map((u: any) => ({
            id: u.id, name: u.name, email: u.email, role: u.role, plan: u.plan, status: u.status, joinedAt: u.joined_at, themePreference: u.theme_preference, avatarUrl: u.avatar_url, phone: u.phone, bio: u.bio, education: u.education, expertise: u.expertise
          })));
        }
      } catch (err: any) { console.error('[DATA] Erro users:', err.message); }
    }
  };

  const refreshData = async () => { if (currentUser) await fetchAllData(currentUser.id); };

  // --- AUTH ACTIONS ---
  const signIn = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return { error };
  };

  const signUp = async (email: string, pass: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { data: { name } } });
    if (data.user) {
       await supabase.from('profiles').upsert({ id: data.user.id, email, name, role: 'teacher', plan: 'free', status: 'approved' });
    }
    return { error };
  };

  const signOut = async () => await supabase.auth.signOut();

  // --- CRUD ACTIONS ---
  const addClass = async (c: any) => {
    const { data, error } = await supabase.from('classes').insert([{...c, user_id: currentUser?.id}]).select().single();
    if(error) throw new Error(error.message);
    if(data) setClasses(prev=>[...prev, {...c, id: data.id}]);
  };
  const updateClass = async (c: any) => {};
  const deleteClass = async (id: string) => {
    await supabase.from('classes').delete().eq('id', id);
    setClasses(prev=>prev.filter(c=>c.id!==id));
  };

  const addEvent = async (e: any) => {
    const { data, error } = await supabase.from('events').insert([{...e, user_id: currentUser?.id}]).select().single();
    if(error) throw new Error(error.message);
    if(data) setEvents(prev=>[...prev, {...e, id: data.id}]);
  };
  const addEvents = async (es: any[]) => {
     // Bulk insert not fully implemented in this snippet for brevity
  };
  const updateEvent = async (e: any) => {
    const { error } = await supabase.from('events').update(e).eq('id', e.id);
    if(!error) setEvents(prev=>prev.map(ev=>ev.id===e.id?e:ev));
  };
  const deleteEvent = async (id: string) => {
    await supabase.from('events').delete().eq('id', id);
    setEvents(prev=>prev.filter(e=>e.id!==id));
  };

  const addPlan = async (plan: BimesterPlan) => {
    const { data: { user } } = await supabase.auth.getUser();
    const user_id = user?.id || currentUser?.id;
    if (!user_id) throw new Error("Usuário não autenticado.");

    // Envia lessons diretamente como objeto JSON, o Supabase/Postgres converte para JSONB
    const { data, error } = await supabase.from('plans').insert([{
        user_id: user_id,
        class_name: plan.className,
        subject: plan.subject,
        bimester: plan.bimester,
        total_lessons: plan.totalLessons,
        theme: plan.theme,
        bncc_focus: plan.bnccFocus,
        lessons: plan.lessons // Envia como objeto, não string
    }]).select().single();
    
    if (error) throw new Error(error.message);
    if (data) setPlans(prev => [...prev, { ...plan, id: data.id, userId: user_id, createdAt: data.created_at }]);
  };

  const updatePlan = async (p: any) => {};
  const deletePlan = async (id: string) => {
    await supabase.from('plans').delete().eq('id', id);
    setPlans(prev=>prev.filter(p=>p.id!==id));
  };

  const addPost = async (c: string, u: User) => {
    const { data, error } = await supabase.from('community').insert([{user_id: u.id, user_name: u.name, content: c}]).select().single();
    if(error) throw new Error(error.message);
    if(data) setPosts(prev=>[{...data, userId: data.user_id, userName: data.user_name}, ...prev]);
  };
  const deletePost = async (id: string) => {
    await supabase.from('community').delete().eq('id', id);
    setPosts(prev=>prev.filter(p=>p.id!==id));
  };
  const likePost = async (id: string) => {
     // Optimistic update logic omitted for brevity
  };

  const addActivity = async (act: GeneratedActivity) => {
    const { data, error } = await supabase.from('activities').insert([{
        class_id: act.classId,
        type: act.type,
        title: act.title,
        content: act.content // Envia como objeto JSON
    }]).select().single();

    if (error) throw new Error(error.message);
    
    // Se sucesso, atualiza estado local
    if (data) {
        const newAct = { ...act, id: data.id, createdAt: data.created_at };
        setClasses(prev => prev.map(c => c.id === act.classId ? {...c, generatedActivities: [...c.generatedActivities, newAct]} : c));
    }
  };

  const updateUser = async (u: User) => {
     const { error } = await supabase.from('profiles').update({
         name: u.name, bio: u.bio, phone: u.phone, theme_preference: u.themePreference
     }).eq('id', u.id);
     if(!error) setCurrentUser(u);
  };
  const updateUsersBatch = async (us: User[]) => {};
  const deleteUser = async (id: string) => {};
  const saveSystemSettings = async (s: any) => {};

  return (
    <DataContext.Provider value={{
      loading, currentUser, signIn, signUp, signOut,
      events, addEvent, addEvents, updateEvent, deleteEvent,
      plans, addPlan, updatePlan, deletePlan,
      classes, addClass, updateClass, deleteClass,
      users, updateUser, updateUsersBatch, deleteUser,
      systemSettings, saveSystemSettings,
      posts, addPost, deletePost, likePost,
      addActivity, refreshData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
};