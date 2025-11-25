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

  // -------------------------------------------------
  // 1. Autenticação e Sessão (Gerencia currentUser)
  // -------------------------------------------------
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
      console.warn("Erro ao buscar perfil, usando base:", e);
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

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSessionChange(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // -------------------------------------------------
  // 2. Busca de Dados (Resiliente e Isolada)
  // -------------------------------------------------
  useEffect(() => {
    if (currentUser?.id) {
      fetchAllData(currentUser.id);
    }
  }, [currentUser?.id]);

  const fetchAllData = async (userId: string) => {
    console.log('[DATA] Carregando dados para userId:', userId);

    // 1. Eventos (Agenda)
    try {
      const { data, error } = await supabase.from('events').select('*').eq('user_id', userId);
      if (data) {
        setEvents(data.map(e => ({
          id: e.id, userId: e.user_id, title: e.title, type: e.type, start: e.start, end: e.end, description: e.description, classId: e.class_id, className: e.class_name
        })));
      }
    } catch (e) { console.error('[DATA] Erro events:', e); }

    // 2. Planos de Aula
    try {
      const { data, error } = await supabase.from('plans').select('*').eq('user_id', userId);
      if (data) {
        setPlans(data.map(p => ({
          id: p.id, userId: p.user_id, className: p.class_name, subject: p.subject, bimester: p.bimester, totalLessons: p.total_lessons, theme: p.theme, bnccFocus: p.bncc_focus, lessons: typeof p.lessons === 'string' ? JSON.parse(p.lessons) : p.lessons, createdAt: p.created_at
        })));
      }
    } catch (e) { console.error('[DATA] Erro plans:', e); }

    // 3. Turmas (Classes) - Com fallback se activities falhar
    try {
      let res = await supabase.from('classes').select('*, activities(*)').eq('user_id', userId);
      
      // Se falhar no join (ex: tabela activities não existe), tenta pegar só as classes
      if (res.error) {
         console.warn('[DATA] Falha ao buscar activities vinculadas, buscando apenas classes.', res.error.message);
         res = await supabase.from('classes').select('*').eq('user_id', userId);
      }

      if (res.data) {
        setClasses(res.data.map(c => ({
          id: c.id, userId: c.user_id, name: c.name, grade: c.grade, subject: c.subject, shift: c.shift, studentsCount: c.students_count, linkedPlanIds: c.linked_plan_ids || [],
          generatedActivities: c.activities?.map((a: any) => ({
            id: a.id, classId: a.class_id, type: a.type, title: a.title, content: typeof a.content === 'string' ? JSON.parse(a.content) : a.content, createdAt: a.created_at, relatedLessonIds: a.related_lesson_ids || []
          })) || []
        })));
      }
    } catch (e) { console.error('[DATA] Erro classes:', e); }

    // 4. Comunidade (Posts)
    try {
      const { data, error } = await supabase.from('community').select('*').order('created_at', { ascending: false });
      if (data) {
        setPosts(data.map(p => ({
          id: p.id, userId: p.user_id, userName: p.user_name, content: p.content, likes: p.likes, createdAt: p.created_at, isPinned: p.is_pinned
        })));
      }
    } catch (e) { console.error('[DATA] Erro posts:', e); }

    // 5. Configurações
    try {
      const { data, error } = await supabase.from('configuracoes_sistema').select('*');
      if (data && data.length > 0) {
        setSystemSettings(data as SystemSettings[]);
      } else {
        setSystemSettings([{ plan: 'free', can_use_ia: false, can_create_classes: true, can_access_escape: false, can_access_videos: false, can_export_pdf: false }, { plan: 'premium', can_use_ia: true, can_create_classes: true, can_access_escape: true, can_access_videos: true, can_export_pdf: true }]);
      }
    } catch (e) { console.error('[DATA] Erro settings:', e); }

    // 6. Admin - Usuários
    if (currentUser?.role === 'admin') {
      try {
        const { data } = await supabase.from('profiles').select('*');
        if (data) {
          setUsers(data.map(u => ({
            id: u.id, name: u.name, email: u.email, role: u.role, plan: u.plan, status: u.status, joinedAt: u.joined_at, themePreference: u.theme_preference, avatarUrl: u.avatar_url, phone: u.phone, bio: u.bio, education: u.education, expertise: u.expertise
          })));
        }
      } catch (e) { console.error('[DATA] Erro users:', e); }
    }
  };

  const refreshData = async () => {
    if (!currentUser) return;
    await fetchAllData(currentUser.id);
  };

  // --- Auth Functions ---
  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) { setLoading(false); return { error }; }
    if (data.user) {
        const isAdmin = email.toLowerCase().includes('admin');
        await supabase.from('profiles').upsert({
            id: data.user.id, email, name: (data.user.user_metadata as any)?.name || email.split('@')[0], role: isAdmin ? 'admin' : 'teacher', plan: isAdmin ? 'premium' : 'free', status: 'approved', joined_at: new Date().toISOString()
        }, { onConflict: 'id' });
    }
    return { error: null };
  };

  const signUp = async (email: string, pass: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email, password: pass, options: { emailRedirectTo: window.location.origin, data: { name } }
    });
    if (error) return { error };
    if (data.user) {
      const isAdmin = email.toLowerCase().includes('admin');
      await supabase.from('profiles').upsert({
        id: data.user.id, email, name, role: isAdmin ? 'admin' : 'teacher', plan: isAdmin ? 'premium' : 'free', status: 'approved', joined_at: new Date().toISOString()
      }, { onConflict: 'id' });
    }
    return { error: null };
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  // --- CRUD ---
  const addClass = async (classRoom: ClassRoom) => {
    if (!currentUser) throw new Error('Você precisa estar logado para criar uma turma.');
    const { data, error } = await supabase.from('classes').insert([{ user_id: currentUser.id, name: classRoom.name, grade: classRoom.grade, subject: classRoom.subject, shift: classRoom.shift, students_count: classRoom.studentsCount || 0 }]).select().single();
    if (error) throw new Error(error.message);
    if (data) setClasses(prev => [...prev, { id: data.id, userId: data.user_id, name: data.name, grade: data.grade, subject: data.subject, shift: data.shift, studentsCount: data.students_count, linkedPlanIds: [], generatedActivities: [] }]);
  };

  const updateClass = async (classRoom: ClassRoom) => {
    const { error } = await supabase.from('classes').update({ name: classRoom.name, grade: classRoom.grade, subject: classRoom.subject, shift: classRoom.shift, students_count: classRoom.studentsCount }).eq('id', classRoom.id);
    if (!error) setClasses(prev => prev.map(c => (c.id === classRoom.id ? classRoom : c)));
  };

  const deleteClass = async (id: string) => {
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (!error) setClasses(prev => prev.filter(c => c.id !== id));
  };

  const addEvent = async (event: Omit<CalendarEvent, 'id'>) => {
    if (!currentUser) return;
    const { data, error } = await supabase.from('events').insert([{ user_id: currentUser.id, title: event.title, type: event.type, start: event.start, end: event.end, description: event.description, class_id: event.classId, class_name: event.className }]).select().single();
    if (error) throw new Error(error.message);
    if (data) setEvents(prev => [...prev, { id: data.id, userId: data.user_id, title: data.title, type: data.type, start: data.start, end: data.end, description: data.description, classId: data.class_id, className: data.class_name }]);
  };

  const addEvents = async (newEvents: Omit<CalendarEvent, 'id'>[]) => {
    if (!currentUser) return;
    const dbEvents = newEvents.map(e => ({ user_id: currentUser.id, title: e.title, type: e.type, start: e.start, end: e.end, description: e.description, class_id: e.classId, class_name: e.className }));
    const { data, error } = await supabase.from('events').insert(dbEvents).select();
    if (error) throw new Error(error.message);
    if (data) {
        const mapped = data.map(d => ({ id: d.id, userId: d.user_id, title: d.title, type: d.type, start: d.start, end: d.end, description: d.description, classId: d.class_id, className: d.class_name }));
        setEvents(prev => [...prev, ...mapped]);
    }
  };

  const updateEvent = async (event: CalendarEvent) => {
    const { error } = await supabase.from('events').update({ title: event.title, type: event.type, start: event.start, end: event.end, description: event.description, class_id: event.classId, class_name: event.className }).eq('id', event.id);
    if (!error) setEvents(prev => prev.map(e => (e.id === event.id ? event : e)));
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (!error) setEvents(prev => prev.filter(e => e.id !== id));
  };

  const addPlan = async (plan: BimesterPlan) => {
    if (!currentUser) return;
    const { data, error } = await supabase.from('plans').insert([{ user_id: currentUser.id, class_name: plan.className, subject: plan.subject, bimester: plan.bimester, total_lessons: plan.totalLessons, theme: plan.theme, bncc_focus: plan.bnccFocus, lessons: JSON.stringify(plan.lessons) }]).select().single();
    if (error) throw new Error(error.message);
    if (data) setPlans(prev => [...prev, { ...plan, id: data.id, userId: currentUser.id, createdAt: data.created_at }]);
  };

  const updatePlan = async (plan: BimesterPlan) => {
    const { error } = await supabase.from('plans').update({ class_name: plan.className, subject: plan.subject, bimester: plan.bimester, total_lessons: plan.totalLessons, theme: plan.theme, bncc_focus: plan.bnccFocus, lessons: JSON.stringify(plan.lessons) }).eq('id', plan.id);
    if (!error) setPlans(prev => prev.map(p => (p.id === plan.id ? plan : p)));
  };

  const deletePlan = async (id: string) => {
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (!error) setPlans(prev => prev.filter(p => p.id !== id));
  };

  const updateUser = async (user: User) => {
    const { error } = await supabase.from('profiles').update({ name: user.name, role: user.role, plan: user.plan, status: user.status, theme_preference: user.themePreference }).eq('id', user.id);
    if (!error) {
      if (currentUser?.id === user.id) setCurrentUser(user);
      setUsers(prev => prev.map(u => (u.id === user.id ? user : u)));
    }
  };

  const updateUsersBatch = async (updatedUsers: User[]) => {
    for (const u of updatedUsers) {
      await supabase.from('profiles').update({ plan: u.plan, status: u.status, role: u.role }).eq('id', u.id);
    }
    setUsers(prev => prev.map(u => { const updated = updatedUsers.find(up => up.id === u.id); return updated ?? u; }));
  };

  const deleteUser = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (!error) setUsers(prev => prev.filter(u => u.id !== id));
  };

  const saveSystemSettings = async (settings: SystemSettings[]) => {
    const { error } = await supabase.from('configuracoes_sistema').upsert(settings);
    if (error) throw new Error(error.message);
    setSystemSettings(settings);
  };

  const addPost = async (content: string, user: User) => {
    const { data, error } = await supabase.from('community').insert([{ user_id: user.id, user_name: user.name, content, likes: 0 }]).select().single();
    if (error) throw new Error(error.message);
    if (data) setPosts(prev => [{ id: data.id, userId: data.user_id, userName: data.user_name, content: data.content, likes: data.likes, createdAt: data.created_at, isPinned: false }, ...prev]);
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from('community').delete().eq('id', id);
    if (!error) setPosts(prev => prev.filter(p => p.id !== id));
  };

  const likePost = async (id: string) => {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    const newLikes = post.likes + 1;
    await supabase.from('community').update({ likes: newLikes }).eq('id', id);
    setPosts(prev => prev.map(p => (p.id === id ? { ...p, likes: newLikes } : p)));
  };

  const addActivity = async (activity: GeneratedActivity) => {
    const { data, error } = await supabase.from('activities').insert([{ class_id: activity.classId, type: activity.type, title: activity.title, content: JSON.stringify(activity.content) }]).select().single();
    if (error) throw new Error(error.message);
    if (data) {
      const newAct: GeneratedActivity = { id: data.id, classId: data.class_id, type: data.type, title: data.title, content: typeof data.content === 'string' ? JSON.parse(data.content) : data.content, createdAt: data.created_at };
      setClasses(prev => prev.map(c => (c.id === activity.classId ? { ...c, generatedActivities: [...c.generatedActivities, newAct] } : c)));
    }
  };

  return (
    <DataContext.Provider value={{ loading, currentUser, signIn, signUp, signOut, events, addEvent, addEvents, updateEvent, deleteEvent, plans, addPlan, updatePlan, deletePlan, classes, addClass, updateClass, deleteClass, users, updateUser, updateUsersBatch, deleteUser, systemSettings, saveSystemSettings, posts, addPost, deletePost, likePost, addActivity, refreshData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
};