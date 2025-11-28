import React, { useState, useEffect } from 'react';
import { Camera, Brain, MessageSquare, BookOpen, Book, Zap, Wifi, Activity, CheckCircle2, Mic } from 'lucide-react';

interface DynamicIslandProps {
  activeTab: string;
  loading?: boolean;
}

const DynamicIsland: React.FC<DynamicIslandProps> = ({ activeTab, loading = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animationState, setAnimationState] = useState<'idle' | 'morph' | 'expanded'>('idle');

  // Trigger animation on tab change
  useEffect(() => {
    setAnimationState('morph');
    setIsExpanded(true);
    
    const timer = setTimeout(() => {
      setAnimationState('expanded');
      // Auto collapse after 2 seconds unless loading
      if (!loading) {
        setTimeout(() => {
           setIsExpanded(false);
           setAnimationState('idle');
        }, 2500);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [activeTab, loading]);

  const getConfig = () => {
    switch (activeTab) {
      case 'exam':
        return {
          icon: <Activity className="w-5 h-5 text-indigo-400" />,
          label: 'Exam Master',
          sub: 'Ready to Analyze',
          color: 'bg-indigo-500',
          width: 'w-[200px]',
          expandedWidth: 'w-[320px]'
        };
      case 'cam':
        return {
          icon: <Camera className="w-5 h-5 text-purple-400" />,
          label: 'MathCam AR',
          sub: 'Vision System Active',
          color: 'bg-purple-500',
          width: 'w-[180px]',
          expandedWidth: 'w-[300px]'
        };
      case 'prof':
        return {
          icon: <Brain className="w-5 h-5 text-pink-400" />,
          label: 'Professor AI',
          sub: 'Knowledge Base Ready',
          color: 'bg-pink-500',
          width: 'w-[190px]',
          expandedWidth: 'w-[310px]'
        };
      case 'solver':
        return {
          icon: <MessageSquare className="w-5 h-5 text-cyan-400" />,
          label: 'AI Solver',
          sub: 'Listening for Query...',
          color: 'bg-cyan-500',
          width: 'w-[180px]',
          expandedWidth: 'w-[340px]'
        };
      case 'sheet':
        return {
          icon: <BookOpen className="w-5 h-5 text-green-400" />,
          label: 'Worksheets',
          sub: 'Generator Online',
          color: 'bg-green-500',
          width: 'w-[190px]',
          expandedWidth: 'w-[300px]'
        };
      case 'notebook':
        return {
          icon: <Book className="w-5 h-5 text-orange-400" />,
          label: 'Notebook Sync',
          sub: 'Graphing Engine Idle',
          color: 'bg-orange-500',
          width: 'w-[200px]',
          expandedWidth: 'w-[320px]'
        };
      default:
        return {
          icon: <Zap className="w-5 h-5 text-white" />,
          label: 'EduVision',
          sub: 'System Ready',
          color: 'bg-white',
          width: 'w-[160px]',
          expandedWidth: 'w-[280px]'
        };
    }
  };

  const config = getConfig();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex justify-center pointer-events-none">
      <div 
        className={`
          relative bg-black border border-white/10 shadow-2xl shadow-black/50 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]
          ${isExpanded ? `h-16 ${config.expandedWidth} rounded-[2rem]` : `h-9 ${config.width} rounded-full`}
        `}
      >
        {/* Background Glow */}
        <div className={`absolute inset-0 opacity-20 ${config.color} blur-xl transition-opacity duration-500 ${isExpanded ? 'opacity-20' : 'opacity-0'}`}></div>

        <div className="relative h-full w-full flex items-center justify-between px-1">
            
            {/* Left Content (Icon) */}
            <div className={`flex items-center justify-center transition-all duration-300 ${isExpanded ? 'ml-4 scale-110' : 'ml-2 scale-100'}`}>
               {activeTab === 'solver' && isExpanded ? (
                   <div className="flex gap-0.5 items-end h-5">
                       <div className="w-1 bg-cyan-400 animate-[pulse_0.6s_ease-in-out_infinite] h-3 rounded-full"></div>
                       <div className="w-1 bg-cyan-400 animate-[pulse_0.8s_ease-in-out_infinite_0.1s] h-5 rounded-full"></div>
                       <div className="w-1 bg-cyan-400 animate-[pulse_0.5s_ease-in-out_infinite_0.2s] h-2 rounded-full"></div>
                       <div className="w-1 bg-cyan-400 animate-[pulse_0.7s_ease-in-out_infinite_0.3s] h-4 rounded-full"></div>
                   </div>
               ) : (
                   config.icon
               )}
            </div>

            {/* Center Content (Collapsed Text) */}
            <div 
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                    isExpanded ? 'opacity-0 scale-90 blur-sm' : 'opacity-100 scale-100 blur-0'
                }`}
            >
                <span className="text-xs font-bold text-white tracking-wide">{config.label}</span>
            </div>

            {/* Expanded Content */}
            <div 
                className={`flex-1 flex flex-col justify-center ml-4 transition-all duration-300 ${
                    isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 absolute'
                }`}
            >
                <span className="text-sm font-bold text-white leading-none">{config.label}</span>
                <span className="text-[10px] text-slate-400 leading-none mt-1 font-medium">{config.sub}</span>
            </div>

            {/* Right Status Indicator */}
            <div className={`mr-2 transition-all duration-500 ${isExpanded ? 'mr-4' : 'mr-1'}`}>
                {activeTab === 'cam' && isExpanded ? (
                    <div className="w-6 h-6 rounded-full border-2 border-purple-500 flex items-center justify-center animate-pulse">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    </div>
                ) : (
                    <div className={`w-2 h-2 rounded-full ${isExpanded ? 'bg-green-500' : 'bg-white/20'}`}></div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicIsland;