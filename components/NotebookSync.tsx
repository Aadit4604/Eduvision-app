import React, { useState, useEffect } from 'react';
import { Upload, Book, FileText, Loader2, ListTodo, Share2, Tag, CheckCircle, ArrowRight, Layers, RotateCw } from 'lucide-react';
import { analyzeNotebook } from '../services/geminiService';
import { NotebookAnalysis } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface NotebookSyncProps {
    sessionId: string;
    userId: string;
    onUpdateHistory: (id: string, title: string) => void;
}

const NotebookSync: React.FC<NotebookSyncProps> = ({ sessionId, userId, onUpdateHistory }) => {
    const [file, setFile] = useState<File | null>(null);
    const [analysis, setAnalysis] = useState<NotebookAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'transcription' | 'insights' | 'flashcards'>('insights');
    const [completedTasks, setCompletedTasks] = useState<number[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);

    // Load data for this session and user
    useEffect(() => {
        const storageKey = `notebook_data_${userId}_${sessionId}`;
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setAnalysis(parsed);
            } catch (e) { console.error(e); }
        } else {
            // Reset for new session
            setAnalysis(null);
            setFile(null);
            setCompletedTasks([]);
            setFlippedCards([]);
        }
    }, [sessionId, userId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setAnalysis(null);
            setCompletedTasks([]);
            setFlippedCards([]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                const base64Data = base64String.split(',')[1];
                // Pass file type to support PDF
                const result = await analyzeNotebook(base64Data, file.type);
                setAnalysis(result);
                
                // Save session
                const storageKey = `notebook_data_${userId}_${sessionId}`;
                localStorage.setItem(storageKey, JSON.stringify(result));
                
                // Update history title
                const title = file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name;
                onUpdateHistory(sessionId, title);

                setLoading(false);
                setActiveTab('insights');
            };
            reader.readAsDataURL(file);
        } catch (e) {
            console.error(e);
            setLoading(false);
            alert("Failed to analyze notebook. Please try again.");
        }
    };

    const toggleTask = (index: number) => {
        setCompletedTasks(prev => 
            prev.includes(index) 
            ? prev.filter(i => i !== index) 
            : [...prev, index]
        );
    };

    const toggleCard = (index: number) => {
        setFlippedCards(prev => 
            prev.includes(index) 
            ? prev.filter(i => i !== index) 
            : [...prev, index]
        );
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
             {!analysis && (
                 <div className="glass-card p-10 rounded-3xl text-center border border-orange-200 dark:border-orange-500/20 relative overflow-hidden bg-white dark:bg-slate-900/50">
                    {/* Background Decor */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-orange-100 dark:bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-200 dark:border-orange-500/20 shadow-lg shadow-orange-500/10">
                            <Book className="w-10 h-10 text-orange-500 dark:text-orange-400" />
                        </div>
                        
                        <h2 className="text-3xl font-bold mb-3 text-slate-900 dark:text-white">Notebook Sync</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xl mx-auto">Digitize your handwritten notes or upload chapters (PDF). AI will analyze the content, identify key concepts, build a study map, and <b>generate flashcards</b>.</p>

                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 hover:border-orange-400/50 hover:bg-orange-50 dark:hover:bg-orange-500/5 transition-all cursor-pointer relative bg-slate-50 dark:bg-slate-900/30 max-w-xl mx-auto group">
                            <input 
                                type="file" 
                                accept="image/*,application/pdf" 
                                onChange={handleFileChange} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            />
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-full mb-4 group-hover:scale-110 transition-transform shadow-md">
                                <Upload className="w-8 h-8 text-orange-500 dark:text-orange-400" />
                            </div>
                            <p className="text-lg font-medium text-slate-700 dark:text-slate-300 group-hover:text-orange-600 dark:group-hover:text-white transition-colors">
                                {file ? file.name : "Drop Notebook Page or PDF Here"}
                            </p>
                            <p className="text-xs text-slate-400 mt-2">Supports JPG, PNG, PDF</p>
                        </div>

                        {file && (
                            <button
                                onClick={handleUpload}
                                disabled={loading}
                                className={`mt-8 px-10 py-4 rounded-xl font-bold text-white transition-all transform hover:scale-105 shadow-xl ${
                                    loading ? 'bg-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-orange-500/30'
                                }`}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="animate-spin w-5 h-5" /> Analyzing Content...
                                    </div>
                                ) : 'Build Knowledge Graph'}
                            </button>
                        )}
                    </div>
                 </div>
             )}

             {analysis && (
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-slide-up">
                     {/* Sidebar / Controls */}
                     <div className="lg:col-span-12 flex gap-4 mb-2 overflow-x-auto pb-2">
                        <button 
                            onClick={() => setActiveTab('insights')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                                activeTab === 'insights' 
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                                : 'glass-panel text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Share2 className="w-4 h-4" /> Insights & Graph
                        </button>
                        <button 
                            onClick={() => setActiveTab('flashcards')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                                activeTab === 'flashcards' 
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                                : 'glass-panel text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Layers className="w-4 h-4" /> Flashcards
                        </button>
                        <button 
                            onClick={() => setActiveTab('transcription')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                                activeTab === 'transcription' 
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                                : 'glass-panel text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <FileText className="w-4 h-4" /> Full Transcription
                        </button>
                        
                        <div className="ml-auto glass-panel px-4 py-2 rounded-xl flex items-center text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                            Analysis Complete
                        </div>
                     </div>

                     {activeTab === 'insights' && (
                         <>
                            {/* Summary Card */}
                            <div className="lg:col-span-8 glass-card p-8 rounded-3xl border-l-4 border-orange-500 relative overflow-hidden bg-white dark:bg-slate-900/50">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Book className="w-5 h-5 text-orange-500 dark:text-orange-400" /> Executive Summary
                                </h3>
                                <div className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg markdown-body">
                                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {analysis.summary}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            {/* Action Plan */}
                            <div className="lg:col-span-4 glass-card p-6 rounded-3xl bg-green-50 dark:bg-gradient-to-br dark:from-green-500/5 dark:to-transparent border border-green-200 dark:border-green-500/10">
                                <h3 className="text-lg font-bold text-green-700 dark:text-green-300 mb-4 flex items-center gap-2">
                                    <ListTodo className="w-5 h-5 text-green-500" /> Study Checklist
                                </h3>
                                <div className="space-y-3">
                                    {(analysis.actionPlan || []).map((task, i) => (
                                        <div 
                                            key={i} 
                                            onClick={() => toggleTask(i)}
                                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                                                completedTasks.includes(i) 
                                                ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30 opacity-60 hover:opacity-100' 
                                                : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                                                completedTasks.includes(i) ? 'bg-green-500 border-green-500' : 'border-slate-400 dark:border-slate-500'
                                            }`}>
                                                {completedTasks.includes(i) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <div className={`text-sm transition-all markdown-body ${completedTasks.includes(i) ? 'text-slate-500 dark:text-slate-500 line-through decoration-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                    {task}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    ))}
                                    {(!analysis.actionPlan || analysis.actionPlan.length === 0) && (
                                        <p className="text-slate-500 text-sm">No action items found.</p>
                                    )}
                                </div>
                            </div>

                            {/* Concepts Grid */}
                            <div className="lg:col-span-12 glass-card p-8 rounded-3xl bg-white dark:bg-slate-900/50">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-blue-500 dark:text-blue-400" /> Key Concepts Extracted
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {(analysis.keyConcepts || []).map((concept, i) => (
                                        <div key={i} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 hover:border-blue-400/50 dark:hover:border-blue-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all group shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">{concept.name}</h4>
                                                <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-500 px-2 py-1 rounded border border-slate-300 dark:border-slate-700">{concept.category}</span>
                                            </div>
                                            <div className="text-sm text-slate-600 dark:text-slate-400 leading-snug markdown-body">
                                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                    {concept.definition}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    ))}
                                    {(!analysis.keyConcepts || analysis.keyConcepts.length === 0) && (
                                        <p className="text-slate-500">No concepts identified.</p>
                                    )}
                                </div>
                            </div>

                            {/* Knowledge Graph / Connections */}
                            <div className="lg:col-span-12 glass-card p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/80">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Share2 className="w-5 h-5 text-purple-500 dark:text-purple-400" /> Knowledge Graph Connections
                                </h3>
                                <div className="space-y-4">
                                    {(analysis.connections || []).map((conn, i) => (
                                        <div key={i} className="flex items-center gap-4 bg-white dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <div className="px-4 py-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium text-sm">
                                                {conn.source}
                                            </div>
                                            <div className="flex-1 flex flex-col items-center">
                                                <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{conn.relationship}</span>
                                                <div className="h-[1px] w-full bg-slate-300 dark:bg-slate-700 relative">
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-300 dark:bg-slate-700 rotate-45 transform translate-x-1/2"></div>
                                                </div>
                                            </div>
                                            <div className="px-4 py-2 rounded-lg bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-300 font-medium text-sm">
                                                {conn.target}
                                            </div>
                                        </div>
                                    ))}
                                    {(!analysis.connections || analysis.connections.length === 0) && (
                                        <p className="text-slate-500">No connections mapped.</p>
                                    )}
                                </div>
                            </div>
                         </>
                     )}

                     {activeTab === 'flashcards' && (
                         <div className="lg:col-span-12 animate-fade-in-up">
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                 {(analysis.flashcards || []).map((card, i) => (
                                     <div 
                                        key={i} 
                                        className="h-64 cursor-pointer perspective-1000 group"
                                        onClick={() => toggleCard(i)}
                                     >
                                         <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${flippedCards.includes(i) ? 'rotate-y-180' : ''}`}>
                                             {/* Front */}
                                             <div className="absolute w-full h-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center backface-hidden shadow-xl hover:border-orange-400 dark:hover:border-orange-500/30">
                                                 <span className="text-xs text-orange-500 dark:text-orange-400 font-bold uppercase tracking-widest mb-4">Question</span>
                                                 <div className="text-xl font-bold text-center text-slate-800 dark:text-white markdown-body">
                                                     <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                        {card.front}
                                                     </ReactMarkdown>
                                                 </div>
                                                 <div className="absolute bottom-4 right-4 text-slate-400 dark:text-slate-500">
                                                     <RotateCw className="w-5 h-5" />
                                                 </div>
                                             </div>
                                             
                                             {/* Back */}
                                             <div className="absolute w-full h-full bg-gradient-to-br from-orange-500 to-red-500 dark:from-orange-600 dark:to-red-600 rounded-3xl p-6 flex flex-col items-center justify-center backface-hidden rotate-y-180 shadow-xl text-white">
                                                 <span className="text-xs text-white/70 font-bold uppercase tracking-widest mb-4">Answer</span>
                                                 <div className="text-lg font-medium text-center markdown-body text-white">
                                                     <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                        {card.back}
                                                     </ReactMarkdown>
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                             {(!analysis.flashcards || analysis.flashcards.length === 0) && (
                                 <div className="text-center p-12 text-slate-500">
                                     No flashcards generated for this note.
                                 </div>
                             )}
                         </div>
                     )}

                     {activeTab === 'transcription' && (
                         <div className="lg:col-span-12 glass-card p-8 rounded-3xl bg-white dark:bg-slate-900/50">
                             <div className="markdown-body">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {analysis.transcription || "No transcription available."}
                                </ReactMarkdown>
                             </div>
                         </div>
                     )}
                 </div>
             )}
        </div>
    );
};

export default NotebookSync;