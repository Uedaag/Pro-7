import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Maximize2, Minimize2, Sparkles, Loader2, MessageCircle, HelpCircle } from 'lucide-react';
import { createTeacherAssistantChat } from '../services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const AIChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Olá! Sou o **Especialista Pro 7**. Posso ajudar com a Agenda, Planos de Aula ou Jogos. Qual ferramenta você quer usar?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !chatRef.current) {
      chatRef.current = createTeacherAssistantChat();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg = inputText.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputText('');
    setIsLoading(true);

    try {
      if (!chatRef.current) {
         chatRef.current = createTeacherAssistantChat();
      }

      const response: GenerateContentResponse = await chatRef.current.sendMessage({ message: userMsg });
      
      if (response.text) {
        setMessages(prev => [...prev, { role: 'model', text: response.text }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Desculpe, tive um problema. Se persistir, contate o admin no WhatsApp: (77) 99913-4858.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-full shadow-[0_4px_20px_rgba(8,145,178,0.4)] hover:shadow-[0_6px_25px_rgba(8,145,178,0.6)] flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 animate-fade-in group border-2 border-white/20"
      >
        <HelpCircle size={32} className="group-hover:animate-bounce" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
        </span>
      </button>
    );
  }

  return (
    <div className={`fixed z-50 transition-all duration-300 ease-in-out bg-white dark:bg-[#0f172a] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col
      ${isMinimized 
        ? 'bottom-6 right-6 w-72 h-16 rounded-2xl' 
        : 'bottom-6 right-6 w-[90vw] md:w-96 h-[80vh] md:h-[600px] rounded-2xl'
      }
    `}>
      {/* Header */}
      <div 
        className="bg-gradient-to-r from-cyan-600 to-blue-700 p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-3 text-white">
          <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
             <Bot size={18} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-sm block">Suporte Pro 7</span>
            <span className="text-[10px] text-cyan-100 block">Especialista do Sistema</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-white/80">
          <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="hover:text-white p-1">
             {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="hover:text-white p-1 hover:bg-white/20 rounded">
             <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-[#020410] space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400'}`}>
                   {msg.role === 'user' ? <div className="w-4 h-4 bg-slate-500 rounded-full" /> : <Bot size={18} />}
                </div>
                <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm ${
                   msg.role === 'user' 
                     ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tr-none' 
                     : 'bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-300 rounded-tl-none border border-slate-100 dark:border-white/5'
                }`}>
                  <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center shrink-0">
                  <Bot size={18} className="text-cyan-600" />
                </div>
                <div className="bg-white dark:bg-[#0f172a] rounded-2xl rounded-tl-none p-3 border border-slate-100 dark:border-white/5">
                   <div className="flex gap-1">
                     <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                     <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                     <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                   </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-[#0f172a] border-t border-slate-100 dark:border-white/5">
            <div className="relative">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ex: Como crio uma prova com IA?"
                className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-slate-900 border-none rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 outline-none text-sm"
              />
              <button 
                type="submit" 
                disabled={!inputText.trim() || isLoading}
                className="absolute right-2 top-2 p-1.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 disabled:opacity-50 disabled:bg-slate-400 transition-colors"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
            <div className="text-[10px] text-center text-slate-400 mt-2">
               Suporte Admin (WhatsApp): (77) 99913-4858
            </div>
          </form>
        </>
      )}
    </div>
  );
};