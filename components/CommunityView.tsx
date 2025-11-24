
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { User, Post } from '../types';
import { MessageSquare, Heart, Send, Trash2, User as UserIcon } from 'lucide-react';

export const CommunityView: React.FC = () => {
  const { posts, addPost, deletePost, likePost, users } = useData();
  
  // Usuário atual mockado como 'teacher-1' ou pegando do localStorage na implementação real
  // Aqui vamos simular pegando o primeiro usuário da lista que seja "você"
  const currentUserJson = localStorage.getItem('eduEscapeUser');
  const currentUser: User | null = currentUserJson ? JSON.parse(currentUserJson) : null;

  const [newContent, setNewContent] = useState('');

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || !currentUser) return;
    
    addPost(newContent, currentUser);
    setNewContent('');
  };

  const isAuthorOrAdmin = (post: Post) => {
    if (!currentUser) return false;
    return currentUser.role === 'admin' || post.userId === currentUser.id;
  };

  return (
    <div className="max-w-3xl mx-auto pb-20 animate-fade-in">
       <div className="text-center mb-10">
         <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-2">Comunidade Pro 7</h1>
         <p className="text-slate-500">Troque experiências e ideias com outros professores.</p>
       </div>

       {/* Create Post */}
       <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
          <form onSubmit={handlePost}>
             <textarea 
               className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none resize-none text-slate-800 placeholder-slate-400"
               rows={3}
               placeholder="Compartilhe uma ideia, dúvida ou conquista..."
               value={newContent}
               onChange={(e) => setNewContent(e.target.value)}
             />
             <div className="flex justify-end mt-4">
                <button 
                  type="submit"
                  disabled={!newContent.trim()}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  <Send size={18} /> Publicar
                </button>
             </div>
          </form>
       </div>

       {/* Feed */}
       <div className="space-y-6">
          {posts.map(post => (
             <div key={post.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                         <UserIcon size={20} />
                      </div>
                      <div>
                         <h4 className="font-bold text-slate-800">{post.userName}</h4>
                         <p className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleDateString()} às {new Date(post.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                   </div>
                   {isAuthorOrAdmin(post) && (
                      <button onClick={() => deletePost(post.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                         <Trash2 size={18} />
                      </button>
                   )}
                </div>
                
                <p className="text-slate-700 leading-relaxed mb-6 whitespace-pre-wrap">
                   {post.content}
                </p>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                   <button 
                     onClick={() => likePost(post.id)}
                     className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors group"
                   >
                      <Heart size={20} className="group-hover:fill-red-500 transition-all" />
                      <span className="font-bold text-sm">{post.likes}</span>
                   </button>
                   <button className="flex items-center gap-2 text-slate-500 hover:text-cyan-600 transition-colors">
                      <MessageSquare size={20} />
                      <span className="font-bold text-sm">Comentar</span>
                   </button>
                </div>
             </div>
          ))}
          
          {posts.length === 0 && (
             <div className="text-center py-12 text-slate-400 italic">
                Seja o primeiro a publicar algo hoje!
             </div>
          )}
       </div>
    </div>
  );
};
