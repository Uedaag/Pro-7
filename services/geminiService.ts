import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { EscapeRoomData, LessonRow, ActivityContent, Slide, Question, PresentationThemeId, PresentationPaletteId } from "../types";

// Inicialização Lazy e segura para API Key
let aiInstance: GoogleGenAI | null = null;

const getApiKey = (): string => {
  // 1. LocalStorage (Permite override manual no navegador para testes rápidos)
  if (typeof window !== 'undefined') {
    const localKey = window.localStorage.getItem('VITE_GOOGLE_API_KEY');
    if (localKey) return localKey;
  }

  // 2. Prioridade: Variáveis VITE
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    if (import.meta.env.VITE_GOOGLE_API_KEY) return import.meta.env.VITE_GOOGLE_API_KEY;
  }

  // 3. Fallback: Process Env (Next.js / CRA)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_GOOGLE_API_KEY) return process.env.VITE_GOOGLE_API_KEY;
    if (process.env.NEXT_PUBLIC_GOOGLE_API_KEY) return process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  }
  
  return "";
};

const getAI = (): GoogleGenAI => {
  // Sempre tenta pegar a chave mais atual (caso o user sete no localStorage)
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("Chave de API não encontrada. Configure VITE_GOOGLE_API_KEY no Vercel ou use localStorage.");
  }
  
  // Recria a instância se a chave mudou ou não existe
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

// --- SCHEMAS ---
const escapeRoomSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    theme: { type: Type.STRING },
    grade: { type: Type.STRING },
    intro: { type: Type.STRING },
    phases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          challenge: { type: Type.STRING },
          question: { type: Type.STRING },
          hints: { type: Type.ARRAY, items: { type: Type.STRING } },
          answer: { type: Type.STRING },
          imagePrompt: { type: Type.STRING }
        },
        required: ["title", "challenge", "question", "hints", "answer", "imagePrompt"]
      }
    },
    outro: { type: Type.STRING }
  },
  required: ["theme", "grade", "intro", "phases", "outro"]
};

const metrarSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      objectives: { type: Type.STRING },
      content: { type: Type.STRING },
      methodology: { type: Type.STRING },
      resources: { type: Type.STRING },
      evaluation: { type: Type.STRING },
      bnccSkill: { type: Type.STRING }
    },
    required: ["title", "objectives", "content", "methodology", "resources", "evaluation", "bnccSkill"]
  }
};

const activitySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    header: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        subtitle: { type: Type.STRING }
      },
      required: ["title"]
    },
    coverImagePrompt: { type: Type.STRING },
    introText: { type: Type.STRING },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          number: { type: Type.INTEGER },
          type: { type: Type.STRING, enum: ["objective", "discursive"] },
          statement: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          lines: { type: Type.INTEGER },
          correctAnswer: { type: Type.STRING }
        },
        required: ["number", "type", "statement"]
      }
    },
    slides: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
          imagePrompt: { type: Type.STRING },
          notes: { type: Type.STRING }
        },
        required: ["title", "bullets", "imagePrompt"]
      }
    },
    footerText: { type: Type.STRING }
  },
  required: ["header", "coverImagePrompt"]
};

// --- CHAT ---
export const createTeacherAssistantChat = (): Chat => {
  const ai = getAI();
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `Você é o Especialista Pro 7. Ajude professores de forma breve e objetiva.`
    }
  });
};

// --- GENERATORS ---
export const generateEscapeRoom = async (topic: string, grade: string, duration: string, difficulty: string): Promise<EscapeRoomData> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash", // Usando flash para maior rapidez e menor custo/chance de bloqueio
    contents: `Crie um Escape Room Educacional sobre ${topic} para ${grade}. Dificuldade: ${difficulty}. Duração: ${duration}. SAÍDA OBRIGATÓRIA EM JSON.`,
    config: { responseMimeType: "application/json", responseSchema: escapeRoomSchema }
  });
  return JSON.parse(response.text.replace(/```json|```/g, '').trim());
};

export const generateSceneImage = async (imagePrompt: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Educational illustration, clean vector style: ${imagePrompt}` }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return "";
  } catch (error) { return ""; }
};

export const generateBimesterPlan = async (subject: string, grade: string, totalLessons: number, theme: string, bnccFocus: string): Promise<Omit<LessonRow, 'id' | 'number'>[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Planejamento ${subject}, ${grade}, ${totalLessons} aulas. Tema: ${theme}. BNCC: ${bnccFocus}. JSON.`,
    config: { responseMimeType: "application/json", responseSchema: metrarSchema }
  });
  return JSON.parse(response.text.replace(/```json|```/g, '').trim());
};

export const generateEducationalActivity = async (
  type: string, subject: string, grade: string, lessonContents: string[], config: string
): Promise<ActivityContent> => {
  const ai = getAI();
  const isPresentation = type === 'Apresentação';
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Crie ${type} de ${subject} para ${grade}. Conteúdo: ${lessonContents}. Config: ${config}. JSON.`,
    config: { responseMimeType: "application/json", responseSchema: activitySchema }
  });
  const parsedData = JSON.parse(response.text.replace(/```json|```/g, '').trim());
  
  const content: ActivityContent = {
    structureType: isPresentation ? 'presentation' : 'document',
    header: {
      title: parsedData.header.title,
      subtitle: parsedData.header.subtitle,
      school: "Escola Pro 7",
      teacher: "Professor",
      class: grade,
      discipline: subject,
      date: new Date().toLocaleDateString()
    },
    introText: parsedData.introText,
    questions: parsedData.questions,
    slides: parsedData.slides,
    footerText: parsedData.footerText
  };

  if (parsedData.coverImagePrompt) {
      content.coverImage = await generateSceneImage(parsedData.coverImagePrompt);
  }

  return content;
};