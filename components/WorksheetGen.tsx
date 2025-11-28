import React, { useState, useEffect } from 'react';
import { generateWorksheet } from '../services/geminiService';
import { Worksheet, Difficulty } from '../types';
import { FileDown, RefreshCw, Check, BookOpen, Layers, Hash } from 'lucide-react';

interface WorksheetGenProps {
  initialTopic?: string;
}

const WorksheetGen: React.FC<WorksheetGenProps> = ({ initialTopic }) => {
  const [topic, setTopic] = useState('Calculus');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
    }
  }, [initialTopic]);

  const handleGenerate = async () => {
    setLoading(true);
    setWorksheet(null);
    setShowAnswers(false);
    try {
      const data = await generateWorksheet(topic, difficulty, count);
      setWorksheet(data);
    } catch (err) {
      alert("Failed to generate worksheet.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-worksheet');
    if (printContent) {
        const win = window.open('', '', 'height=700,width=800');
        if (win) {
            win.document.write('<html><head><title>EduVision Worksheet</title>');
            win.document.write('<style>body { font-family: sans-serif; padding: 40px; } .question { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 20px; } h1 { color: #333; } </style>');
            win.document.write('</head><body>');
            win.document.write(`<h1>${worksheet?.title}</h1>`);
            win.document.write(`<p>Topic: ${topic} | Difficulty: ${difficulty}</p><hr/>`);
            win.document.write(printContent.innerHTML);
            win.document.write('</body></html>');
            win.document.close();
            win.print();
        }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Configuration Panel */}
      <div className="glass-card p-8 rounded-3xl border border-white/5 relative overflow-hidden bg-white dark:bg-slate-900/50">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 flex items-center relative z-10">
            <div className="p-2 bg-green-500/20 rounded-lg mr-3 border border-green-500/30">
                 <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            Worksheet Generator
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
            <div className="md:col-span-6 group">
                <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1 group-focus-within:text-green-500 dark:group-focus-within:text-green-400 transition-colors">Topic</label>
                <div className="relative">
                    <input 
                        type="text" 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 pl-5 text-slate-900 dark:text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all placeholder-slate-400"
                        placeholder="e.g. Quadratic Equations"
                    />
                </div>
            </div>
            <div className="md:col-span-3">
                <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Difficulty</label>
                <div className="relative">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <select 
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                        className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 pl-10 text-slate-900 dark:text-white outline-none focus:border-green-500 appearance-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800/50 transition-colors"
                    >
                        {Object.values(Difficulty).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>
            <div className="md:col-span-3">
                 <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Count</label>
                 <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <select 
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                        className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 pl-10 text-slate-900 dark:text-white outline-none focus:border-green-500 appearance-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800/50 transition-colors"
                    >
                        <option value={3}>3 Questions</option>
                        <option value={5}>5 Questions</option>
                        <option value={10}>10 Questions</option>
                        <option value={15}>15 Questions</option>
                    </select>
                </div>
            </div>
        </div>

        <button 
            onClick={handleGenerate}
            disabled={loading}
            className={`mt-8 w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg ${
                loading ? 'bg-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-green-500/30 hover:scale-[1.01]'
            }`}
        >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            {loading ? 'AI is crafting questions...' : 'Generate Worksheet'}
        </button>
      </div>

      {/* Worksheet Display */}
      {worksheet && (
        <div className="glass-card p-8 rounded-3xl border-t-4 border-t-green-500 animate-slide-up bg-white dark:bg-slate-900/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200 dark:border-slate-700/50 pb-6">
                <div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{worksheet.title}</h3>
                    <div className="flex gap-3 text-sm">
                        <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{difficulty}</span>
                        <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{worksheet.questions?.length || 0} Questions</span>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => setShowAnswers(!showAnswers)}
                        className="flex-1 md:flex-none justify-center px-5 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        {showAnswers ? 'Hide Answers' : 'Reveal Answers'}
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="flex-1 md:flex-none justify-center px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors flex items-center gap-2"
                    >
                        <FileDown className="w-4 h-4" /> Print PDF
                    </button>
                </div>
            </div>

            <div id="printable-worksheet" className="space-y-6">
                {(worksheet.questions || []).map((q, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl p-6 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-colors">
                        <div className="flex gap-4">
                            <span className="flex-shrink-0 w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-lg font-bold text-slate-700 dark:text-slate-300 shadow-inner">
                                {i + 1}
                            </span>
                            <div className="flex-1 pt-1">
                                <p className="text-lg text-slate-800 dark:text-slate-100 mb-3 font-medium leading-relaxed">{q.question}</p>
                                <span className="text-[10px] uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-500 px-2 py-1 rounded border border-slate-300 dark:border-slate-700/50">{q.topic}</span>
                            </div>
                        </div>

                        {showAnswers && (
                            <div className="ml-14 mt-5 p-5 bg-gradient-to-r from-green-500/10 to-transparent border-l-2 border-green-500 rounded-r-xl animate-fade-in-up">
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold mb-2 text-sm uppercase tracking-wide">
                                    <Check className="w-4 h-4" /> Solution
                                </div>
                                <p className="text-green-800 dark:text-green-100 font-mono text-lg mb-2">{q.answer}</p>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{q.explanation}</p>
                            </div>
                        )}
                    </div>
                ))}
                {(!worksheet.questions || worksheet.questions.length === 0) && (
                    <div className="text-center text-slate-500 py-10">No questions generated. Try again.</div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default WorksheetGen;