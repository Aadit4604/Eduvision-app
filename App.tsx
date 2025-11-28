import React, { useState, useEffect } from 'react';
import { Layout, Camera, Brain, BookOpen, Menu, X, Book, MessageSquare, Sun, Moon, GraduationCap, Palette, Check, Swords, Calculator } from 'lucide-react';
import ExamMaster from './components/ExamMaster';
import MathCam from './components/MathCam';
import Professor from './components/Professor';
import WorksheetGen from './components/WorksheetGen';
import NotebookSync from './components/NotebookSync';
import SolverChat from './components/SolverChat';
import QuizBattle from './components/QuizBattle';
import CalculatorWidget from './components/CalculatorWidget';
import Sidebar from './components/Sidebar';
import AuthModal from './components/AuthModal';
import WelcomeModal from './components/WelcomeModal';
import { supabase } from './lib/supabase';
import { ThemeConfig, HistoryItem } from './types';

type Tab = 'exam' | 'cam' | 'prof' | 'sheet' | 'notebook' | 'solver' | 'quiz';
type Mode = 'dark' | 'light';

// Theme Definitions
const THEMES: ThemeConfig[] = [
  {
    id: 'nebula',
    name: 'Nebula',
    colors: {
      primary: '#6366f1',   // Indigo
      secondary: '#a855f7', // Purple
      accent: '#ec4899',    // Pink
      info: '#06b6d4',      // Cyan
      success: '#10b981',   // Emerald
    },
    gradient: 'from-indigo-500 via-purple-500 to-pink-500'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      primary: '#f43f5e',   // Rose (Red-Pink) - Distinct from Orange
      secondary: '#f97316', // Orange
      accent: '#8b5cf6',    // Violet - Adds the "Dusk" feel
      info: '#fbbf24',      // Amber
      success: '#10b981',   // Emerald
    },
    gradient: 'from-rose-500 via-orange-500 to-violet-600'
  },
  {
    id: 'ocean',
    name: 'Oceanic',
    colors: {
      primary: '#3b82f6',   // Blue
      secondary: '#06b6d4', // Cyan
      accent: '#14b8a6',    // Teal
      info: '#0ea5e9',      // Sky
      success: '#22c55e',   // Green
    },
    gradient: 'from-blue-500 via-cyan-500 to-teal-500'
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      primary: '#10b981',   // Emerald
      secondary: '#22c55e', // Green
      accent: '#84cc16',    // Lime
      info: '#14b8a6',      // Teal
      success: '#3b82f6',   // Blue
    },
    gradient: 'from-emerald-500 via-green-500 to-lime-500'
  },
  {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      primary: '#64748b',   // Slate
      secondary: '#475569', // Dark Slate
      accent: '#94a3b8',    // Light Slate
      info: '#38bdf8',      // Sky
      success: '#4ade80',   // Green
    },
    gradient: 'from-slate-600 via-slate-800 to-black'
  },
  {
    id: 'coffee',
    name: 'Coffee',
    colors: {
      primary: '#78350f',   // Amber-900 (Espresso) - Very Dark Brown
      secondary: '#a8a29e', // Stone-400 (Grey/Beige)
      accent: '#57534e',    // Stone-600 (Dark Grey)
      info: '#d6d3d1',      // Stone-300
      success: '#65a30d',   // Lime
    },
    gradient: 'from-stone-600 via-amber-900 to-stone-800' // Earthy, Desaturated
  },
  {
    id: 'mint',
    name: 'Mint',
    colors: {
      primary: '#2dd4bf',   // Teal
      secondary: '#14b8a6', // Dark Teal
      accent: '#99f6e4',    // Light Teal
      info: '#0ea5e9',      // Sky
      success: '#22c55e',   // Green
    },
    gradient: 'from-teal-400 via-emerald-400 to-cyan-400'
  },
  {
    id: 'cyber',
    name: 'Cyber',
    colors: {
      primary: '#06b6d4',   // Cyan (Electric Blue) - No longer Yellow
      secondary: '#d946ef', // Fuchsia (Neon Pink)
      accent: '#facc15',    // Neon Yellow
      info: '#a855f7',      // Purple
      success: '#22c55e',   // Green
    },
    gradient: 'from-cyan-500 via-fuchsia-500 to-yellow-400' // High Contrast Neon
  }
];

