
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Send, Trash2, Heart, User as UserIcon } from 'lucide-react';

export const CommunityView: React.FC = () => {
  const { posts, addPost, deletePost, likePost, currentUser } = useData();
  const [newContent, setNewContent] = useState('');

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || !currentUser) return;
    await addPost(newContent, currentUser);
    setNewContent('');
  };

  return (
    <div className="max-w-3xl mx-auto pb-20 animate-fade-in">
       <div className="bg-white p-6 rounded-2xl border shadow-sm mb-8">
          <form onSubmit={handlePost}>
             <textarea className="w-full bg-slate-50 p-4 rounded-xl border outline-none" rows={3} placeholder="Compartilhe algo..." value={newContent} onChange={(e) => setNewContent(e.target.value)} />
             <div className="flex justify-end mt-4">
                <button type="submit" disabled={!newContent.trim()} className="bg-cyan-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"><Send size={18} /> Publicar</button>
             </div>
          </form>
       </div>

       <div className="space-y-6">
          {posts.map(post => (
             <div key={post.id} className="bg-white p-6 rounded-2xl border shadow-sm">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"><UserIcon size={20} /></div>
                      <div>
                         <h4 className="font-bold text-slate-800">{post.userName}</h4>
                         <p className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleDateString()}</p>
                      </div>
                   </div>
                   {(currentUser?.id === post.userId || currentUser?.role === 'admin') && (
                      <button onClick={() => deletePost(post.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                   )}
                </div>
                <p className="text-slate-700 mb-6 whitespace-pre-wrap">{post.content}</p>
                <div className="flex items-center gap-4 pt-4 border-t">
                   <button onClick={() => likePost(post.id)} className="flex items-center gap-2 text-slate-500 hover:text-red-500"><Heart size={20} /><span className="font-bold text-sm">{post.likes}</span></button>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};
