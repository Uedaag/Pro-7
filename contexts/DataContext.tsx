
import React, { createContext, useContext, useState, useEffect } from 'react';
import { CalendarEvent, DataContextType, BimesterPlan, ClassRoom, User, Post } from '../types';

// Função auxiliar para criar datas relativas a hoje (para demo)
const createDate = (hour: number, minute: number) => {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

// Estado inicial simulado DINÂMICO
const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    userId: 'teacher-1', // Vinculado ao usuário de exemplo
    title: 'Conselho de Classe (9º Anos)',
    type: 'reuniao',
    start: createDate(13, 30),
    end: createDate(15, 0),
    description: 'Definição de notas e recuperação bimestral.',
    className: 'Sala dos Professores'
  },
  {
    id: '2',
    userId: 'teacher-1',
    title: 'Entrega de Diários',
    type: 'atividade',
    start: createDate(18, 0),
    end: createDate(19, 0),
    description: 'Prazo final para submissão no sistema.',
  },
  {
    id: '3',
    userId: 'teacher-1',
    title: 'História: Era Vargas',
    type: 'aula',
    start: createDate(7, 30),
    end: createDate(8, 20),
    className: '9º Ano A',
    classId: 'class-1',
    description: 'Introdução ao Estado Novo e análise da CLT.',
  }
];

// Turmas Iniciais Mockadas
const INITIAL_CLASSES: ClassRoom[] = [
  {
    id: 'class-1',
    userId: 'teacher-1', // Vinculado ao usuário de exemplo
    name: '9º Ano A',
    grade: '9º Ano',
    subject: 'História',
    shift: 'Matutino',
    studentsCount: 32,
    linkedPlanIds: [],
    generatedActivities: []
  },
  {
    id: 'class-2',
    userId: 'teacher-1',
    name: '8º Ano B',
    grade: '8º Ano',
    subject: 'Geografia',
    shift: 'Vespertino',
    studentsCount: 28,
    linkedPlanIds: [],
    generatedActivities: []
  }
];

// Usuários Mockados (Para testar Admin)
const INITIAL_USERS: User[] = [
  {
    id: 'admin-1',
    name: 'Diretor Pro 7',
    email: 'admin@pro7.com',
    role: 'admin',
    plan: 'premium',
    status: 'approved',
    joinedAt: '2023-01-01T10:00:00Z',
    school: 'Sede'
  },
  {
    id: 'teacher-1',
    name: 'Prof. Marcos Premium',
    email: 'marcos@escola.com',
    role: 'teacher',
    plan: 'premium',
    status: 'approved',
    joinedAt: '2024-02-15T14:30:00Z',
    school: 'Colégio Estadual'
  },
  {
    id: 'teacher-2',
    name: 'Prof. Ana Free',
    email: 'ana@escola.com',
    role: 'teacher',
    plan: 'free',
    status: 'approved',
    joinedAt: '2024-03-10T09:00:00Z',
    school: 'Escola Municipal'
  },
  {
    id: 'teacher-3',
    name: 'Prof. Carlos Pendente',
    email: 'carlos@novo.com',
    role: 'teacher',
    plan: 'free',
    status: 'pending',
    joinedAt: '2024-05-20T11:00:00Z',
    school: 'Particular'
  }
];

const INITIAL_POSTS: Post[] = [
  {
    id: 'post-1',
    userId: 'teacher-1',
    userName: 'Prof. Marcos Premium',
    content: 'Alguém já testou o gerador de Escape Room com o tema de Egito Antigo? Os alunos adoraram!',
    likes: 12,
    createdAt: new Date().toISOString()
  }
];

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- EVENTS STATE ---
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('pro7_events');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  useEffect(() => {
    localStorage.setItem('pro7_events', JSON.stringify(events));
  }, [events]);

  const addEvent = (newEventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...newEventData,
      id: crypto.randomUUID(),
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const updateEvent = (updatedEvent: CalendarEvent) => {
    setEvents(prev => prev.map(evt => evt.id === updatedEvent.id ? updatedEvent : evt));
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(evt => evt.id !== id));
  };

  // --- PLANS STATE (METRAR) ---
  const [plans, setPlans] = useState<BimesterPlan[]>(() => {
    const savedPlans = localStorage.getItem('pro7_metrar_plans');
    return savedPlans ? JSON.parse(savedPlans) : [];
  });

  useEffect(() => {
    localStorage.setItem('pro7_metrar_plans', JSON.stringify(plans));
  }, [plans]);

  const addPlan = (plan: BimesterPlan) => {
    setPlans(prev => [plan, ...prev]);
  };

  const updatePlan = (updatedPlan: BimesterPlan) => {
    setPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
  };

  const deletePlan = (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  // --- CLASSES STATE (TURMAS) ---
  const [classes, setClasses] = useState<ClassRoom[]>(() => {
    const savedClasses = localStorage.getItem('pro7_classes');
    return savedClasses ? JSON.parse(savedClasses) : INITIAL_CLASSES;
  });

  useEffect(() => {
    localStorage.setItem('pro7_classes', JSON.stringify(classes));
  }, [classes]);

  const addClass = (classRoom: ClassRoom) => {
    setClasses(prev => [...prev, classRoom]);
  };

  const updateClass = (updatedClass: ClassRoom) => {
    setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c));
  };

  const deleteClass = (id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
  };

  // --- USERS STATE (ADMIN) ---
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('pro7_users');
    return savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS;
  });

  useEffect(() => {
    localStorage.setItem('pro7_users', JSON.stringify(users));
  }, [users]);

  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const updateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // --- COMMUNITY STATE ---
  const [posts, setPosts] = useState<Post[]>(() => {
    const savedPosts = localStorage.getItem('pro7_posts');
    return savedPosts ? JSON.parse(savedPosts) : INITIAL_POSTS;
  });

  useEffect(() => {
    localStorage.setItem('pro7_posts', JSON.stringify(posts));
  }, [posts]);

  const addPost = (content: string, user: User) => {
    const newPost: Post = {
      id: crypto.randomUUID(),
      userId: user.id,
      userName: user.name,
      content,
      likes: 0,
      createdAt: new Date().toISOString()
    };
    setPosts(prev => [newPost, ...prev]);
  };

  const deletePost = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const likePost = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
  };


  return (
    <DataContext.Provider value={{ 
      events, addEvent, updateEvent, deleteEvent,
      plans, addPlan, updatePlan, deletePlan,
      classes, addClass, updateClass, deleteClass,
      users, addUser, updateUser, deleteUser,
      posts, addPost, deletePost, likePost
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
};
