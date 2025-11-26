
import { supabase } from '../lib/supabaseClient';

export interface VideoItem {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  created_at: string;
}

// Extrai o ID do vídeo de diferentes formatos de URL do YouTube
export const extractYouTubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Gera a URL da thumbnail de alta qualidade
export const getYouTubeThumbnail = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

// Busca todos os vídeos (ordenados por mais recentes)
export const fetchVideos = async (): Promise<VideoItem[]> => {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar vídeos:', error);
    throw new Error(error.message);
  }

  return data || [];
};

// Adiciona um novo vídeo (Apenas Admin - validado pelo RLS do banco)
export const addVideo = async (title: string, url: string, userId: string): Promise<VideoItem> => {
  const videoId = extractYouTubeId(url);
  
  if (!videoId) {
    throw new Error('URL do YouTube inválida.');
  }

  const thumbnail = getYouTubeThumbnail(videoId);

  const { data, error } = await supabase
    .from('videos')
    .insert([{
      title,
      url,
      thumbnail,
      created_by: userId
    }])
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar vídeo:', error);
    throw new Error(error.message);
  }

  return data;
};
