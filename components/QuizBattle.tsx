import React, { useState, useEffect } from 'react';
import { generateQuizQuestion } from '../services/geminiService';
import { QuizQuestion } from '../types';
import { Swords, Trophy, Flame, Timer, Heart, AlertTriangle, CheckCircle, XCircle, ChevronDown, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const SYLLABUS: Record<string, string[]> = {
    "Grade 9": ["Number Systems", "Polynomials", "Coordinate Geometry", "Linear Equations", "Lines and Angles", "Triangles", "Circles", "Surface Areas and Volumes", "Statistics", "Probability", "Full Portion"],
    "Grade 10": ["Real Numbers", "Polynomials", "Quadratic Equations", "Arithmetic Progressions", "Triangles", "Coordinate Geometry", "Trigonometry", "Circles", "Areas Related to Circles", "Surface Areas and Volumes", "Statistics", "Probability", "Full Portion"],
    "Grade 11": ["Sets", "Relations and Functions", "Trigonometric Functions", "Complex Numbers", "Linear Inequalities", "Permutations and Combinations", "Binomial Theorem", "Sequences and Series", "Straight Lines", "Conic Sections", "Limits and Derivatives", "Statistics", "Probability", "Full Portion"],
    "Grade 12": ["Relations and Functions", "Inverse Trigonometric Functions", "Matrices", "Determinants", "Continuity and Differentiability", "Application of Derivatives", "Integrals", "Application of Integrals", "Differential Equations", "Vector Algebra", "Three Dimensional Geometry", "Linear Programming", "Probability", "Full Portion"],
    "College": ["Calculus I", "Calculus II", "Linear Algebra", "Differential Equations", "Discrete Math", "Statistics & Probability", "Full Portion"]
};

const QuizBattle: React.FC = () => {
    const [gameState, setGameState] = useState<'lobby' | 'playing' | 'result'>('lobby');
    const [selectedGrade, setSelectedGrade] = useState<string>('Grade 10');
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [question, setQuestion] = useState<QuizQuestion | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [health, setHealth] = useState(3);
    const [resultMessage, setResultMessage] = useState('');
    
    // Persistent Stats
    const [totalXP, setTotalXP] = useState(0);
    const [highScore, setHighScore] = useState(0);

    // Load stats from LocalStorage on mount
    useEffect(() => {
        const savedXP = localStorage.getItem('eduVision_totalXP');
        const savedHighScore = localStorage.getItem('eduVision_highScore');
        if (savedXP) setTotalXP(parseInt(savedXP));
        if (savedHighScore) setHighScore(parseInt(savedHighScore));
    }, []);

    // Save stats whenever they change
    useEffect(() => {
        localStorage.setItem('eduVision_totalXP', totalXP.toString());
        localStorage.setItem('eduVision_highScore', highScore.toString());
    }, [totalXP, highScore]);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (gameState === 'playing' && timeLeft > 0 && !selectedOption) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && gameState === 'playing') {
            handleGameOver("Time's Up!");
        }
        return () => clearInterval(timer);
    }, [timeLeft, gameState, selectedOption]);

    const startGame = async (topic: string) => {
        setSelectedTopic(topic);
        setLoading(true);
        try {
            const q = await generateQuizQuestion(topic, selectedGrade);
            setQuestion(q);
            setGameState('playing');
            setTimeLeft(30);
            setSelectedOption(null);
        } catch (e) {
            alert("Failed to start battle");
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = async (option: string) => {
        if (selectedOption || !question) return;
        setSelectedOption(option);
        
        const isCorrect = option === question.correctAnswer;
        if (isCorrect) {
            const points = 100 + (streak * 10);
            setScore(prev => prev + points);
            setTotalXP(prev => prev + points); // Update total lifetime XP
            
            setStreak(prev => prev + 1);
            setResultMessage(`Critical Hit! +${points} XP`);
            setTimeout(nextRound, 2000);
        } else {
            setHealth(prev => prev - 1);
            setStreak(0);
            setResultMessage('Missed! You took damage.');
            if (health - 1 <= 0) {
                setTimeout(() => handleGameOver("Defeated!"), 2000);
            } else {
                setTimeout(nextRound, 3000);
            }
        }
    };

    const nextRound = async () => {
        setLoading(true);
        setSelectedOption(null);
        setResultMessage('');
        try {
            const q = await generateQuizQuestion(selectedTopic, selectedGrade);
            setQuestion(q);
            setTimeLeft(30);
        } catch (e) {
            handleGameOver("Error generating enemy");
        } finally {
            setLoading(false);
        }
    };

    const handleGameOver = async (reason: string) => {
        setGameState('result');
        setResultMessage(reason);
        if (score > highScore) {
            setHighScore(score);
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col relative overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-900 border border-white dark:border-slate-800 shadow-2xl">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-slate-100 to-white dark:from-indigo-900/40 dark:via-slate-900 dark:to-black pointer-events-none"></div>

            {/* Header HUD */}
            <div className="relative z-10 flex justify-between items-center p-6 border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800/50 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                        <Heart className={`w-5 h-5 ${health > 1 ? 'text-red-500 fill-red-500' : 'text-slate-300 dark:text-slate-600'}`} />
                        <Heart className={`w-5 h-5 ${health > 2 ? 'text-red-500 fill-red-500' : 'text-slate-300 dark:text-slate-600'}`} />
                        <Heart className={`w-5 h-5 ${health > 0 ? 'text-red-500 fill-red-500' : 'text-slate-300 dark:text-slate-600'}`} />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-yellow-500 dark:text-yellow-400 font-bold font-mono text-lg leading-none">
                            <Trophy className="w-5 h-5" /> {score} XP
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                            High: {highScore}
                        </div>
                    </div>
                </div>
                
                {gameState === 'playing' ? (
                    <div className={`text-2xl font-black font-mono flex items-center gap-2 ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-slate-700 dark:text-white'}`}>
                        <Timer className="w-6 h-6" /> {timeLeft}s
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-slate-400 dark:text-white/50 font-bold tracking-wider">
                            <Flame className="w-4 h-4 text-orange-500" />
                            <span>Total XP: {totalXP}</span>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 text-orange-500 dark:text-orange-400 font-bold">
                    <Flame className={`w-5 h-5 ${streak > 2 ? 'animate-bounce' : ''}`} /> x{streak} Combo
                </div>
            </div>

            {/* Game Content */}
            <div className="relative z-10 flex-1 flex items-center justify-center p-6 overflow-y-auto">
                {gameState === 'lobby' && (
                    <div className="w-full max-w-4xl space-y-8 animate-fade-in-up">
                        <div className="text-center space-y-4">
                            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl rotate-3 mx-auto flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                                <Swords className="w-12 h-12 text-white" />
                            </div>
                            <div>
                                <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Quiz Battle</h2>
                                <p className="text-slate-500 dark:text-slate-400">Select your grade and chapter to challenge the AI.</p>
                            </div>
                        </div>

                        {/* Grade Selection */}
                        <div className="glass-card p-2 rounded-2xl flex justify-center bg-white dark:bg-slate-800/50">
                            <div className="relative inline-block text-left w-full max-w-xs">
                                <select 
                                    value={selectedGrade}
                                    onChange={(e) => setSelectedGrade(e.target.value)}
                                    className="w-full appearance-none bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:border-indigo-500 font-bold text-lg text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                                >
                                    {Object.keys(SYLLABUS).map(grade => (
                                        <option key={grade} value={grade}>{grade}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 dark:text-slate-400">
                                    <ChevronDown className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                        
                        {/* Chapter Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 pb-10 scrollbar-hide">
                            {SYLLABUS[selectedGrade].map((topic) => (
                                <button
                                    key={topic}
                                    onClick={() => startGame(topic)}
                                    disabled={loading}
                                    className={`p-4 rounded-xl border text-left transition-all hover:scale-105 active:scale-95 flex flex-col justify-between h-32 group ${
                                        topic === "Full Portion" 
                                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400/50 hover:shadow-lg hover:shadow-indigo-500/40 col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4' 
                                        : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-indigo-300 dark:hover:border-slate-500'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className={`font-bold ${topic === "Full Portion" ? "text-2xl text-white" : "text-slate-700 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300"}`}>
                                            {topic}
                                        </span>
                                        {topic === "Full Portion" ? <Swords className="w-6 h-6 text-white/50" /> : <BookOpen className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" />}
                                    </div>
                                    <span className={`text-xs uppercase tracking-wider font-bold mt-auto ${topic === "Full Portion" ? "text-indigo-100" : "text-slate-400 dark:text-slate-500"}`}>
                                        {loading ? "Loading..." : "Start Quiz"}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {gameState === 'playing' && question && (
                    <div className="w-full max-w-3xl space-y-8 animate-slide-up">
                        <div className="flex justify-center mb-4">
                            <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-200 dark:border-indigo-500/30">
                                {selectedGrade} • {selectedTopic}
                            </span>
                        </div>

                        <div className="glass-card p-8 rounded-3xl border border-indigo-200 dark:border-indigo-500/30 shadow-2xl shadow-indigo-500/10 text-center bg-white/80 dark:bg-slate-900/50">
                            <div className="markdown-body">
                                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-snug">
                                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {question.question}
                                    </ReactMarkdown>
                                </h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(question.options || []).map((option, idx) => {
                                const isSelected = selectedOption === option;
                                const isCorrect = option === question.correctAnswer;
                                const showStatus = !!selectedOption;
                                
                                let btnClass = "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200";
                                if (showStatus) {
                                    if (isCorrect) btnClass = "bg-green-100 dark:bg-green-500/20 border-green-500 text-green-700 dark:text-green-200";
                                    else if (isSelected) btnClass = "bg-red-100 dark:bg-red-500/20 border-red-500 text-red-700 dark:text-red-200";
                                    else btnClass = "bg-slate-100 dark:bg-slate-900 opacity-50";
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(option)}
                                        disabled={!!selectedOption}
                                        className={`p-6 rounded-2xl border-2 text-lg font-bold transition-all transform active:scale-95 flex items-center justify-between group ${btnClass}`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-black/5 dark:bg-black/20 flex items-center justify-center text-sm opacity-70">{['A','B','C','D'][idx]}</span>
                                            <div className="inline-block">
                                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                    {option}
                                                </ReactMarkdown>
                                            </div>
                                        </span>
                                        {showStatus && isCorrect && <CheckCircle className="w-6 h-6 text-green-500" />}
                                        {showStatus && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-red-500" />}
                                    </button>
                                )
                            })}
                        </div>
                        
                        {resultMessage && (
                            <div className="text-center animate-bounce font-bold text-xl text-slate-800 dark:text-white drop-shadow-lg">
                                {resultMessage}
                            </div>
                        )}
                        
                        {selectedOption && (
                            <div className="glass-panel p-4 rounded-xl text-slate-700 dark:text-slate-300 text-sm animate-fade-in-up bg-white/50 dark:bg-slate-800/50">
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold uppercase text-xs block mb-1">Explanation</span>
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {question.explanation}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                )}

                {gameState === 'result' && (
                    <div className="text-center max-w-md space-y-6 animate-fade-in-up">
                         <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full mx-auto flex items-center justify-center border-4 border-slate-200 dark:border-slate-700">
                            {health > 0 ? <Trophy className="w-12 h-12 text-yellow-500 dark:text-yellow-400" /> : <AlertTriangle className="w-12 h-12 text-red-500 dark:text-red-400" />}
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2">{health > 0 ? "Victory!" : "Game Over"}</h2>
                            <p className="text-slate-500 dark:text-slate-400">{resultMessage}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <div className="text-xs text-slate-500 uppercase font-bold">Total Score</div>
                                <div className="text-2xl font-mono text-slate-900 dark:text-white">{score}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <div className="text-xs text-slate-500 uppercase font-bold">Max Streak</div>
                                <div className="text-2xl font-mono text-orange-500 dark:text-orange-400">{streak}</div>
                            </div>
                        </div>

                        <button 
                            onClick={() => { setGameState('lobby'); setHealth(3); setScore(0); setStreak(0); }}
                            className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors"
                        >
                            Play Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizBattle;