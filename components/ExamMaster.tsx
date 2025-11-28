import React, { useState, useEffect } from 'react';
import { analyzeExam } from '../services/geminiService';
import { ExamAnalysis } from '../types';
import { Upload, FileText, CheckCircle, BarChart2, AlertCircle, Sparkles, Zap, Brain, XCircle, Target, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#ef4444', '#f59e0b', '#10b981'];

interface ExamMasterProps {
    onStartPractice?: (topic: string) => void;
    sessionId: string;
    userId: string;
    onUpdateHistory: (id: string, title: string) => void;
}

const ExamMaster: React.FC<ExamMasterProps> = ({ onStartPractice, sessionId, userId, onUpdateHistory }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ExamAnalysis | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Load data for this session and user
  useEffect(() => {
      const storageKey = `exam_data_${userId}_${sessionId}`;
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
          try {
              const parsed = JSON.parse(savedData);
              setAnalysis(parsed);
          } catch (e) { console.error(e); }
      } else {
          setAnalysis(null);
          setFile(null);
      }
  }, [sessionId, userId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setAnalysis(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        // Pass file type to support PDF (e.g., application/pdf)
        const result = await analyzeExam(base64Data, file.type);
        
        setAnalysis(result);
        
        // Save to this session
        const storageKey = `exam_data_${userId}_${sessionId}`;
        localStorage.setItem(storageKey, JSON.stringify(result));
        
        // Update sidebar history title
        const title = file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name;
        onUpdateHistory(sessionId, title);
        
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Failed to analyze exam. Please try again.");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Hero Section */}
      <div className="text-center space-y-4 mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500">
            Exam Master AI
          </span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Upload any exam paper (PDF or Image). Get instant grading, step-by-step solutions, and a personalized revision strategy.
        </p>
      </div>

      {!analysis && (
        <div className="max-w-3xl mx-auto">
          <div 
            className={`relative group border-2 border-dashed rounded-3xl p-12 transition-all duration-300 ease-in-out ${
              dragActive 
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 scale-102 shadow-xl shadow-primary-500/20' 
              : 'border-slate-300 dark:border-slate-700 hover:border-primary-400/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-white/50 dark:bg-slate-900/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              accept="image/*,application/pdf" 
              onChange={handleFileChange} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            
            <div className="flex flex-col items-center justify-center space-y-6 pointer-events-none">
              <div className={`p-6 rounded-full bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border border-primary-500/20 shadow-lg shadow-primary-500/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                <Upload className="w-10 h-10 text-primary-500 dark:text-primary-400" />
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-white transition-colors">
                  {file ? file.name : "Drag & Drop your Exam here"}
                </p>
                <p className="text-sm text-slate-500 mt-2 group-hover:text-slate-600 dark:group-hover:text-slate-400">
                  or click to browse • JPG, PNG, PDF
                </p>
              </div>
            </div>
            
            {/* Background animated blobs */}
            <div className="absolute -z-10 top-0 left-0 w-full h-full overflow-hidden rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
               <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-500/5 via-transparent to-transparent animate-spin-slow"></div>
            </div>
          </div>

          {file && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className={`relative overflow-hidden group px-10 py-4 rounded-2xl font-bold text-white shadow-xl transition-all hover:scale-105 active:scale-95 ${
                  loading ? 'bg-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-primary-600 to-secondary-600 hover:shadow-primary-500/40'
                }`}
              >
                <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-in-out skew-x-12 -translate-x-full"></div>
                <span className="flex items-center gap-3 relative z-10">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" /> Analyze Exam
                    </>
                  )}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="max-w-2xl mx-auto mt-12 text-center space-y-4 animate-fade-in-up">
           <div className="relative h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 w-1/2 animate-[shimmer_2s_infinite]"></div>
           </div>
           <p className="text-primary-500 dark:text-primary-300 font-mono text-sm animate-pulse">
             AI is extracting questions, verifying logic, and calculating marks...
           </p>
        </div>
      )}

      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up">
          
          {/* Summary Stats Row */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
             <div className="glass-card p-6 rounded-2xl border-l-4 border-indigo-500">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wider">Overall Difficulty</h3>
                   <BarChart2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div className="flex items-baseline gap-2">
                   <span className="text-3xl font-bold text-slate-900 dark:text-white">Moderate</span>
                   <span className="text-xs text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/10 px-2 py-1 rounded">Level 3</span>
                </div>
             </div>
             
             <div className="glass-card p-6 rounded-2xl border-l-4 border-pink-500">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wider">Focus Area</h3>
                   <Brain className="w-5 h-5 text-pink-500 dark:text-pink-400" />
                </div>
                <div className="flex items-baseline gap-2">
                   <span className="text-3xl font-bold text-slate-900 dark:text-white">{(analysis.topicAnalysis && analysis.topicAnalysis[0]?.topic) || "General"}</span>
                   <span className="text-xs text-pink-600 dark:text-pink-300 bg-pink-100 dark:bg-pink-500/10 px-2 py-1 rounded">High Freq</span>
                </div>
             </div>

             <div className="glass-card p-6 rounded-2xl border-l-4 border-emerald-500">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wider">Action Item</h3>
                   <Zap className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-2">
                   <span className="text-3xl font-bold text-slate-900 dark:text-white">{analysis.weakAreas?.length || 0} Topics</span>
                   <span className="text-xs text-emerald-600 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-1 rounded">To Revise</span>
                </div>
             </div>
          </div>

          {/* Charts Section */}
          <div className="lg:col-span-8 glass-card p-6 rounded-3xl flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-500 dark:text-indigo-400" /> Marks Distribution
            </h3>
            <div className="h-80 w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.marksDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMarks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.3} vertical={false} />
                  <XAxis dataKey="chapter" stroke="#94a3b8" tick={{fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} 
                    cursor={{fill: 'rgba(255,255,255,0.1)'}} 
                  />
                  <Bar dataKey="marks" fill="url(#colorMarks)" radius={[6, 6, 0, 0]}>
                    {(analysis.marksDistribution || []).map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 glass-card p-6 rounded-3xl flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-secondary-500 dark:text-purple-400" /> Difficulty Mix
            </h3>
            <div className="h-64 w-full flex-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analysis.difficultyMap || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="percentage"
                    nameKey="level"
                    stroke="none"
                  >
                    {(analysis.difficultyMap || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-slate-600 dark:text-slate-400">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none mb-8">
                 <div className="text-center">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">100%</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Analysis</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Actionable Insights */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="glass-card p-8 rounded-3xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/10 border border-red-200 dark:border-red-500/30 relative overflow-hidden group">
                <div className="absolute -top-6 -right-6 text-red-500/10 dark:text-red-500/20 pointer-events-none transform rotate-12 group-hover:rotate-0 transition-transform duration-700">
                    <AlertCircle className="w-48 h-48" />
                </div>
                
                <h3 className="text-xl font-bold text-red-800 dark:text-red-200 mb-6 flex items-center gap-3 relative z-10">
                    <div className="bg-red-100 dark:bg-red-500/20 p-2 rounded-lg">
                        <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" /> 
                    </div>
                    Critical Weaknesses
                </h3>
                
                <ul className="space-y-4 relative z-10">
                  {(analysis.weakAreas || []).map((area, i) => (
                    <li key={i} className="flex items-start gap-4 text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-black/20 p-4 rounded-xl border-l-4 border-red-500 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300">
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="leading-snug font-medium">{area}</span>
                    </li>
                  ))}
                  {(!analysis.weakAreas || analysis.weakAreas.length === 0) && (
                    <li className="text-slate-500 italic">No specific weak areas detected. Great job!</li>
                  )}
                </ul>
             </div>

             <div className="glass-card p-8 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10 border border-blue-200 dark:border-blue-500/30 relative overflow-hidden group">
                <div className="absolute -bottom-6 -right-6 text-blue-500/10 dark:text-blue-500/20 pointer-events-none transform -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                    <Target className="w-48 h-48" />
                </div>

                <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-6 flex items-center gap-3 relative z-10">
                    <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    Strategic Revision Plan
                </h3>
                
                <ul className="space-y-4 relative z-10">
                  {(analysis.revisionPlan || []).map((plan, i) => (
                    <li key={i} className="flex items-start gap-4 text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-black/20 p-4 rounded-xl border-l-4 border-blue-500 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300">
                        <div className="bg-blue-500 dark:bg-blue-600 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center text-white mt-0.5 flex-shrink-0 shadow-lg shadow-blue-500/30">
                            {i+1}
                        </div>
                        <div className="flex-1">
                            <span className="leading-snug font-medium block mb-1">{plan}</span>
                            <div 
                                onClick={() => onStartPractice?.(plan)}
                                className="flex items-center text-blue-500 dark:text-blue-400 text-xs font-bold uppercase tracking-wide cursor-pointer hover:underline mt-1 group-item"
                            >
                                Start Practice <ArrowRight className="w-3 h-3 ml-1 group-item-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </li>
                  ))}
                  {(!analysis.revisionPlan || analysis.revisionPlan.length === 0) && (
                    <li className="text-slate-500 italic">No revision plan available.</li>
                  )}
                </ul>
             </div>
          </div>

          {/* Detailed Solutions */}
          <div className="lg:col-span-12 glass-card p-8 rounded-3xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 pb-4 border-b border-slate-200 dark:border-slate-700/50">
              <Sparkles className="w-5 h-5 text-yellow-500 dark:text-yellow-400" /> Step-by-Step Solutions
            </h3>
            <div className="markdown-body">
               <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                 {analysis.solutions || "No detailed solutions generated."}
               </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamMaster;