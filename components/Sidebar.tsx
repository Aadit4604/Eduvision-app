import React, { useState } from 'react';
import { Plus, MessageSquare, FileText, Trash2, Clock, ChevronLeft, ChevronRight, Book, GraduationCap, Layout, MoreHorizontal, LogOut, Settings, User as UserIcon, LogIn } from 'lucide-react';
import { HistoryItem } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  activeTab: string;
  historyItems: HistoryItem[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  user: any;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  setIsOpen,
  activeTab,
  historyItems,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  user,
  onLoginClick,
  onLogoutClick
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const getIcon = () => {
    switch (activeTab) {
      case 'exam': return <Layout className="w-4 h-4" />;
      case 'prof': return <GraduationCap className="w-4 h-4" />;
      case 'solver': return <MessageSquare className="w-4 h-4" />;
      case 'notebook': return <Book className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getLabel = () => {
    switch (activeTab) {
        case 'exam': return 'New Exam Scan';
        case 'prof': return 'New Chat';
        case 'solver': return 'New Problem';
        case 'notebook': return 'New Notebook';
        default: return 'New Session';
    }
  };

  const filteredItems = historyItems.filter(item => item.type === activeTab).sort((a, b) => b.timestamp - a.timestamp);

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Root Container (Relative for positioning toggle button) */}
      <div className={`relative z-50 h-full flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'w-72' : 'w-0'}`}>
          
          {/* Animated Sidebar Wrapper (Handles Width & Overflow) */}
          <aside 
            className={`
                h-full bg-slate-900/95 border-r border-white/5 backdrop-blur-xl flex flex-col overflow-hidden
                fixed inset-y-0 left-0 lg:relative
                transition-all duration-300 ease-in-out
                ${isOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-0'}
            `}
          >
            {/* Inner Content (Fixed Width to prevent layout squishing) */}
            <div className="w-72 h-full flex flex-col">
                
                {/* Header / New Button */}
                <div className="p-4">
                    <button 
                        onClick={() => { onNewSession(); if(window.innerWidth < 1024) setIsOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-900/20 group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        <span className="font-bold text-sm whitespace-nowrap">{getLabel()}</span>
                    </button>
                </div>

                {/* History List */}
                <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-hide">
                    <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        History
                    </div>
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-10 px-4 text-slate-600 text-sm whitespace-nowrap">
                            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            No history yet.
                        </div>
                    ) : (
                        filteredItems.map((item) => (
                            <div 
                                key={item.id}
                                onClick={() => { onSelectSession(item.id); if(window.innerWidth < 1024) setIsOpen(false); }}
                                className={`group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                                    currentSessionId === item.id 
                                    ? 'bg-slate-800 text-white border border-slate-700' 
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                                }`}
                            >
                                <div className="flex-shrink-0">{getIcon()}</div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="truncate text-sm font-medium">{item.title}</p>
                                    <p className="text-[10px] opacity-50 truncate">{new Date(item.timestamp).toLocaleDateString()}</p>
                                </div>
                                <button 
                                    onClick={(e) => onDeleteSession(e, item.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer - User Profile (ChatGPT Style) */}
                <div className="p-3 border-t border-white/5 relative">
                    {/* Popover Menu */}
                    {showUserMenu && (
                        <div className="absolute bottom-full left-3 w-64 mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up z-50">
                            <div className="p-1">
                                {user ? (
                                    <>
                                        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:bg-slate-700 rounded-lg text-sm transition-colors text-left">
                                            <Settings className="w-4 h-4" />
                                            Settings
                                        </button>
                                        <div className="h-px bg-slate-700 my-1"></div>
                                        <button 
                                            onClick={() => { onLogoutClick(); setShowUserMenu(false); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors text-left"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Log out
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => { onLoginClick(); setShowUserMenu(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg text-sm transition-colors text-left"
                                    >
                                        <LogIn className="w-4 h-4" />
                                        Log in / Sign up
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Profile Button */}
                    <button 
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-all group ${
                            showUserMenu ? 'bg-slate-800' : 'hover:bg-slate-800/50'
                        }`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                            user ? 'bg-gradient-to-tr from-green-500 to-emerald-500' : 'bg-slate-700'
                        }`}>
                            {user ? (user.email?.[0].toUpperCase() || 'S') : <UserIcon className="w-4 h-4 text-slate-400" />}
                        </div>
                        <div className="flex-1 text-left overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">
                                {user ? (user.user_metadata?.username || user.email?.split('@')[0] || 'Student') : 'Guest Student'}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                                {user ? 'Free Plan' : 'Login to Sync'}
                            </p>
                        </div>
                        <MoreHorizontal className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                    </button>
                </div>
            </div>
          </aside>

          {/* Desktop Toggle Button - Outside the overflow hidden area */}
          <div className="absolute top-1/2 left-full -ml-3 z-50 hidden lg:block">
              <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center justify-center w-6 h-12 bg-slate-800 border border-slate-700 rounded-r-lg text-slate-400 hover:text-white transition-all shadow-lg hover:w-8 hover:bg-slate-700"
                  title={isOpen ? "Close Sidebar" : "Open History"}
              >
                  {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
          </div>
      </div>
    </>
  );
};

export default Sidebar;