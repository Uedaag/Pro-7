
import { supabase } from '../lib/supabaseClient';

export interface VideoItem {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  category: string;
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

// Busca todos os vídeos
export const fetchVideos = async (): Promise<VideoItem[]> => {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    // Tratamento para caso a tabela ainda não exista
    if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.warn('Tabela videos não encontrada.');
        return [];
    }
    throw new Error(error.message);
  }

  return data || [];
};

// Adiciona um novo vídeo
export const addVideo = async (title: string, url: string, category: string, userId: string): Promise<VideoItem> => {
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error('URL do YouTube inválida.');

  const thumbnail = getYouTubeThumbnail(videoId);

  const { data, error } = await supabase
    .from('videos')
    .insert([{ title, url, thumbnail, category, created_by: userId }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// Atualiza um vídeo existente
export const updateVideo = async (id: string, title: string, url: string, category: string): Promise<void> => {
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error('URL do YouTube inválida.');

  const thumbnail = getYouTubeThumbnail(videoId);

  const { error } = await supabase
    .from('videos')
    .update({ title, url, thumbnail, category })
    .eq('id', id);

  if (error) throw new Error(error.message);
};

// Remove um vídeo
export const deleteVideo = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
};
