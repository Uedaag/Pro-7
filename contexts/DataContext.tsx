
import React, { createContext, useContext, useState, useEffect } from 'react';
import { CalendarEvent, DataContextType, BimesterPlan, ClassRoom, User, Post, GeneratedActivity, SystemSettings } from '../types';
import { supabase } from '../lib/supabaseClient';

interface ExtendedDataContextType extends DataContextType {
  addActivity: (activity: GeneratedActivity) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<ExtendedDataContextType | undefined>(undefined);

// Helper para timeout de promessas
const timeoutPromise = (ms: number, promise: Promise<any>) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("O servidor demorou muito para responder. Verifique sua conexão."));
    }, ms);
    promise
      .then(res => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [plans, setPlans] = useState<BimesterPlan[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [users, setUsers] = useState<User[]>([]); // Para admin
  const [posts, setPosts] = useState<Post[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings[]>([]);

  // --- AUTH LISTENER & DATA FETCHING ---
  useEffect(() => {
    let mounted = true;

    const initData = async () => {
      // Timeout de segurança para não travar a tela de loading infinitamente
      const safetyTimer = setTimeout(() => {
        if (mounted && loading) {
          console.warn("⚠️ Carregamento inicial excedeu o tempo limite. Liberando UI.");
          setLoading(false);
        }
      }, 8000);

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user) {
          try {
            await timeoutPromise(5000, fetchUserProfile(session.user.id));
          } catch (e) {
            console.warn("Perfil demorou a carregar, usando dados da sessão.");
            const isAdmin = session.user.email?.toLowerCase().includes('admin');
            setCurrentUser({
              id: session.user.id,
              name: session.user.user_metadata?.name || 'Usuário',
              email: session.user.email || '',
              role: isAdmin ? 'admin' : 'teacher',
              plan: isAdmin ? 'premium' : 'free',
              status: 'approved',
              joinedAt: new Date().toISOString()
            });
          }
          
          // Carrega dados em background
          fetchAllData(session.user.id);
        }
      } catch (err) {
        console.error("Erro na inicialização:", err);
      } finally {
        clearTimeout(safetyTimer);
        if (mounted) setLoading(false);
      }
    };

    initData();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (session.user.id !== currentUser?.id) {
           fetchUserProfile(session.user.id).catch(console.error);
           fetchAllData(session.user.id).catch(console.error);
        }
      } else {
        if (mounted) {
          setCurrentUser(null);
          setEvents([]);
          setPlans([]);
          setClasses([]);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const refreshData = async () => {
     if (currentUser) {
         await fetchAllData(currentUser.id);
     }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        setCurrentUser({
           id: data.id,
           name: data.name,
           email: data.email,
           role: data.role,
           plan: data.plan,
           status: data.status,
           joinedAt: data.joined_at,
           themePreference: data.theme_preference,
           avatarUrl: data.avatar_url,
           phone: data.phone,
           bio: data.bio,
           education: data.education,
           expertise: data.expertise
        });
      }
    } catch (error) {
      console.error("Erro ao buscar perfil (ignorado):", error);
    }
  };

  const fetchAllData = async (userId: string) => {
    try {
      const p1 = supabase.from('events').select('*').eq('user_id', userId);
      const p2 = supabase.from('plans').select('*').eq('user_id', userId);
      const p3 = supabase.from('classes').select(`*, activities(*)`).eq('user_id', userId);
      const p4 = supabase.from('community').select('*').order('created_at', { ascending: false });
      const p5 = supabase.from('configuracoes_sistema').select('*');

      const [resEvents, resPlans, resClasses, resPosts, resSettings] = await Promise.all([p1, p2, p3, p4, p5]);

      if (resEvents.data) {
        setEvents(resEvents.data.map(e => ({
          id: e.id,
          userId: e.user_id,
          title: e.title,
          type: e.type,
          start: e.start,
          end: e.end,
          description: e.description,
          classId: e.class_id,
          className: e.class_name
        })));
      }

      if (resPlans.data) {
         setPlans(resPlans.data.map(p => ({
            id: p.id,
            userId: p.user_id,
            className: p.class_name,
            subject: p.subject,
            bimester: p.bimester,
            totalLessons: p.total_lessons,
            theme: p.theme,
            bnccFocus: p.bncc_focus,
            lessons: typeof p.lessons === 'string' ? JSON.parse(p.lessons) : p.lessons,
            createdAt: p.created_at
         })));
      }

      if (resClasses.data) {
        setClasses(resClasses.data.map(c => ({
            id: c.id,
            userId: c.user_id,
            name: c.name,
            grade: c.grade,
            subject: c.subject,
            shift: c.shift,
            studentsCount: c.students_count,
            linkedPlanIds: c.linked_plan_ids || [],
            generatedActivities: c.activities?.map((a: any) => ({
                id: a.id,
                classId: a.class_id,
                type: a.type,
                title: a.title,
                content: typeof a.content === 'string' ? JSON.parse(a.content) : a.content,
                createdAt: a.created_at,
                relatedLessonIds: a.related_lesson_ids || []
            })) || []
        })));
      }

      if (resPosts.data) {
        setPosts(resPosts.data.map(p => ({
           id: p.id,
           userId: p.user_id,
           userName: p.user_name,
           content: p.content,
           likes: p.likes,
           createdAt: p.created_at,
           isPinned: p.is_pinned
        })));
      }

      if (resSettings.data && resSettings.data.length > 0) {
          setSystemSettings(resSettings.data as SystemSettings[]);
      } else {
          setSystemSettings([
              { plan: 'free', can_use_ia: false, can_create_classes: true, can_access_escape: false, can_access_videos: false, can_export_pdf: false },
              { plan: 'premium', can_use_ia: true, can_create_classes: true, can_access_escape: true, can_access_videos: true, can_export_pdf: true }
          ]);
      }

      // Check Admin para carregar usuários
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (profile?.role === 'admin') {
         const { data: allProfiles } = await supabase.from('profiles').select('*');
         if (allProfiles) {
             setUsers(allProfiles.map(u => ({
                 id: u.id,
                 name: u.name,
                 email: u.email,
                 role: u.role,
                 plan: u.plan,
                 status: u.status,
                 joinedAt: u.joined_at,
                 themePreference: u.theme_preference,
                 avatarUrl: u.avatar_url,
                 phone: u.phone,
                 bio: u.bio,
                 education: u.education,
                 expertise: u.expertise
             })));
         }
      }
    } catch (e) {
      console.error("Erro parcial ao buscar dados:", e);
    }
  };

  const signIn = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass
    });

    if (error) return { error };

    if (data.user) {
      const isAdmin = email.toLowerCase().includes("admin");
      const role = isAdmin ? "admin" : "teacher";
      const plan = isAdmin ? "premium" : "free";

      // Fire and forget update profile
      supabase.from("profiles").upsert({
        id: data.user.id,
        email: email,
        name: data.user.user_metadata?.name || "",
        role: role,
        status: "approved",
        plan: plan, 
        joined_at: new Date().toISOString()
      }, { onConflict: 'id' }).then(() => fetchUserProfile(data.user.id));

      setCurrentUser({
        id: data.user.id,
        name: data.user.user_metadata?.name || email.split('@')[0],
        email: email,
        role: role as any,
        plan: plan as any,
        status: 'approved',
        joinedAt: new Date().toISOString()
      });
    }

    return { error: null };
  };

  const signUp = async (email: string, pass: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name },
        // @ts-ignore
        shouldCreateUser: true
      }
    });

    if (error) return { error };

    if (data.user) {
      const isAdmin = email.toLowerCase().includes('admin');
      const role = isAdmin ? 'admin' : 'teacher';
      const plan = isAdmin ? 'premium' : 'free';
      
      supabase.from('profiles').upsert({
        id: data.user.id,
        email: email,
        name: name,
        role: role,
        plan: plan, 
        status: 'approved',
        joined_at: new Date().toISOString()
      }, { onConflict: 'id' });

      setCurrentUser({
        id: data.user.id,
        name: name,
        email: email,
        role: role as any,
        plan: plan as any,
        status: 'approved',
        joinedAt: new Date().toISOString()
      });
    }

    return { error: null };
  };

  const signOut = async () => {
    setCurrentUser(null);
    setEvents([]);
    setPlans([]);
    setClasses([]);
    setUsers([]);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("Logout offline/erro:", error);
    }
  };

  const addEvent = async (event: Omit<CalendarEvent, 'id'>) => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase.from('events').insert([{
          user_id: currentUser.id,
          title: event.title,
          type: event.type,
          start: event.start,
          end: event.end,
          description: event.description,
          class_name: event.className
      }]).select().single();
      
      if (error) throw new Error(error.message);
      
      if (data) {
          setEvents(prev => [...prev, {
              id: data.id,
              userId: data.user_id,
              title: data.title,
              type: data.type,
              start: data.start,
              end: data.end,
              description: data.description,
              className: data.class_name
          }]);
      }
    } catch (e: any) {
      throw new Error(e.message || "Erro ao salvar evento");
    }
  };

  const addEvents = async (newEvents: Omit<CalendarEvent, 'id'>[]) => {
    if (!currentUser) return;
    const dbEvents = newEvents.map(e => ({
        user_id: currentUser.id,
        title: e.title,
        type: e.type,
        start: e.start,
        end: e.end,
        description: e.description,
        class_name: e.className
    }));
    
    const { data, error } = await supabase.from('events').insert(dbEvents).select();
    
    if (error) throw new Error(error.message);

    if (data) {
        const mappedEvents = data.map(d => ({
            id: d.id,
            userId: d.user_id,
            title: d.title,
            type: d.type,
            start: d.start,
            end: d.end,
            description: d.description,
            className: d.class_name
        }));
        setEvents(prev => [...prev, ...mappedEvents]);
    }
  };

  const updateEvent = async (event: CalendarEvent) => {
    const { error } = await supabase.from('events').update({
        title: event.title,
        type: event.type,
        start: event.start,
        end: event.end,
        description: event.description,
        class_name: event.className
    }).eq('id', event.id);
    if (!error) {
        setEvents(prev => prev.map(e => e.id === event.id ? event : e));
    }
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (!error) {
        setEvents(prev => prev.filter(e => e.id !== id));
    }
  };

  const addPlan = async (plan: BimesterPlan) => {
    if (!currentUser) return;
    const { data, error } = await supabase.from('plans').insert([{
        user_id: currentUser.id,
        class_name: plan.className,
        subject: plan.subject,
        bimester: plan.bimester,
        total_lessons: plan.totalLessons,
        theme: plan.theme,
        bncc_focus: plan.bnccFocus,
        lessons: JSON.stringify(plan.lessons)
    }]).select().single();
    
    if (error) throw new Error(error.message);

    if (data) {
        setPlans(prev => [...prev, { ...plan, id: data.id, userId: currentUser.id, createdAt: data.created_at }]);
    }
  };

  const updatePlan = async (plan: BimesterPlan) => {
    const { error } = await supabase.from('plans').update({
        class_name: plan.className,
        subject: plan.subject,
        bimester: plan.bimester,
        total_lessons: plan.totalLessons,
        theme: plan.theme,
        bncc_focus: plan.bnccFocus,
        lessons: JSON.stringify(plan.lessons)
    }).eq('id', plan.id);
    if (!error) {
        setPlans(prev => prev.map(p => p.id === plan.id ? plan : p));
    }
  };

  const deletePlan = async (id: string) => {
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (!error) {
        setPlans(prev => prev.filter(p => p.id !== id));
    }
  };

  // --- Função AddClass Corrigida ---
  const addClass = async (classRoom: ClassRoom) => {
    if (!currentUser) throw new Error("Você precisa estar logado para criar uma turma.");
    
    try {
        const { data, error } = await supabase.from('classes').insert([{
            user_id: currentUser.id,
            name: classRoom.name,
            grade: classRoom.grade,
            subject: classRoom.subject,
            shift: classRoom.shift,
            students_count: classRoom.studentsCount || 0
        }]).select().single();

        if (error) {
            console.error("Supabase AddClass Error:", error);
            throw new Error(error.message || "Erro desconhecido ao criar turma.");
        }

        if (data) {
            const newClass: ClassRoom = {
                id: data.id,
                userId: data.user_id,
                name: data.name,
                grade: data.grade,
                subject: data.subject,
                shift: data.shift,
                studentsCount: data.students_count,
                linkedPlanIds: [],
                generatedActivities: []
            };
            setClasses(prev => [...prev, newClass]);
        }
    } catch (err: any) {
       throw new Error(err.message || "Erro ao criar turma.");
    }
  };

  const updateClass = async (classRoom: ClassRoom) => {
    const { error } = await supabase.from('classes').update({
        name: classRoom.name,
        grade: classRoom.grade,
        subject: classRoom.subject,
        shift: classRoom.shift,
        students_count: classRoom.studentsCount
    }).eq('id', classRoom.id);
    if (!error) {
        setClasses(prev => prev.map(c => c.id === classRoom.id ? classRoom : c));
    }
  };

  const deleteClass = async (id: string) => {
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (!error) {
        setClasses(prev => prev.filter(c => c.id !== id));
    }
  };

  // --- ADMIN: USERS & SETTINGS ---

  const updateUser = async (user: User) => {
    const { error } = await supabase.from('profiles').update({
        name: user.name,
        role: user.role,
        plan: user.plan,
        status: user.status,
    }).eq('id', user.id);

    if (!error) {
        if (currentUser?.id === user.id) {
            setCurrentUser(user);
        }
        setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    }
  };

  const updateUsersBatch = async (updatedUsers: User[]) => {
      for (const u of updatedUsers) {
          const { error } = await supabase.from('profiles').update({
              plan: u.plan,
              status: u.status,
              role: u.role
          }).eq('id', u.id);
          
          if (error) console.error(`Erro ao atualizar usuario ${u.email}`, error);
      }
      
      setUsers(prev => prev.map(u => {
          const updated = updatedUsers.find(up => up.id === u.id);
          return updated ? updated : u;
      }));
  };

  const deleteUser = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (!error) {
        setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  // --- Função SaveSettings Corrigida ---
  const saveSystemSettings = async (settings: SystemSettings[]) => {
      const { error } = await supabase.from('configuracoes_sistema').upsert(settings);
      
      if (error) {
          console.error("Supabase SaveSettings Error:", error);
          throw new Error(error.message || "Erro desconhecido ao salvar configurações.");
      }
      
      setSystemSettings(settings);
  };

  const addPost = async (content: string, user: User) => {
    const { data, error } = await supabase.from('community').insert([{
        user_id: user.id,
        user_name: user.name,
        content: content,
        likes: 0
    }]).select().single();
    if (data) {
        setPosts(prev => [{
            id: data.id,
            userId: data.user_id,
            userName: data.user_name,
            content: data.content,
            likes: data.likes,
            createdAt: data.created_at,
            isPinned: false
        }, ...prev]);
    }
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from('community').delete().eq('id', id);
    if (!error) {
        setPosts(prev => prev.filter(p => p.id !== id));
    }
  };

  const likePost = async (id: string) => {
    const post = posts.find(p => p.id === id);
    if (post) {
        const newLikes = post.likes + 1;
        await supabase.from('community').update({ likes: newLikes }).eq('id', id);
        setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: newLikes } : p));
    }
  };

  const addActivity = async (activity: GeneratedActivity) => {
    const { data, error } = await supabase.from('activities').insert([{
        class_id: activity.classId,
        type: activity.type,
        title: activity.title,
        content: JSON.stringify(activity.content)
    }]).select().single();
    
    if (error) throw new Error(error.message);

    if (data) {
        const newAct: GeneratedActivity = {
            id: data.id,
            classId: data.class_id,
            type: data.type,
            title: data.title,
            content: typeof data.content === 'string' ? JSON.parse(data.content) : data.content,
            createdAt: data.created_at
        };
        setClasses(prev => prev.map(c => {
            if (c.id === activity.classId) {
                return { ...c, generatedActivities: [...c.generatedActivities, newAct] };
            }
            return c;
        }));
    }
  };

  return (
    <DataContext.Provider value={{
      loading,
      currentUser,
      signIn,
      signUp,
      signOut,
      events,
      addEvent,
      addEvents,
      updateEvent,
      deleteEvent,
      plans,
      addPlan,
      updatePlan,
      deletePlan,
      classes,
      addClass,
      updateClass,
      deleteClass,
      users,
      updateUser,
      updateUsersBatch,
      deleteUser,
      systemSettings,
      saveSystemSettings,
      posts,
      addPost,
      deletePost,
      likePost,
      addActivity,
      refreshData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