// Helper to convert Hex to RGB space-separated string
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : '0 0 0';
};

const generateShades = (hex: string, name: string) => {
    const rgb = hexToRgb(hex);
    let style = '';
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].forEach(shade => {
        style += `--color-${name}-${shade}: ${rgb};\n`;
    });
    return style;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('exam');
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  
  // Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Auth & Onboarding State
  const [authOpen, setAuthOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true); 
  const [user, setUser] = useState<any>(null);

  // New state to pre-fill worksheet topic
  const [prefillTopic, setPrefillTopic] = useState<string>('');

  // Derived User ID for Storage Scope
  const userId = user ? user.id : 'guest';

  // Initialize State from LocalStorage
  const [mode, setMode] = useState<Mode>(() => {
      const saved = localStorage.getItem('eduVision_mode');
      return (saved as Mode) || 'dark';
  });

  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(() => {
      const savedId = localStorage.getItem('eduVision_themeId');
      return THEMES.find(t => t.id === savedId) || THEMES[0];
  });

  // Check Supabase Auth
  useEffect(() => {
    if (supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) setShowWelcome(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) setShowWelcome(false);
        });

        return () => subscription.unsubscribe();
    }
  }, []);

  // Load History Metadata (Scoped by User)
  useEffect(() => {
      // Key includes userId to separate guest/user data
      const historyKey = `eduVision_history_${userId}`;
      const savedHistory = localStorage.getItem(historyKey);
      
      if (savedHistory) {
          try {
              setHistoryItems(JSON.parse(savedHistory));
          } catch (e) { console.error(e); }
      } else {
          setHistoryItems([]);
      }
      
      // Always start fresh session when switching users if none selected
      startNewSession();
  }, [userId]); // Re-run when user changes

  // Save History Metadata (Scoped by User)
  useEffect(() => {
      if (historyItems.length > 0 || userId === 'guest') {
        const historyKey = `eduVision_history_${userId}`;
        localStorage.setItem(historyKey, JSON.stringify(historyItems));
      }
  }, [historyItems, userId]);

  // Apply Theme Variables
  useEffect(() => {
    const root = window.document.documentElement;
    let cssVariables = '';
    cssVariables += generateShades(currentTheme.colors.primary, 'primary');
    cssVariables += generateShades(currentTheme.colors.secondary, 'secondary');
    cssVariables += generateShades(currentTheme.colors.accent, 'accent');
    cssVariables += generateShades(currentTheme.colors.info, 'info');
    cssVariables += generateShades(currentTheme.colors.success, 'success');

    const styleId = 'theme-styles';
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = `:root { ${cssVariables} }`;
    localStorage.setItem('eduVision_themeId', currentTheme.id);
  }, [currentTheme]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (mode === 'dark') {
        root.classList.add('dark');
        document.body.style.backgroundColor = '#0B0F19';
    } else {
        root.classList.remove('dark');
        document.body.style.backgroundColor = '#f8fafc';
    }
    localStorage.setItem('eduVision_mode', mode);
  }, [mode]);

  // Session Management
  const startNewSession = () => {
      const newId = Date.now().toString();
      setCurrentSessionId(newId);
  };

  const updateHistory = (id: string, title: string) => {
      setHistoryItems(prev => {
          const exists = prev.find(i => i.id === id);
          if (exists) {
              return prev.map(i => i.id === id ? { ...i, title, timestamp: Date.now() } : i);
          }
          return [{
              id, 
              title, 
              timestamp: Date.now(), 
              type: activeTab as any 
          }, ...prev];
      });
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setHistoryItems(prev => prev.filter(i => i.id !== id));
      // Clear data specific to this user/session
      localStorage.removeItem(`exam_data_${userId}_${id}`);
      localStorage.removeItem(`notebook_data_${userId}_${id}`);
      localStorage.removeItem(`prof_data_${userId}_${id}`);
      localStorage.removeItem(`solver_data_${userId}_${id}`);
      
      if (currentSessionId === id) {
          startNewSession();
      }
  };

  // Handler to switch to worksheet tab and set topic
  const handleStartPractice = (topic: string) => {
      setPrefillTopic(topic);
      setActiveTab('sheet');
  };

  const handleLogout = async () => {
      if (supabase) {
          await supabase.auth.signOut();
          setUser(null);
          // State cleanup happens via useEffect dependency on userId
          setShowWelcome(true); 
      }
  };

  const navItems = [
    { id: 'exam', label: 'Exam Master', icon: Layout, color: 'text-primary-500 dark:text-primary-400', desc: 'Analyzer' },
    { id: 'cam', label: 'MathCam AR', icon: Camera, color: 'text-purple-500 dark:text-purple-400', desc: 'Vision' },
    { id: 'prof', label: 'Professor', icon: Brain, color: 'text-pink-500 dark:text-pink-400', desc: 'Tutor' },
    { id: 'solver', label: 'AI Solver', icon: MessageSquare, color: 'text-cyan-500 dark:text-cyan-400', desc: 'Chat' },
    { id: 'quiz', label: 'Quiz Battle', icon: Swords, color: 'text-red-500 dark:text-red-400', desc: 'Game' },
    { id: 'sheet', label: 'Worksheets', icon: BookOpen, color: 'text-green-500 dark:text-green-400', desc: 'Practice' },
    { id: 'notebook', label: 'Notebook', icon: Book, color: 'text-orange-500 dark:text-orange-400', desc: 'Sync' },
  ];

  const toggleMode = () => {
    setMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-500 ${mode === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
      
      {/* Welcome Modal */}
      {showWelcome && !user && (
          <WelcomeModal 
            onLogin={() => { setShowWelcome(false); setAuthOpen(true); }} 
            onGuest={() => setShowWelcome(false)}
          />
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authOpen} 
        onClose={() => setAuthOpen(false)} 
        onLogin={(u) => { setUser(u); setAuthOpen(false); setShowWelcome(false); }}
      />

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
        activeTab={activeTab}
        historyItems={historyItems}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewSession={startNewSession}
        onDeleteSession={deleteSession}
        user={user}
        onLoginClick={() => setAuthOpen(true)}
        onLogoutClick={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative h-full overflow-hidden min-w-0">
          {/* Ambient Background */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
              <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-10 dark:opacity-20 animate-float bg-primary-600 dark:bg-primary-600`}></div>
              <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-10 dark:opacity-20 animate-float delay-1000 bg-secondary-600 dark:bg-secondary-600`}></div>
          </div>

          {/* Top Navbar */}
          <nav className={`relative z-20 flex-shrink-0 border-b backdrop-blur-md transition-all duration-300 px-6 py-3 flex items-center justify-between ${
              mode === 'dark' 
              ? 'bg-slate-900/80 border-white/5' 
              : 'bg-white/80 border-slate-200'
          }`}>
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setSidebarOpen(true)}
                    className={`lg:hidden p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${sidebarOpen ? 'opacity-0' : 'opacity-100'}`}
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <div className={`absolute inset-0 bg-gradient-to-r ${currentTheme.gradient} rounded-lg blur opacity-70 group-hover:opacity-100 transition-opacity`}></div>
                        <div className={`relative w-8 h-8 rounded-lg border flex items-center justify-center text-white ${mode === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-slate-900 border-transparent'}`}>
                            <GraduationCap className="w-5 h-5" />
                        </div>
                    </div>
                    <span className={`font-bold text-lg hidden sm:block ${mode === 'dark' ? 'text-white' : 'text-slate-900'}`}>EduVision</span>
                </div>
            </div>

            <div className={`hidden xl:flex space-x-1 items-center p-1 rounded-xl border ${mode === 'dark' ? 'bg-slate-800/30 border-white/5' : 'bg-slate-100/50 border-black/5'}`}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as Tab); startNewSession(); }}
                    className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 relative group overflow-hidden ${
                      isActive 
                      ? (mode === 'dark' ? 'bg-slate-700 text-white shadow-lg' : 'bg-white text-slate-900 shadow-md')
                      : (mode === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50')
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 mr-2 ${isActive ? item.color : ''}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="xl:hidden flex-1 mx-4">
                 <select 
                    value={activeTab} 
                    onChange={(e) => { setActiveTab(e.target.value as Tab); startNewSession(); }}
                    className="w-full bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-2 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                 >
                     {navItems.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                 </select>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowThemeModal(!showThemeModal)}
                className={`p-2 rounded-lg transition-all border ${
                    mode === 'dark' 
                    ? `bg-slate-800 border-white/10 text-slate-400 hover:text-primary-400 hover:bg-slate-700 ${showThemeModal ? 'ring-2 ring-primary-500/50' : ''}` 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary-600'
                }`}
              >
                <Palette className="w-4 h-4" />
              </button>

              <button 
                onClick={toggleMode}
                className={`p-2 rounded-lg transition-all border ${
                    mode === 'dark' 
                    ? 'bg-slate-800 border-white/10 text-yellow-400 hover:bg-slate-700' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </nav>

          {/* Theme Modal */}
          {showThemeModal && (
            <div className={`absolute top-16 right-6 w-64 glass-card rounded-2xl p-4 animate-fade-in-up border shadow-2xl z-50 max-h-[70vh] overflow-y-auto ${mode === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                <h3 className="font-bold mb-3 flex items-center gap-2 text-sm">
                    <Palette className="w-4 h-4 text-primary-500" /> Select Theme
                </h3>
                <div className="grid grid-cols-1 gap-2">
                    {THEMES.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => {
                                setCurrentTheme(theme);
                                setShowThemeModal(false);
                            }}
                            className={`flex items-center p-2 rounded-lg transition-all border ${
                                currentTheme.id === theme.id 
                                ? (mode === 'dark' ? 'bg-slate-700/50 border-primary-500/50' : 'bg-slate-100 border-primary-500/50') 
                                : 'bg-transparent border-transparent hover:bg-slate-800/10 dark:hover:bg-slate-800'
                            }`}
                        >
                            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${theme.gradient} mr-3 shadow-sm`}></div>
                            <span className="text-sm font-medium flex-1 text-left">{theme.name}</span>
                            {currentTheme.id === theme.id && <Check className="w-3 h-3 text-primary-500" />}
                        </button>
                    ))}
                </div>
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1 relative z-10 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-7xl mx-auto h-full">
                <div className={`h-full ${activeTab === 'exam' ? 'block' : 'hidden'}`}>
                    <ExamMaster 
                        onStartPractice={handleStartPractice} 
                        sessionId={currentSessionId || 'default'} 
                        userId={userId}
                        onUpdateHistory={updateHistory}
                    />
                </div>
                <div className={`h-full ${activeTab === 'prof' ? 'block' : 'hidden'}`}>
                    <Professor 
                        sessionId={currentSessionId || 'default'} 
                        userId={userId}
                        onUpdateHistory={updateHistory}
                    />
                </div>
                <div className={`h-full ${activeTab === 'solver' ? 'block' : 'hidden'}`}>
                    <SolverChat 
                        sessionId={currentSessionId || 'default'} 
                        userId={userId}
                        onUpdateHistory={updateHistory}
                    />
                </div>
                <div className={`h-full ${activeTab === 'sheet' ? 'block' : 'hidden'}`}>
                    <WorksheetGen initialTopic={prefillTopic} />
                </div>
                <div className={`h-full ${activeTab === 'notebook' ? 'block' : 'hidden'}`}>
                    <NotebookSync 
                        sessionId={currentSessionId || 'default'} 
                        userId={userId}
                        onUpdateHistory={updateHistory}
                    />
                </div>

                {activeTab === 'cam' && (
                    <div className="animate-fade-in-up h-full">
                        <MathCam />
                    </div>
                )}
                {activeTab === 'quiz' && (
                    <div className="animate-fade-in-up h-full">
                        <QuizBattle />
                    </div>
                )}
            </div>
          </main>

          {/* Calculator */}
          {showCalculator && <CalculatorWidget onClose={() => setShowCalculator(false)} />}
          {!showCalculator && (
            <button
              onClick={() => setShowCalculator(true)}
              className="absolute bottom-6 right-6 z-30 p-4 bg-primary-600 hover:bg-primary-500 text-white rounded-full shadow-2xl shadow-primary-500/40 transition-all transform hover:scale-110 group"
              title="Open Calculator"
            >
              <Calculator className="w-6 h-6 group-hover:animate-pulse" />
            </button>
          )}
      </div>
    </div>
  );
};

export default App;