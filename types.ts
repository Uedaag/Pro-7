
export interface Phase {
  title: string;
  challenge: string;
  question: string;
  hints: string[];
  answer: string;
  imagePrompt: string;
}

export interface EscapeRoomData {
  theme: string;
  grade: string;
  intro: string;
  phases: Phase[];
  outro: string;
}

export interface GenerationRequest {
  topic: string;
  grade: string;
  duration: string;
  difficulty: string;
}

// --- ACESSO E PERMISSÕES ---
export type UserRole = 'admin' | 'teacher';
export type UserPlan = 'free' | 'premium';
export type UserStatus = 'pending' | 'approved' | 'blocked';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
  status: UserStatus;
  joinedAt: string;
  school?: string;
}

export type View = 'dashboard' | 'games' | 'profile' | 'agenda' | 'classes' | 'lesson-plans' | 'videos' | 'activity-generator' | 'admin' | 'community';

export type EventType = 'aula' | 'prova' | 'reuniao' | 'projeto' | 'atividade' | 'outro';

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  start: string;
  end: string;
  description?: string;
  classId?: string;
  className?: string;
  lessonPlanId?: string;
  materials?: string;
  criteria?: string;
  evaluationType?: string;
  generatedContent?: ActivityContent;
}

export interface LessonRow {
  id: string;
  number: number;
  title: string;
  objectives: string;
  content: string;
  methodology: string;
  resources: string;
  evaluation: string;
  bnccSkill: string;
  date?: string;
  isSynced?: boolean;
}

export interface BimesterPlan {
  id: string;
  userId: string;
  className: string;
  subject: string;
  bimester: string;
  totalLessons: number;
  theme: string;
  bnccFocus: string;
  lessons: LessonRow[];
  createdAt: string;
}

// --- NOVOS TIPOS ESTRUTURADOS PARA O GERADOR IA ---

export type ActivityType = 'Prova' | 'Atividade Avaliativa' | 'Trabalho' | 'Apresentação' | 'Atividade Criativa' | 'Quiz';

export type PresentationThemeId = 'modern' | 'classic' | 'creative';
export type PresentationPaletteId = 'minimalist' | 'classic' | 'vibrant' | 'school' | 'contemporary';

export interface Question {
  id: string;
  number: number;
  type: 'objective' | 'discursive';
  statement: string;
  options?: string[];
  lines?: number;
  correctAnswer?: string;
}

export interface Slide {
  id: string;
  title: string;
  bullets: string[];
  imagePrompt?: string;
  imageUrl?: string;
  notes?: string;
  layout?: 'title' | 'content_right' | 'content_left' | 'image_center';
}

export interface ActivityContent {
  structureType: 'document' | 'presentation';
  themeId?: PresentationThemeId;
  paletteId?: PresentationPaletteId;
  header: {
    title: string;
    subtitle?: string;
    school: string;
    teacher: string;
    class: string;
    date: string;
    discipline: string;
  };
  coverImage?: string;
  introText?: string;
  questions?: Question[];
  footerText?: string;
  slides?: Slide[];
}

export interface GeneratedActivity {
  id: string;
  type: ActivityType;
  title: string;
  content: ActivityContent;
  createdAt: string;
  relatedLessonIds?: string[];
}

export interface ClassRoom {
  id: string;
  name: string;
  grade: string;
  subject: string;
  shift: string;
  studentsCount: number;
  linkedPlanIds: string[];
  generatedActivities: GeneratedActivity[];
}

// --- COMUNIDADE ---
export interface Post {
  id: string;
  userId: string;
  userName: string;
  content: string;
  likes: number;
  createdAt: string;
  isPinned?: boolean;
}

export interface DataContextType {
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (event: CalendarEvent) => void;
  deleteEvent: (id: string) => void;
  
  plans: BimesterPlan[];
  addPlan: (plan: BimesterPlan) => void;
  updatePlan: (plan: BimesterPlan) => void;
  deletePlan: (id: string) => void;

  classes: ClassRoom[];
  addClass: (classRoom: ClassRoom) => void;
  updateClass: (classRoom: ClassRoom) => void;
  deleteClass: (id: string) => void;

  // Admin & Users
  users: User[];
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;

  // Community
  posts: Post[];
  addPost: (content: string, user: User) => void;
  deletePost: (id: string) => void;
  likePost: (id: string) => void;
}
