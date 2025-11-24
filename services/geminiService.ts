import { GoogleGenAI, Type, Schema } from "@google/genai";
import { EscapeRoomData, LessonRow, ActivityContent, Slide, Question, PresentationThemeId, PresentationPaletteId } from "../types";

// Inicialização Lazy para evitar erros de runtime se process.env não estiver definido no load da página
let aiInstance: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!aiInstance) {
    // Fallback seguro para evitar crash se process não existir
    const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) 
      ? process.env.API_KEY 
      : ''; 
      
    if (!apiKey) {
      console.warn("API Key não encontrada. As chamadas de IA falharão.");
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