
import { ActivityContent, PresentationThemeId, PresentationPaletteId } from '../types';

declare global {
  interface Window {
    PptxGenJS: any;
  }
}

// --- DEFINIÇÃO DE PALETAS DE CORES ---
const PALETTES: Record<PresentationPaletteId, any> = {
  minimalist: {
    bg: 'FFFFFF',
    text: '1E293B',
    primary: '0F766E', // Teal
    secondary: '94A3B8', // Slate 400
    accent: '2DD4BF', // Teal 400
    bullet: '0F766E'
  },
  classic: {
    bg: 'FAF9F6', // Off-white
    text: '1B2845', // Navy
    primary: '1B2845',
    secondary: 'C9A227', // Gold
    accent: '6B4226', // Brown
    bullet: 'C9A227'
  },
  vibrant: {
    bg: '111827', // Dark Gray
    text: 'F3F4F6', // Gray 100
    primary: '22D3EE', // Cyan Neon
    secondary: 'EC4899', // Pink Neon
    accent: '7C3AED', // Purple
    bullet: 'EC4899'
  },
  school: {
    bg: 'FFFFFF',
    text: '1F2937',
    primary: '2563EB', // Blue 600
    secondary: 'FBBF24', // Amber 400
    accent: 'EF4444', // Red 500
    bullet: '10B981' // Green
  },
  contemporary: {
    bg: '2B2D42', // Graphite
    text: 'EDF2F4', // Anti-flash white
    primary: '00A6FB', // Cyan Process
    secondary: '8D99AE', // Cool Grey
    accent: 'EF233C', // Red Crayola
    bullet: '00A6FB'
  }
};

// --- CONFIGURAÇÃO DE FONTES POR TEMA ---
const THEME_FONTS: Record<PresentationThemeId, string> = {
  modern: 'Arial',
  classic: 'Times New Roman',
  creative: 'Verdana'
};

// Helper: Calcula tamanho da fonte baseado na quantidade de texto (Auto-Fit)
const calculateFontSize = (textLength: number): number => {
  if (textLength > 600) return 12;
  if (textLength > 400) return 14;
  if (textLength > 250) return 18;
  return 24;
};

