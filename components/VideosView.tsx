import React, { useState, useEffect } from 'react';
import { Video, Plus, Play, X, Loader2, Film, AlertCircle, Save, Search, Edit3, Trash2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useNotification } from '../contexts/NotificationContext';
import { fetchVideos, addVideo, updateVideo, deleteVideo, extractYouTubeId, VideoItem } from '../services/videoService';

const CATEGORIES = [
  'História', 
  'Geografia', 
  'Matemática', 
  'Português', 
  'Ciências', 
  'Artes', 
  'Inglês', 
  'Educação Física',
  'Geral'
];

export const VideosView: React.FC = () => {
  const { currentUser } = useData();
  const { notify } = useNotification();
  const isAdmin = currentUser?.role === 'admin';

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
  
  const [selectedVideoToPlay, setSelectedVideoToPlay] = useState<VideoItem | null>(null);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formCategory, setFormCategory] = useState('Geral');
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

  const openCreateModal = () => {
    setEditingVideo(null);
    setFormTitle('');
    setFormUrl('');
    setFormCategory('Geral');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (video: VideoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVideo(video);
    setFormTitle(video.title);
    setFormUrl(video.url);
    setFormCategory(video.category || 'Geral');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Tem certeza que deseja excluir este vídeo?")) return;

    try {
      await deleteVideo(id);
      setVideos(prev => prev.filter(v => v.id !== id));
      notify("Vídeo excluído com sucesso.", "success");
    } catch (error: any) {
      notify("Erro ao excluir: " + error.message, "error");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingVideo) {
        await updateVideo(editingVideo.id, formTitle, formUrl, formCategory);
        notify("Vídeo atualizado com sucesso!", "success");
      } else {
        await addVideo(formTitle, formUrl, formCategory, currentUser.id);
        notify("Vídeo adicionado com sucesso!", "success");
      }
      
      await loadGallery();
      setIsFormOpen(false);
    } catch (error: any) {
      setFormError(error.message || "Erro ao salvar vídeo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPlayer = (video: VideoItem) => {
    setSelectedVideoToPlay(video);
    setIsPlayModalOpen(true);
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  // ... rest of component (render)
  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Video className="text-blue-600" size={32} /> Biblioteca de Vídeos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Material audiovisual selecionado para enriquecer suas aulas.</p>
        </div>
        {isAdmin && (
          <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-transform hover:-translate-y-0.5">
            <Plus size={20} /> Adicionar Vídeo
          </button>
        )}
      </div>

      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
          <input type="text" placeholder="Pesquisar vídeos por título..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white shadow-sm" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedCategory('Todos')} className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${selectedCategory === 'Todos' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-blue-400'}`}>Todos</button>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${selectedCategory === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-blue-400'}`}>{cat}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400" size={40} /></div>
      ) : filteredVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#0f172a] rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center"><div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4"><Film size={40} /></div><h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">Nenhum vídeo encontrado</h3><p className="text-slate-500 dark:text-slate-400 mt-2">Tente buscar por outro termo ou categoria.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredVideos.map((video) => (
            <div key={video.id} className="bg-white dark:bg-[#0f172a] rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-white/5 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-900/30 transition-all group cursor-pointer flex flex-col relative" onClick={() => openPlayer(video)}>
              {isAdmin && (
                <div className="absolute top-2 right-2 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => openEditModal(video, e)} className="p-2 bg-white/90 text-blue-600 rounded-lg shadow hover:bg-blue-600 hover:text-white transition-colors" title="Editar"><Edit3 size={16} /></button>
                  <button onClick={(e) => handleDelete(video.id, e)} className="p-2 bg-white/90 text-red-600 rounded-lg shadow hover:bg-red-600 hover:text-white transition-colors" title="Excluir"><Trash2 size={16} /></button>
                </div>
              )}
              <div className="relative aspect-video bg-black group-hover:opacity-90 transition-opacity">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase tracking-wide border border-white/10">{video.category || 'Geral'}</div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]"><div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition-transform"><Play fill="white" className="text-white ml-1" size={32} /></div></div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg line-clamp-2 leading-snug mb-2">{video.title}</h3>
                <button className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider hover:underline mt-2 flex items-center gap-1 self-start">Assistir Agora</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-[#020410]">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">{editingVideo ? <Edit3 size={20} className="text-blue-600"/> : <Plus size={20} className="text-blue-600"/>}{editingVideo ? 'Editar Vídeo' : 'Novo Vídeo'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-blue-500"><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              {formError && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2"><AlertCircle size={16} /> {formError}</div>}
              <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Título do Vídeo</label><input type="text" required value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white" placeholder="Ex: Aula sobre Cores" /></div>
              <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tema / Disciplina</label><select required value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white cursor-pointer">{CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
              <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Link do YouTube</label><input type="text" required value={formUrl} onChange={e => setFormUrl(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white" placeholder="https://www.youtube.com/watch?v=..." /></div>
              <div className="flex justify-end pt-2"><button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50 transition-all">{isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}{isSubmitting ? 'Salvando...' : (editingVideo ? 'Atualizar' : 'Salvar Vídeo')}</button></div>
            </form>
          </div>
        </div>
      )}

      {isPlayModalOpen && selectedVideoToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-5xl animate-scale-in relative">
            <button onClick={() => setIsPlayModalOpen(false)} className="absolute -top-12 right-0 text-white/70 hover:text-white flex items-center gap-2 font-bold transition-colors">Fechar <X size={24} /></button>
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"><iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${extractYouTubeId(selectedVideoToPlay.url)}?autoplay=1&modestbranding=1&rel=0&origin=${window.location.origin}`} title={selectedVideoToPlay.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe></div>
            <div className="mt-4 flex items-center justify-between"><h2 className="text-2xl font-bold text-white">{selectedVideoToPlay.title}</h2><span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">{selectedVideoToPlay.category || 'Geral'}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};