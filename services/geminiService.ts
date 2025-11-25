import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { EscapeRoomData, LessonRow, ActivityContent, Slide, Question, PresentationThemeId, PresentationPaletteId } from "../types";

// Inicialização Lazy e segura para API Key
let aiInstance: GoogleGenAI | null = null;

const getApiKey = (): string => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  return '';
};

const getAI = (): GoogleGenAI => {
  if (!aiInstance) {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn("API Key não encontrada. As chamadas de IA falharão. Configure VITE_API_KEY ou API_KEY.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

// --- SCHEMAS EXISTENTES ---
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
          imagePrompt: { type: Type.STRING, description: "Prompt visual OBRIGATÓRIO e ÚNICO para ilustrar o conteúdo deste slide específico." },
          notes: { type: Type.STRING }
        },
        required: ["title", "bullets", "imagePrompt"]
      }
    },
    footerText: { type: Type.STRING }
  },
  required: ["header", "coverImagePrompt"]
};

// --- FUNÇÕES DE CHAT ---

export const createTeacherAssistantChat = (): Chat => {
  const ai = getAI();
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `
        Você é o "Especialista Pro 7", o assistente virtual da plataforma Pro 7.

        SUAS REGRAS DE COMPORTAMENTO (RÍGIDAS):
        1. SEJA BREVE E OBJETIVO: Suas respostas devem ter no máximo 2 ou 3 frases. Nada de textos longos.
        2. SEJA INVESTIGATIVO: Você deve SEMPRE terminar sua resposta com uma PERGUNTA para entender exatamente o que o usuário quer fazer na ferramenta mencionada.
           - Exemplo: Se perguntarem da Agenda, explique o que é em 1 frase e pergunte: "Você quer adicionar um evento ou ver seus horários?"
        
        3. ESCOPO DE ATUAÇÃO:
           - "Edu Escape" (Jogos de fuga).
           - "Gerador IA" (Provas/Atividades/Slides).
           - "Planos de Aula" (Planejamento bimestral).
           - "Agenda" (Organização).

        4. SUPORTE TÉCNICO:
           Se você não souber a resposta, ou se o usuário relatar erro/bug, responda APENAS:
           "Para essa questão técnica, contate o suporte administrativo: (77) 99913-4858".

        Tom de voz: Profissional, direto e prestativo.
      `
    }
  });
};

// --- FUNÇÕES DE GERAÇÃO EXISTENTES ---

export const generateEscapeRoom = async (topic: string, grade: string, duration: string, difficulty: string): Promise<EscapeRoomData> => {
  const modelId = "gemini-3-pro-preview";
  const prompt = `Crie um Escape Room Educacional sobre ${topic} para ${grade}. Dificuldade: ${difficulty}. Duração: ${duration}. Saída JSON.`;
  
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: escapeRoomSchema }
    });
    return JSON.parse(response.text.replace(/```json|```/g, '').trim()) as EscapeRoomData;
  } catch (error) { throw error; }
};

export const generateSceneImage = async (imagePrompt: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `High quality educational illustration, clean vector style or professional photography, minimalist background, suitable for powerpoint slide. Subject: ${imagePrompt}` }]
      },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return "";
  } catch (error) { return ""; }
};

export const generateBimesterPlan = async (subject: string, grade: string, totalLessons: number, theme: string, bnccFocus: string): Promise<Omit<LessonRow, 'id' | 'number'>[]> => {
  const modelId = "gemini-3-pro-preview";
  const prompt = `Planejamento Bimestral de ${subject} para ${grade}. Tema: ${theme}. BNCC: ${bnccFocus}. ${totalLessons} aulas. JSON.`;
  
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: metrarSchema }
    });
    return JSON.parse(response.text.replace(/```json|```/g, '').trim());
  } catch (error) { throw error; }
};

export const generateEducationalActivity = async (
  type: 'Prova' | 'Atividade Avaliativa' | 'Trabalho' | 'Apresentação' | 'Quiz' | 'Atividade Criativa',
  subject: string,
  grade: string,
  lessonContents: string[],
  config: string,
  themeId?: PresentationThemeId,
  paletteId?: PresentationPaletteId
): Promise<ActivityContent> => {
  const modelId = "gemini-3-pro-preview";
  
  const isPresentation = type === 'Apresentação';
  const structureType = isPresentation ? 'presentation' : 'document';

  const prompt = `
    ATUE COMO UM DESIGNER EDUCACIONAL EXPERIENTE.
    Crie um material PROFISSIONAL do tipo: ${type}.
    Disciplina: ${subject}. Turma: ${grade}.
    Conteúdo base: ${lessonContents.join('; ')}.
    Configuração: ${config}.

    SAÍDA OBRIGATÓRIA: JSON ESTRUTURADO.
    
    PARA APRESENTAÇÕES (PPTX):
    - Crie entre 5 a 7 slides.
    - O Slide 1 deve ser CAPA. O último CONCLUSÃO.
    - CRÍTICO: Máximo de 4-5 bullets (tópicos) por slide. Textos CURTOS e DIRETOS para não cortar no slide.
    - OBRIGATÓRIO: Gere um 'imagePrompt' ÚNICO para CADA slide, descrevendo uma imagem que ilustre o conteúdo específico daquele slide.
    - NUNCA deixe 'imagePrompt' vazio.

    PARA PROVAS/ATIVIDADES:
    - Preencha o array 'questions'.

    IMPORTANTE: Gere 'coverImagePrompt' para criar uma capa visual bonita.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: activitySchema,
        temperature: 0.7
      }
    });

    const cleanText = response.text.replace(/```json|```/g, '').trim();
    const parsedData = JSON.parse(cleanText);

    // Estrutura Base
    const activityContent: ActivityContent = {
      structureType,
      themeId: themeId || 'modern',
      paletteId: paletteId || 'minimalist',
      header: {
        title: parsedData.header.title,
        subtitle: parsedData.header.subtitle,
        school: "Escola Modelo Pro 7",
        teacher: "Professor(a)",
        class: grade,
        discipline: subject,
        date: new Date().toLocaleDateString()
      },
      introText: parsedData.introText,
      questions: parsedData.questions,
      slides: parsedData.slides,
      footerText: parsedData.footerText
    };

    // --- GERAÇÃO PARALELA DE IMAGENS ---
    // Usamos um array de promises para gerar TODAS as imagens necessárias de uma vez
    const imagePromises: Promise<void>[] = [];
    
    // 1. Capa Principal
    if (parsedData.coverImagePrompt) {
        imagePromises.push(
            generateSceneImage(parsedData.coverImagePrompt)
                .then(url => { activityContent.coverImage = url; })
                .catch(e => console.warn("Erro capa:", e))
        );
    }

    // 2. Imagens dos Slides (TODOS os slides devem ter imagem)
    if (isPresentation && parsedData.slides) {
        parsedData.slides.forEach((slide: Slide, index: number) => {
            const prompt = slide.imagePrompt || `Educational illustration about ${slide.title}`;
            imagePromises.push(
                generateSceneImage(prompt)
                    .then(url => { 
                         if(activityContent.slides && activityContent.slides[index]) {
                             activityContent.slides[index].imageUrl = url;
                         }
                    })
                    .catch(e => console.warn(`Erro slide ${index}:`, e))
            );
        });
    }

    // Aguarda todas as imagens serem geradas (ou falharem)
    await Promise.all(imagePromises);

    return activityContent;

  } catch (error) {
    console.error("Erro na geração estruturada:", error);
    throw error;
  }
};