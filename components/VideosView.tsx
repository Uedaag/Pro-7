
import React, { useState, useEffect } from 'react';
import { Video, Plus, Play, X, Loader2, Film, AlertCircle, Save } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { fetchVideos, addVideo, extractYouTubeId, VideoItem } from '../services/videoService';

export const VideosView: React.FC = () => {
  const { currentUser } = useData();
  const isAdmin = currentUser?.role === 'admin';

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  // Form States
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    setIsLoading(true);
    try {
      const data = await fetchVideos();
      setVideos(data);
    } catch (error) {
      console.error("Falha ao carregar galeria", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      await addVideo(newTitle, newUrl, currentUser.id);
      await loadGallery(); // Recarrega a lista
      setIsModalOpen(false);
      setNewTitle('');
      setNewUrl('');
    } catch (error: any) {
      setFormError(error.message || "Erro ao adicionar vídeo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPlayModal = (video: VideoItem) => {
    setSelectedVideo(video);
    setIsPlayModalOpen(true);
  };

  const closePlayModal = () => {
    setSelectedVideo(null);
    setIsPlayModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Video className="text-red-600" size={32} /> 
            Biblioteca de Vídeos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Material audiovisual selecionado para enriquecer suas aulas.
          </p>
        </div>

        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-600/20 flex items-center gap-2 transition-transform hover:-translate-y-0.5"
          >
            <Plus size={20} /> Adicionar Vídeo
          </button>
        )}
      </div>

      {/* Galeria */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-slate-400" size={40} />
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#0f172a] rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
            <Film size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">Galeria Vazia</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {isAdmin ? "Adicione o primeiro vídeo da plataforma." : "Nenhum vídeo disponível no momento."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map((video) => (
            <div 
              key={video.id} 
              className="bg-white dark:bg-[#0f172a] rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-white/5 hover:shadow-xl hover:border-red-200 dark:hover:border-red-900/30 transition-all group cursor-pointer"
              onClick={() => openPlayModal(video)}
            >
              <div className="relative aspect-video bg-black group-hover:opacity-90 transition-opacity">
                <img 
                  src={video.thumbnail} 
                  alt={video.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition-transform">
                    <Play fill="white" className="text-white ml-1" size={32} />
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg line-clamp-2 leading-snug mb-2">
                  {video.title}
                </h3>
                <button 
                  className="text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider hover:underline mt-2 flex items-center gap-1"
                >
                  Assistir Agora
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Adicionar Vídeo (Admin Only) */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-[#020410]">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Plus size={20} className="text-red-600"/> Novo Vídeo
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500">
                <X size={20}/>
              </button>
            </div>
            
            <form onSubmit={handleAddVideo} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} /> {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Título do Vídeo</label>
                <input 
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-white"
                  placeholder="Ex: Aula sobre Cores"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Link do YouTube</label>
                <input 
                  type="text"
                  required
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-white"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-[10px] text-slate-400 mt-1">Aceita links curtos (youtu.be) e padrão.</p>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {isSubmitting ? 'Salvando...' : 'Salvar Vídeo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Player */}
      {isPlayModalOpen && selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-5xl animate-scale-in relative">
            <button 
              onClick={closePlayModal}
              className="absolute -top-12 right-0 text-white/70 hover:text-white flex items-center gap-2 font-bold transition-colors"
            >
              Fechar <X size={24} />
            </button>
            
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${extractYouTubeId(selectedVideo.url)}?autoplay=1`} 
                title={selectedVideo.title}
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="mt-4">
              <h2 className="text-2xl font-bold text-white">{selectedVideo.title}</h2>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