export const generatePPTX = (content: ActivityContent): void => {
  if (!window.PptxGenJS) {
    alert("Erro: Biblioteca PptxGenJS não carregada.");
    return;
  }

  const pptx = new window.PptxGenJS();
  
  // Configurações Base
  const themeId = content.themeId || 'modern';
  const paletteId = content.paletteId || 'minimalist';
  
  const palette = PALETTES[paletteId];
  const fontFace = THEME_FONTS[themeId];

  pptx.layout = 'LAYOUT_16x9';
  pptx.author = content.header.teacher;
  pptx.title = content.header.title;

  // Define Slide Master básico com background da paleta
  pptx.defineSlideMaster({
    title: 'MASTER_SLIDE',
    background: { color: palette.bg },
    objects: []
  });

  // --- SLIDE 1: CAPA ---
  const slideCapa = pptx.addSlide({ masterName: 'MASTER_SLIDE' });

  if (themeId === 'modern') {
    // Layout Moderno: Faixa lateral
    slideCapa.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '25%', h: '100%', fill: { color: palette.primary } });
    slideCapa.addText(content.header.title, { x: '30%', y: '35%', w: '65%', fontSize: 44, color: palette.text, bold: true, fontFace });
    slideCapa.addText(content.header.subtitle || '', { x: '30%', y: '50%', w: '65%', fontSize: 24, color: palette.secondary, fontFace });
    if (content.coverImage) slideCapa.addImage({ data: content.coverImage, x: '30%', y: '60%', w: 4, h: 2.25 });
  
  } else if (themeId === 'classic') {
    // Layout Clássico: Moldura
    slideCapa.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.5, w: '90%', h: '85%', line: { color: palette.secondary, width: 3 } });
    slideCapa.addText(content.header.title, { x: 0, y: '30%', w: '100%', align: 'center', fontSize: 48, color: palette.primary, bold: true, fontFace });
    slideCapa.addText(content.header.subtitle || '', { x: 0, y: '45%', w: '100%', align: 'center', fontSize: 24, color: palette.text, italic: true, fontFace });
    if (content.coverImage) slideCapa.addImage({ data: content.coverImage, x: '35%', y: '55%', w: 3, h: 2 });

  } else {
    // Layout Criativo: Formas
    slideCapa.addShape(pptx.ShapeType.ellipse, { x: -1, y: -1, w: 4, h: 4, fill: { color: palette.accent } });
    slideCapa.addText(content.header.title, { x: 1, y: 2, w: 8, fontSize: 50, color: palette.primary, bold: true, fontFace });
    slideCapa.addText(content.header.subtitle || '', { x: 1, y: 3.5, w: 8, fontSize: 28, color: palette.text, fontFace });
    if (content.coverImage) slideCapa.addImage({ data: content.coverImage, x: 6, y: 1.5, w: 3.5, h: 3.5, sizing: { type: 'cover', w: 3.5, h: 3.5 }, round: true });
  }

  // --- SLIDES DE CONTEÚDO ---
  if (content.slides) {
      content.slides.forEach((slideData) => {
          const slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
          
          // Header do Slide
          if (themeId === 'modern') {
              slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.0, fill: { color: palette.primary } });
              slide.addText(slideData.title, { x: 0.5, y: 0.1, w: '90%', fontSize: 32, color: 'FFFFFF', bold: true, fontFace });
          } else if (themeId === 'classic') {
              slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 1.1, w: '90%', h: 0, line: { color: palette.secondary, width: 2 } });
              slide.addText(slideData.title, { x: 0.5, y: 0.3, w: '90%', fontSize: 36, color: palette.primary, bold: true, fontFace });
          } else {
              slide.addText(slideData.title, { x: 0.5, y: 0.4, w: '90%', fontSize: 36, color: palette.accent, bold: true, fontFace });
          }

          // Conteúdo com Lógica Anti-Corte
          const totalTextLength = slideData.bullets.join(' ').length;
          const fontSize = calculateFontSize(totalTextLength);
          const spacing = fontSize > 18 ? 15 : 8;

          if (slideData.bullets && slideData.bullets.length > 0) {
              const items = slideData.bullets.map(b => ({
                  text: b,
                  options: { fontSize: fontSize, color: palette.text, breakLine: true, bullet: { type: 'number', color: palette.bullet }, paraSpaceAfter: spacing, fontFace }
              }));
              
              // Layout com Imagem à direita
              if (slideData.imageUrl) {
                 slide.addText(items as any, { x: 0.5, y: 1.4, w: '50%', h: '75%', valign: 'top' });
                 slide.addImage({ data: slideData.imageUrl, x: '58%', y: 1.4, w: 3.8, h: 3.8, sizing: { type: 'contain', w: 3.8, h: 3.8 } });
              } else {
                 // Sem imagem, texto ocupa tudo
                 slide.addText(items as any, { x: 0.5, y: 1.4, w: '90%', h: '75%', valign: 'top' });
              }
          } else if (slideData.imageUrl) {
             // Só imagem
             slide.addImage({ data: slideData.imageUrl, x: '25%', y: 1.5, w: 5, h: 4, sizing: { type: 'contain', w: 5, h: 4 } });
          }
      });
  }

  // --- SLIDE FINAL ---
  const slideFim = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  slideFim.background = { color: palette.primary }; 
  slideFim.addText("Obrigado!", { x: 0, y: '40%', w: '100%', align: 'center', fontSize: 50, color: 'FFFFFF', bold: true, fontFace });

  const fileName = `Pro7_${content.header.title.replace(/[^a-z0-9]/gi, '_')}.pptx`;
  pptx.writeFile({ fileName });
};
