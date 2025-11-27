
import React, { useEffect, useState, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { 
  getCommunityMessages,
  addCommunityMessage,
  updateCommunityMessage,
  deleteCommunityMessage,
  CommunityMessage
} from '../supabase/communityService';
import { supabase } from '../lib/supabaseClient';
import { Send, Trash2, Edit2, X, Check, User as UserIcon, MessageCircle, Image as ImageIcon, Smile, Paperclip } from 'lucide-react';

export const CommunityView: React.FC = () => {
  const { currentUser } = useData();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Image Upload State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMessages = async () => {
    const { data } = await getCommunityMessages();
    if (data) setMessages(data);
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create local preview
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !currentUser) return;
    setLoading(true);

    let imageUrl = '';

    // Upload Image if exists
    if (selectedImage) {
      try {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
        const filePath = `${currentUser.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('community_images')
          .upload(filePath, selectedImage);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('community_images').getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      } catch (error) {
        console.error("Erro no upload:", error);
        alert("Erro ao enviar imagem.");
        setLoading(false);
        return;
      }
    }

    const payload = {
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_avatar: currentUser.avatarUrl || undefined,
      message: newMessage,
      image_url: imageUrl || undefined
    };

    const { error } = await addCommunityMessage(payload);
    if (!error) {
      setNewMessage('');
      removeSelectedImage();
      await loadMessages();
    } else {
      alert('Erro ao enviar mensagem.');
    }
    setLoading(false);
  };

  const startEditing = (msg: CommunityMessage) => {
    setEditingId(msg.id);
    setEditingText(msg.message);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingText('');
  };

  const handleUpdate = async (id: string) => {
    if (!editingText.trim()) return;
    const { error } = await updateCommunityMessage(id, editingText);
    if (!error) {
      setEditingId(null);
      await loadMessages();
    } else {
      alert('Erro ao atualizar mensagem.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta publicação?')) return;
    const { error } = await deleteCommunityMessage(id);
    if (!error) {
      await loadMessages();
    } else {
      alert('Erro ao excluir mensagem.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600 rounded-xl">
          <MessageCircle size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Comunidade</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Troque ideias, compartilhe materiais e conecte-se.</p>
        </div>
      </div>

      {/* Área de Criação (Dynamic Composer) */}
      <div className="bg-white dark:bg-[#0f172a] p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg mb-8">
        <div className="flex gap-4">
          <div className="hidden md:block">
             {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 dark:border-slate-800" />
             ) : (
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                   <UserIcon size={24} />
                </div>
             )}
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="relative">
              <textarea
                className="w-full bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none text-slate-800 dark:text-white text-base transition-all"
                rows={3}
                placeholder="O que você gostaria de compartilhar hoje?"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              
              {/* Image Preview Area */}
              {imagePreview && (
                <div className="mt-3 relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="h-32 w-auto object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm" 
                  />
                  <button 
                    onClick={removeSelectedImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-md"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-white/5">
              <div className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageSelect} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-full text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all tooltip-trigger relative group"
                  title="Adicionar Imagem"
                >
                  <ImageIcon size={20} />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Foto</span>
                </button>
                
                <button 
                  className="p-2.5 rounded-full text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all relative group"
                  title="Emojis"
                >
                  <Smile size={20} />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Emojis (Win + .)</span>
                </button>
              </div>

              <button
                onClick={handleSendMessage}
                disabled={loading || (!newMessage.trim() && !selectedImage)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? 'Enviando...' : (
                  <>
                    Publicar <Send size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Mensagens */}
      <div className="space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className="bg-white dark:bg-[#0f172a] p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm transition-all hover:shadow-md animate-slide-in-from-bottom-4">
            <div className="flex gap-4">
              <div className="shrink-0">
                {msg.user_avatar ? (
                  <img src={msg.user_avatar} alt={msg.user_name} className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm" />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-full flex items-center justify-center text-slate-400 shadow-sm">
                    <UserIcon size={24} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">{msg.user_name}</h3>
                    <p className="text-xs text-slate-400">
                      {new Date(msg.created_at).toLocaleDateString()} às {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  
                  {/* Ações do Dono */}
                  {(currentUser?.id === msg.user_id || currentUser?.role === 'admin') && (
                    <div className="flex items-center gap-1">
                      {editingId !== msg.id && (
                        <div className="relative group">
                          <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                             <div className="flex gap-1">
                                <div className="w-1 h-1 rounded-full bg-current"></div>
                                <div className="w-1 h-1 rounded-full bg-current"></div>
                                <div className="w-1 h-1 rounded-full bg-current"></div>
                             </div>
                          </button>
                          {/* Menu Dropdown Simulado */}
                          <div className="absolute right-0 top-8 bg-white dark:bg-slate-800 shadow-lg rounded-xl border border-slate-100 dark:border-white/5 p-1 hidden group-hover:block min-w-[120px] z-10">
                             <button 
                               onClick={() => startEditing(msg)}
                               className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg flex items-center gap-2"
                             >
                                <Edit2 size={14} /> Editar
                             </button>
                             <button 
                               onClick={() => handleDelete(msg.id)}
                               className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2"
                             >
                                <Trash2 size={14} /> Excluir
                             </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Conteúdo da Mensagem */}
                {editingId === msg.id ? (
                  <div className="mt-3 animate-fade-in bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                    <textarea
                      className="w-full bg-white dark:bg-slate-800 p-3 rounded-lg border border-cyan-200 dark:border-cyan-800 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2 mt-3 justify-end">
                      <button 
                        onClick={cancelEditing}
                        className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                      >
                        <X size={16} /> Cancelar
                      </button>
                      <button 
                        onClick={() => handleUpdate(msg.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold flex items-center gap-1 shadow-md transition-colors"
                      >
                        <Check size={16} /> Salvar Edição
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm md:text-base font-medium">
                      {msg.message}
                    </p>
                    
                    {/* Renderização da Imagem */}
                    {msg.image_url && (
                      <div className="mt-3">
                        <img 
                          src={msg.image_url} 
                          alt="Conteúdo compartilhado" 
                          className="rounded-2xl max-h-96 w-full md:w-auto object-cover border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => window.open(msg.image_url, '_blank')}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-center py-16 bg-slate-50 dark:bg-[#0f172a]/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
               <MessageCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Ainda não há publicações</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mt-1">Seja o primeiro a compartilhar algo com a comunidade Pro 7!</p>
          </div>
        )}
      </div>
    </div>
  );
};
