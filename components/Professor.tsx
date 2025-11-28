import React, { useState, useRef, useEffect } from 'react';
import { askProfessor } from '../services/geminiService';
import { ProfessorLevel, ProfessorResponse } from '../types';
import { Brain, Send, Globe, User, GraduationCap, ChevronRight, School, BookOpen, Microscope, Baby, Quote, Mic, MicOff, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface ProfessorProps {
    sessionId: string;
    userId: string;
    onUpdateHistory: (id: string, title: string) => void;
}

const Professor: React.FC<ProfessorProps> = ({ sessionId, userId, onUpdateHistory }) => {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<ProfessorLevel>(ProfessorLevel.HIGH);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: ProfessorResponse, timestamp: number}[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Load history for specific session and user
  useEffect(() => {
    const storageKey = `prof_data_${userId}_${sessionId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
        try {
            setMessages(JSON.parse(saved));
        } catch (e) { console.error(e); }
    } else {
        setMessages([]);
    }
  }, [sessionId, userId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
      scrollToBottom();
  }, [messages]);

  const handleSend = async (audioData?: string) => {
    if (!query.trim() && !audioData) return;
    
    const userText = audioData ? "🎤 Voice Message" : query;
    const newMessages = [...messages, { role: 'user' as const, content: { text: userText }, timestamp: Date.now() }];

    setMessages(newMessages);
    
    const storageKey = `prof_data_${userId}_${sessionId}`;
    localStorage.setItem(storageKey, JSON.stringify(newMessages));
    
    // Update history title if it's the first message
    if (messages.length === 0) {
        onUpdateHistory(sessionId, userText.substring(0, 30) + (userText.length > 30 ? '...' : ''));
    }

    setQuery('');
    setLoading(true);

    try {
      const response = await askProfessor(query, level, audioData);
      const updatedMessages = [...newMessages, { role: 'ai' as const, content: response, timestamp: Date.now() }];
      setMessages(updatedMessages);
      localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
    } catch (err) {
      const errorMessages = [...newMessages, { role: 'ai' as const, content: { text: "Sorry, I got confused. Try asking again!" }, timestamp: Date.now() }];
      setMessages(errorMessages);
      localStorage.setItem(storageKey, JSON.stringify(errorMessages));
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64String = reader.result as string;
            handleSend(base64String.split(',')[1]);
          };
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Mic access denied", err);
        alert("Microphone access is required for voice messages.");
      }
    }
  };

  const handleClear = () => {
      setMessages([]);
      const storageKey = `prof_data_${userId}_${sessionId}`;
      localStorage.removeItem(storageKey);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Configuration for Level Cards
  const levelConfig = {
    [ProfessorLevel.ELEMENTARY]: { 
        icon: Baby, 
        color: 'text-yellow-500 dark:text-yellow-400', 
        bg: 'bg-yellow-50 dark:bg-yellow-500/10', 
        border: 'border-yellow-200 dark:border-yellow-500/20', 
        label: 'Elementary', 
        grades: 'Grade 1-5',
        desc: 'Simple stories & analogies' 
    },
    [ProfessorLevel.MIDDLE]: { 
        icon: School, 
        color: 'text-green-500 dark:text-green-400', 
        bg: 'bg-green-50 dark:bg-green-500/10', 
        border: 'border-green-200 dark:border-green-500/20', 
        label: 'Middle School', 
        grades: 'Grade 6-8', 
        desc: 'Clear concepts' 
    },
    [ProfessorLevel.HIGH]: { 
        icon: BookOpen, 
        color: 'text-blue-500 dark:text-blue-400', 
        bg: 'bg-blue-50 dark:bg-blue-500/10', 
        border: 'border-blue-200 dark:border-blue-500/20', 
        label: 'High School', 
        grades: 'Grade 9-12', 
        desc: 'Exam prep & Logic' 
    },
    [ProfessorLevel.COLLEGE]: { 
        icon: GraduationCap, 
        color: 'text-purple-500 dark:text-purple-400', 
        bg: 'bg-purple-50 dark:bg-purple-500/10', 
        border: 'border-purple-200 dark:border-purple-500/20', 
        label: 'College', 
        grades: 'Undergrad', 
        desc: 'Technical depth' 
    },
    [ProfessorLevel.PHD]: { 
        icon: Microscope, 
        color: 'text-red-500 dark:text-red-400', 
        bg: 'bg-red-50 dark:bg-red-500/10', 
        border: 'border-red-200 dark:border-red-500/20', 
        label: 'PhD', 
        grades: 'Research', 
        desc: 'Theory & Derivations' 
    },
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700/50 shadow-2xl">
      
      {/* Header & Persona Selector */}
      <div className="border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-transparent backdrop-blur-md z-10 flex flex-col">
        <div className="p-4 md:p-6 pb-2">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg shadow-lg shadow-pink-500/20">
                        <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-none">AI Professor</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Adaptive tutor with real-time grounding.</p>
                    </div>
                </div>
                {messages.length > 0 && (
                    <button onClick={handleClear} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                    </button>
                )}
            </div>
            
            {/* Scrollable Level Selector */}
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {Object.entries(levelConfig).map(([key, config]) => {
                    const isActive = level === key;
                    const Icon = config.icon;
                    return (
                        <button
                            key={key}
                            onClick={() => setLevel(key as ProfessorLevel)}
                            className={`flex flex-col min-w-[140px] p-3 rounded-xl border transition-all duration-300 text-left relative overflow-hidden group ${
                                isActive 
                                ? `${config.bg} ${config.border} ring-1 ring-inset ring-black/5 dark:ring-white/10` 
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <div className={`flex items-center justify-between mb-2`}>
                                <Icon className={`w-5 h-5 ${isActive ? config.color : 'text-slate-500'}`} />
                                {isActive && <div className={`w-2 h-2 rounded-full ${config.color.replace('text', 'bg')} animate-pulse`}></div>}
                            </div>
                            <span className={`text-sm font-bold block ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{config.label}</span>
                            <span className={`text-[10px] font-mono mb-1 block uppercase tracking-wide ${isActive ? 'text-slate-700 dark:text-white/70' : 'text-slate-400 dark:text-slate-600'}`}>{config.grades}</span>
                            <span className="text-[10px] text-slate-500 leading-tight mt-auto">{config.desc}</span>
                        </button>
                    );
                })}
            </div>
        </div>
      </div>

      {/* Chat Area - REMOVED GREY BACKGROUND */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-transparent">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 space-y-6">
                <div className="relative">
                     <div className="absolute inset-0 bg-pink-500 blur-[60px] opacity-10 rounded-full"></div>
                     <Quote className="w-24 h-24 text-slate-200 dark:text-slate-700/50 relative z-10" />
                </div>
                <div className="text-center max-w-md px-4">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Select a Level & Ask</h3>
                    <p className="text-sm text-slate-500">I adapt my language, examples, and depth based on the selected persona above. Try asking "Why is the sky blue?"</p>
                </div>
            </div>
        )}
        
        {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                <div className={`flex items-end gap-3 max-w-[90%] md:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border border-white/20 dark:border-white/10 ${
                        msg.role === 'user' 
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-500' 
                        : 'bg-gradient-to-br from-pink-500 to-rose-500'
                    }`}>
                        {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <GraduationCap className="w-4 h-4 text-white" />}
                    </div>

                    {/* Bubble */}
                    <div className={`p-5 rounded-3xl shadow-sm backdrop-blur-md border ${
                        msg.role === 'user' 
                        ? 'bg-indigo-50/90 dark:bg-indigo-600/20 border-indigo-200 dark:border-indigo-500/20 text-indigo-900 dark:text-indigo-50 rounded-br-sm' 
                        : 'bg-white/90 dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-bl-sm'
                    }`}>
                        <div className="markdown-body">
                             <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {msg.content.text}
                             </ReactMarkdown>
                        </div>
                        
                        {/* Grounding Sources */}
                        {msg.role === 'ai' && msg.content.groundingMetadata?.groundingChunks && (
                            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10">
                                <p className="text-[10px] font-bold uppercase tracking-wider flex items-center mb-2 text-slate-500">
                                    <Globe className="w-3 h-3 mr-1" /> Verified Sources
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {msg.content.groundingMetadata.groundingChunks.map((chunk, i) => (
                                        chunk.web?.uri && (
                                            <a 
                                                key={i} 
                                                href={chunk.web.uri} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-xs flex items-center bg-slate-100 dark:bg-black/40 hover:bg-slate-200 dark:hover:bg-black/60 text-blue-600 dark:text-blue-300 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 transition-colors max-w-[200px] truncate"
                                            >
                                                {chunk.web.title || "Source Link"} <ChevronRight className="w-3 h-3 ml-1 opacity-50" />
                                            </a>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-right opacity-70">
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                    </div>
                </div>
            </div>
        ))}
        
        {loading && (
            <div className="flex justify-start">
                 <div className="flex items-end gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center animate-pulse border border-black/5 dark:border-white/5">
                        <Brain className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 px-4 py-3 rounded-2xl rounded-bl-sm text-slate-400 text-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce delay-200"></span>
                    </div>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white/80 dark:bg-transparent backdrop-blur-md border-t border-black/5 dark:border-white/5">
        <div className="flex items-center gap-2 max-w-4xl mx-auto bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-pink-500/50 focus-within:border-pink-500/50 transition-all shadow-inner">
            <input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={`Ask the ${levelConfig[level].label} Professor...`}
                className="flex-1 bg-transparent border-none text-slate-900 dark:text-white focus:outline-none py-2 placeholder-slate-500"
            />
            
            <button 
                onClick={toggleRecording}
                className={`p-2 rounded-xl transition-all ${
                    isRecording 
                    ? 'bg-red-500/20 text-red-500 dark:text-red-400 animate-pulse ring-1 ring-red-500/50' 
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                title="Voice Input"
            >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button 
                onClick={() => handleSend()}
                disabled={loading || (!query.trim() && !isRecording)}
                className="p-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-pink-500/30 disabled:opacity-50 disabled:shadow-none transition-all transform active:scale-95"
            >
                <Send className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default Professor;