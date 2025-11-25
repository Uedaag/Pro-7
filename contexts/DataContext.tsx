
import React, { createContext, useContext, useState, useEffect } from 'react';
import { CalendarEvent, DataContextType, BimesterPlan, ClassRoom, User, Post, GeneratedActivity } from '../types';
import { supabase } from '../lib/supabaseClient';

interface ExtendedDataContextType extends DataContextType {
  addActivity: (activity: GeneratedActivity) => Promise<void>;
}

const DataContext = createContext<ExtendedDataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [plans, setPlans] = useState<BimesterPlan[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [users, setUsers] = useState<User[]>([]); // Para admin
  const [posts, setPosts] = useState<Post[]>([]);

  // --- AUTH LISTENER & DATA FETCHING ---
  useEffect(() => {
    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
        await fetchAllData(session.user.id);
      } else {
        setLoading(false);
      }
    };

    initData();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (session.user.id !== currentUser?.id) {
           await fetchUserProfile(session.user.id);
           await fetchAllData(session.user.id);
        }
      } else {
        setCurrentUser(null);
        setEvents([]);
        setPlans([]);
        setClasses([]);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Tenta buscar o perfil. Pode não existir imediatamente se o trigger tiver lag.
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
      console.error("Erro ao buscar perfil:", error);
    }
  };

  const fetchAllData = async (userId: string) => {
    setLoading(true);
    try {
      // 1. Events
      const { data: eventsData } = await supabase.from('events').select('*').eq('user_id', userId);
      if (eventsData) {
        setEvents(eventsData.map(e => ({
          id: e.id,
          userId: e.user_id,
          title: e.title,
          type: e.type,
          start: e.start, // O Supabase retorna string ISO
          end: e.end,
          description: e.description,
          classId: e.class_id,
          className: e.class_name
        })));
      }

      // 2. Plans
      const { data: plansData } = await supabase.from('plans').select('*').eq('user_id', userId);
      if (plansData) {
         setPlans(plansData.map(p => ({
            id: p.id,
            userId: p.user_id,
            className: p.class_name,
            subject: p.subject,
            bimester: p.bimester,
            totalLessons: p.total_lessons,
            theme: p.theme,
            bncc_focus: p.bncc_focus,
            lessons: typeof p.lessons === 'string' ? JSON.parse(p.lessons) : p.lessons,
            createdAt: p.created_at
         })));
      }

      // 3. Classes (Join with Activities)
      const { data: classesData } = await supabase
        .from('classes')
        .select(`*, activities(*)`)
        .eq('user_id', userId);
      
      if (classesData) {
        setClasses(classesData.map(c => ({
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

      // 4. Community Posts (Public)
      const { data: postsData } = await supabase.from('community').select('*').order('created_at', { ascending: false });
      if (postsData) {
        setPosts(postsData.map(p => ({
           id: p.id,
           userId: p.user_id,
           userName: p.user_name,
           content: p.content,
           likes: p.likes,
           createdAt: p.created_at,
           isPinned: p.is_pinned
        })));
      }

      // 5. Admin check to fetch all users
      // Check current user role from the fetched profile data directly
      // Precisamos verificar o role do usuário ATUAL, não o estado anterior
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
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- AUTH ACTIONS ---

  const signIn = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass
    });

    if (!error && data.user) {
      // Se o perfil NÃO existir, cria aqui automaticamente
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: email,
        name: data.user.user_metadata?.name || "",
        role: email.includes("admin") ? "admin" : "teacher",
        status: "approved",
        plan: "free",
        joined_at: new Date().toISOString()
      }, { onConflict: 'id' });
    }

    return { error };
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

    if (!error && data.user) {
      // Regra automática para Admin: se o email conter 'admin', vira admin
      // Isso é redundante com o Trigger do SQL, mas garante atualização imediata da UI
      const role = email.toLowerCase().includes('admin') ? 'admin' : 'teacher';
      
      // UPSERT no perfil: garante que os dados estejam lá, seja via trigger ou client-side
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        email: email,
        name: name,
        role: role, // Força o role aqui também para o frontend
        plan: 'free',
        status: 'approved',
        joined_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (profileError) {
         console.warn("Nota: Criação de perfil via cliente falhou (provavelmente já criado pelo Trigger):", profileError.message);
      }
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // --- EVENTS ---

  const addEvent = async (event: Omit<CalendarEvent, 'id'>) => {
    if (!currentUser) return;
    const { data, error } = await supabase.from('events').insert([{
        user_id: currentUser.id,
        title: event.title,
        type: event.type,
        start: event.start,
        end: event.end,
        description: event.description,
        class_name: event.className
    }]).select().single();

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

  // --- PLANS ---

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

  // --- CLASSES ---

  const addClass = async (classRoom: ClassRoom) => {
    if (!currentUser) return;
    const { data, error } = await supabase.from('classes').insert([{
        user_id: currentUser.id,
        name: classRoom.name,
        grade: classRoom.grade,
        subject: classRoom.subject,
        shift: classRoom.shift,
        students_count: classRoom.studentsCount
    }]).select().single();

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

  // --- USERS & ADMIN ---

  const updateUser = async (user: User) => {
    const { error } = await supabase.from('profiles').update({
        name: user.name,
        role: user.role,
        plan: user.plan,
        status: user.status,
        theme_preference: user.themePreference,
        avatar_url: user.avatarUrl,
        phone: user.phone,
        bio: user.bio,
        education: user.education,
        expertise: user.expertise
    }).eq('id', user.id);

    if (!error) {
        if (currentUser?.id === user.id) {
            setCurrentUser(user);
        }
        setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    }
  };

  const deleteUser = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (!error) {
        setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  // --- COMMUNITY ---

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

  // --- ACTIVITY GENERATOR ---

  const addActivity = async (activity: GeneratedActivity) => {
    const { data, error } = await supabase.from('activities').insert([{
        class_id: activity.classId,
        type: activity.type,
        title: activity.title,
        content: JSON.stringify(activity.content)
    }]).select().single();

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
      deleteUser,
      posts,
      addPost,
      deletePost,
      likePost,
      addActivity
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
