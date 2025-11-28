import React from 'react';
import { LogIn, User, Sparkles, GraduationCap } from 'lucide-react';

interface WelcomeModalProps {
  onLogin: () => void;
  onGuest: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onLogin, onGuest }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in-up">
      <div className="glass-card w-full max-w-md p-8 rounded-3xl relative border border-white/10 shadow-2xl text-center overflow-hidden">
        
        {/* Decorative Background Blob */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent animate-spin-slow pointer-events-none"></div>

        <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30 transform rotate-3">
                <GraduationCap className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">EduVision AI</h1>
            <p className="text-slate-400 mb-8 text-lg">Your personal AI tutor for exams, math, and science mastery.</p>

            <div className="space-y-4">
                <button 
                    onClick={onLogin}
                    className="w-full py-4 bg-white text-black font-bold rounded-xl shadow-lg hover:bg-slate-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
                >
                    <LogIn className="w-5 h-5 text-indigo-600 group-hover:translate-x-1 transition-transform" />
                    Log in / Sign up
                </button>
                
                <button 
                    onClick={onGuest}
                    className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-3"
                >
                    <User className="w-5 h-5 text-slate-400" />
                    Continue as Guest
                </button>
            </div>

            <div className="mt-8 flex justify-center gap-6 text-xs text-slate-500 font-medium uppercase tracking-widest">
                <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Solver</span>
                <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Exam Scan</span>
                <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Tutor</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;