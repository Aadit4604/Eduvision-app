import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Mic, X, Bot, User, Loader2, Paperclip, Music, Trash2, Lightbulb } from 'lucide-react';
import { ChatMessage, ChatAttachment } from '../types';
import { sendSolverMessage } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface SolverChatProps {
    sessionId: string;
    userId: string;
    onUpdateHistory: (id: string, title: string) => void;
}

const SolverChat: React.FC<SolverChatProps> = ({ sessionId, userId, onUpdateHistory }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Load history on session change for specific user
  useEffect(() => {
      const storageKey = `solver_data_${userId}_${sessionId}`;
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

  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || inputText;
    if ((!textToSend.trim() && !attachment) || loading) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      attachments: attachment ? [attachment] : undefined,
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    
    const storageKey = `solver_data_${userId}_${sessionId}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedMessages));

    // Update history title if first message
    if (messages.length === 0) {
        onUpdateHistory(sessionId, textToSend.substring(0, 30) + (textToSend.length > 30 ? '...' : ''));
    }

    setInputText('');
    setAttachment(null);
    setLoading(true);

    try {
        const aiResponseText = await sendSolverMessage(messages, newMessage);
        
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: aiResponseText,
          timestamp: Date.now()
        };

        const finalMessages = [...updatedMessages, aiMessage];
        setMessages(finalMessages);
        localStorage.setItem(storageKey, JSON.stringify(finalMessages));
    } catch (e) {
        // Error handling if needed
    } finally {
        setLoading(false);
    }
  };

  const requestHint = () => {
      handleSendMessage("Can you give me a hint for the last problem? Don't solve it yet.");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAttachment({
          type: 'image',
          data: base64String.split(',')[1],
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
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
             setAttachment({
              type: 'audio',
              data: base64String.split(',')[1],
              mimeType: 'audio/webm'
            });
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

  const handleClearChat = () => {
      setMessages([]);
      setAttachment(null);
      const storageKey = `solver_data_${userId}_${sessionId}`;
      localStorage.removeItem(storageKey);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700/50 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md z-10 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold mb-1 flex items-center text-slate-900 dark:text-white">
                    <div className="p-2 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg mr-3 shadow-lg shadow-cyan-500/20">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    AI Math Tutor
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm ml-12">Multimodal solver: Text, Voice, or Image.</p>
            </div>
            {messages.length > 0 && (
                <button 
                    onClick={handleClearChat}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                    title="Clear Chat"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/30">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 opacity-60">
                    <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 animate-float">
                        <Bot className="w-10 h-10 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <p className="text-lg font-medium">Drop a problem here. I'm listening.</p>
                </div>
            )}

            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                    <div className={`flex items-end gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-primary' : 'bg-cyan-600'}`}>
                            {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                        </div>
                        
                        <div className={`p-4 rounded-2xl shadow-md border ${
                            msg.role === 'user' 
                            ? 'bg-primary-50 dark:bg-primary/20 border-primary-200 dark:border-primary/20 text-indigo-900 dark:text-indigo-100 rounded-br-none' 
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-bl-none'
                        }`}>
                            {msg.attachments?.map((att, i) => (
                                <div key={i} className="mb-3 rounded-lg overflow-hidden border border-black/5 dark:border-white/10 bg-black/5 dark:bg-black/20">
                                    {att.type === 'image' && (
                                        <img 
                                            src={`data:${att.mimeType};base64,${att.data}`} 
                                            alt="attachment" 
                                            className="max-w-full max-h-64 object-cover" 
                                        />
                                    )}
                                    {att.type === 'audio' && (
                                        <div className="p-3 flex items-center gap-2">
                                            <Music className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
                                            <audio controls src={`data:${att.mimeType};base64,${att.data}`} className="h-8 w-48" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="markdown-body">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {msg.text}
                                </ReactMarkdown>
                            </div>
                            <span className="text-[10px] opacity-50 block text-right mt-1">
                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
            
            {loading && (
                <div className="flex items-center gap-3 ml-12 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-500 dark:text-cyan-400" /> 
                    <span className="text-xs font-mono animate-pulse">Computing solution...</span>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-black/5 dark:border-white/5">
            {attachment && (
                <div className="relative mb-3 group w-fit animate-slide-up">
                    <button 
                        onClick={() => setAttachment(null)} 
                        className="absolute -top-2 -right-2 z-10 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors transform hover:scale-110"
                        title="Remove Attachment"
                    >
                        <X className="w-3 h-3" />
                    </button>
                    
                    <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-cyan-500 bg-cyan-50/80 dark:bg-cyan-900/30 shadow-lg backdrop-blur-sm ring-4 ring-cyan-500/10">
                        {attachment.type === 'image' ? (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 shrink-0">
                                <img 
                                    src={`data:${attachment.mimeType};base64,${attachment.data}`} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center border border-cyan-200 dark:border-cyan-500/30 shrink-0">
                                <Music className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                            </div>
                        )}
                        
                        <div className="pr-3">
                            <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300 uppercase block">
                                {attachment.type === 'image' ? 'Image' : 'Audio'} Attached
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                Ready to send
                            </span>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="flex items-center gap-3">
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-cyan-500/10 dark:hover:bg-cyan-400/10 rounded-xl transition-all"
                    title="Upload Image"
                >
                    <ImageIcon className="w-5 h-5" />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                />

                <button 
                    onClick={toggleRecording}
                    className={`p-3 rounded-xl transition-all ${
                        isRecording 
                        ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' 
                        : 'text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-cyan-500/10 dark:hover:bg-cyan-400/10'
                    }`}
                    title="Record Audio"
                >
                    <Mic className="w-5 h-5" />
                </button>

                <div className="flex-1 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 flex items-center focus-within:ring-2 focus-within:ring-cyan-500/30 focus-within:border-cyan-500/50 transition-all">
                    <input 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a math problem..."
                        className="flex-1 bg-transparent text-slate-900 dark:text-white focus:outline-none placeholder-slate-500"
                    />
                </div>

                <button 
                    onClick={requestHint}
                    disabled={loading}
                    className="p-3 text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-xl transition-all"
                    title="Get a Hint"
                >
                    <Lightbulb className="w-5 h-5" />
                </button>

                <button 
                    onClick={() => handleSendMessage()}
                    disabled={loading || (!inputText && !attachment)}
                    className="p-3 bg-cyan-500 text-white rounded-xl hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:shadow-none transition-all transform active:scale-95"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    </div>
  );
};

export default SolverChat;