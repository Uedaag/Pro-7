
import React, { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { 
  getCommunityMessages,
  addCommunityMessage,
  updateCommunityMessage,
  deleteCommunityMessage,
  CommunityMessage
} from '../supabase/communityService';
import { Send, Trash2, Edit2, X, Check, User as UserIcon, MessageCircle } from 'lucide-react';

export const CommunityView: React.FC = () => {
  const { currentUser } = useData();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [loading, setLoading] = useState(false);

  const loadMessages = async () => {
    const { data } = await getCommunityMessages();
    if (data) setMessages(data);
  };

  useEffect(() => {
    loadMessages();
    
    // Opcional: Polling simples para atualização
    const interval = setInterval(loadMessages, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;
    setLoading(true);

    const payload = {
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_avatar: currentUser.avatarUrl || undefined,
      message: newMessage
    };

    const { error } = await addCommunityMessage(payload);
    if (!error) {
      setNewMessage('');
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
    if (!window.confirm('Tem certeza que deseja excluir esta mensagem?')) return;
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
          <p className="text-slate-500 dark:text-slate-400 text-sm">Troque ideias com outros professores.</p>
        </div>
      </div>

      {/* Área de Criação */}
      <div className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm mb-8">
        <div className="flex gap-4">
          <div className="hidden md:block">
             {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
             ) : (
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                   <UserIcon size={20} />
                </div>
             )}
          </div>
          <div className="flex-1">
            <textarea
              className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 resize-none text-slate-800 dark:text-white"
              rows={3}
              placeholder="Compartilhe uma dica, dúvida ou experiência..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleSendMessage}
                disabled={loading || !newMessage.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                <Send size={18} /> {loading ? 'Enviando...' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Mensagens */}
      <div className="space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-all hover:shadow-md">
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
                        <>
                          <button 
                            onClick={() => startEditing(msg)} 
                            className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors" 
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(msg.id)} 
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" 
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {editingId === msg.id ? (
                  <div className="mt-2 animate-fade-in">
                    <textarea
                      className="w-full bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-cyan-200 dark:border-cyan-800 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2 mt-2 justify-end">
                      <button 
                        onClick={cancelEditing}
                        className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-sm font-medium flex items-center gap-1"
                      >
                        <X size={14} /> Cancelar
                      </button>
                      <button 
                        onClick={() => handleUpdate(msg.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm font-medium flex items-center gap-1 shadow-sm"
                      >
                        <Check size={14} /> Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                    {msg.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-center py-12 bg-slate-50 dark:bg-[#0f172a]/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <MessageCircle size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 dark:text-slate-400">Nenhuma mensagem ainda. Seja o primeiro a comentar!</p>
          </div>
        )}
      </div>
    </div>
  );
};
