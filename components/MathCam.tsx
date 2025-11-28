import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, Zap, BookOpen, AlertTriangle, RefreshCw, Scan, XCircle, Lock, RotateCcw, VideoOff } from 'lucide-react';
import { analyzeFrame } from '../services/geminiService';
import { CameraAnalysisResult } from '../types';

const MathCam: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null); // dedicated ref for cleanup
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [mode, setMode] = useState<'solver' | 'teacher'>('solver');
  const [result, setResult] = useState<CameraAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoCapture, setAutoCapture] = useState(false);

  // Robust cleanup function
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop(); // Stop the hardware stream
        track.enabled = false;
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera(); // Ensure any previous stream is closed first
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera API is not supported in this browser.");
        return;
    }

    try {
      let stream: MediaStream;
      
      try {
          // Attempt to get the rear camera
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
      } catch (e: any) {
          // Fallback to default camera if specific constraint fails (e.g. laptop)
          if (e.name === 'OverconstrainedError' || e.name === 'ConstraintNotSatisfiedError') {
              console.warn("Rear camera not found, falling back to default.");
              stream = await navigator.mediaDevices.getUserMedia({ video: true });
          } else {
              throw e;
          }
      }
      
      streamRef.current = stream; // Store for cleanup

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      } else {
        // Cleanup if component unmounted during async call
        stopCamera();
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      const errorMessage = err?.message || err?.toString() || "";

      // Comprehensive error categorization
      if (
          err.name === 'NotAllowedError' || 
          err.name === 'PermissionDeniedError' || 
          errorMessage.toLowerCase().includes('denied') || 
          errorMessage.toLowerCase().includes('dismissed') ||
          errorMessage.toLowerCase().includes('permission')
      ) {
        setCameraError("PERMISSION_DENIED");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError("NO_CAMERA_FOUND");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError("CAMERA_IN_USE");
      } else {
        setCameraError("GENERIC_ERROR");
      }
      
      setIsStreaming(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera();
    // Aggressive cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing || !isStreaming) return;
    
    setIsAnalyzing(true);
    try {
        const context = canvasRef.current.getContext('2d');
        if (context) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0);
          
          const base64Data = canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
          const data = await analyzeFrame(base64Data, mode);
          setResult(data);
        }
    } catch (e) {
        console.error("Analysis failed", e);
    } finally {
        setIsAnalyzing(false);
    }
  }, [mode, isAnalyzing, isStreaming]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (autoCapture && isStreaming && !cameraError) {
      interval = setInterval(() => {
        captureAndAnalyze();
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [autoCapture, captureAndAnalyze, isStreaming, cameraError]);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col relative overflow-hidden rounded-3xl bg-black border border-slate-800 shadow-2xl">
       
       {/* Main Camera Viewport */}
       <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-slate-900 group">
        {cameraError ? (
             <div className="text-center p-8 max-w-md z-20 glass-card rounded-2xl border-red-500/20 shadow-2xl shadow-red-900/20 m-4">
                {cameraError === "PERMISSION_DENIED" ? (
                    <>
                        <div className="bg-red-500/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                            <Lock className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Camera Access Denied</h3>
                        <div className="text-left bg-black/40 p-4 rounded-xl mb-6 text-sm text-slate-300 space-y-3 border border-slate-700">
                             <p className="flex gap-2">
                                <span className="text-white font-bold bg-slate-700 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span> 
                                <span>Click the <b>Lock Icon</b> 🔒 in your browser's address bar.</span>
                             </p>
                             <p className="flex gap-2">
                                <span className="text-white font-bold bg-slate-700 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span> 
                                <span>Find <b>Camera</b> and toggle it ON or click 'Reset Permission'.</span>
                             </p>
                             <p className="flex gap-2">
                                <span className="text-white font-bold bg-slate-700 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span> 
                                <span>Refresh this page.</span>
                             </p>
                        </div>
                        <button onClick={() => window.location.reload()} className="w-full px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500 transition-colors flex items-center justify-center gap-2 shadow-lg">
                            <RotateCcw className="w-5 h-5" /> Reload Page
                        </button>
                    </>
                ) : cameraError === "CAMERA_IN_USE" ? (
                    <>
                         <div className="bg-orange-500/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-orange-500/30">
                             <VideoOff className="w-10 h-10 text-orange-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Camera In Use</h3>
                        <p className="text-slate-400 mb-6">Your camera is being used by another application or tab. Please close it and try again.</p>
                        <button 
                            onClick={startCamera}
                            className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-500 transition-colors flex items-center justify-center gap-2 mx-auto shadow-lg"
                        >
                            <RefreshCw className="w-5 h-5" /> Retry
                        </button>
                    </>
                ) : (
                    <>
                         <div className="bg-red-500/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                             <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Camera Unavailable</h3>
                        <p className="text-slate-400 mb-6">{cameraError === "NO_CAMERA_FOUND" ? "No camera device found on your system." : "Unable to access camera stream."}</p>
                        <button 
                            onClick={startCamera}
                            className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500 transition-colors flex items-center justify-center gap-2 mx-auto shadow-lg shadow-red-500/20"
                        >
                            <RefreshCw className="w-5 h-5" /> Retry Access
                        </button>
                    </>
                )}
            </div>
        ) : (
            <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="absolute w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* HUD Overlay - Sci-Fi Scanning Effect */}
                {isStreaming && (
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Scan Line */}
                        <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50 animate-scan top-0"></div>
                        
                        {/* Corner Reticles */}
                        <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg"></div>
                        <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg"></div>
                        <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg"></div>
                        <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-cyan-400 rounded-br-lg"></div>

                        {/* Center Focus Box */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/20 rounded-2xl flex items-center justify-center backdrop-blur-[2px]">
                             <div className="w-60 h-60 border border-white/10 rounded-xl"></div>
                             {/* Crosshair */}
                             <div className="absolute w-4 h-0.5 bg-cyan-400/50"></div>
                             <div className="absolute h-4 w-0.5 bg-cyan-400/50"></div>
                             
                             {isAnalyzing && (
                                 <div className="absolute -bottom-10 flex flex-col items-center">
                                     <div className="w-32 h-1 bg-slate-700 rounded-full overflow-hidden mb-2">
                                         <div className="h-full bg-cyan-400 animate-progress"></div>
                                     </div>
                                     <span className="text-xs font-mono font-bold text-cyan-400 tracking-widest animate-pulse">PROCESSING DATA</span>
                                 </div>
                             )}
                        </div>
                    </div>
                )}
            </>
        )}

        {/* Top Controls Bar */}
        <div className="absolute top-6 left-6 right-6 flex justify-between z-30">
            <div className="glass-panel rounded-full p-1.5 flex space-x-1 backdrop-blur-md">
                <button 
                    onClick={() => setMode('solver')}
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'solver' ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                >
                    Solver
                </button>
                <button 
                    onClick={() => setMode('teacher')}
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'teacher' ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                >
                    Teacher Mode
                </button>
            </div>
            
            <button 
                onClick={() => setAutoCapture(!autoCapture)}
                disabled={!!cameraError}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all border ${
                    autoCapture 
                    ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                    : 'bg-black/40 border-slate-600 text-slate-300 hover:bg-slate-800'
                } ${!!cameraError ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <Zap className={`w-4 h-4 ${autoCapture ? 'fill-current' : ''}`} />
                {autoCapture ? 'LIVE ON' : 'LIVE OFF'}
            </button>
        </div>
      </div>

      {/* Results / Data Panel */}
      <div className="bg-slate-900/90 backdrop-blur-xl border-t border-slate-700/50 p-0 min-h-[30%] max-h-[50%] overflow-y-auto z-20 transition-all duration-500">
        {!result ? (
             <div className="flex flex-col items-center justify-center h-full py-12 text-slate-500">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 border border-slate-700">
                    <Scan className="w-8 h-8 opacity-50" />
                </div>
                {cameraError ? (
                    <p className="font-medium">Camera unavailable.</p>
                ) : (
                    <>
                        <p className="font-medium mb-4">Align equation in box to solve</p>
                        <button 
                            onClick={captureAndAnalyze}
                            disabled={!isStreaming}
                            className={`px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-cyan-50 shadow-lg transition-transform active:scale-95 flex items-center gap-2 ${!isStreaming ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Camera className="w-5 h-5" /> Snap Solution
                        </button>
                    </>
                )}
             </div>
        ) : (
            <div className="p-6 relative">
                 <button 
                    onClick={() => setResult(null)} 
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                >
                    <XCircle className="w-6 h-6" />
                </button>

                <div className="animate-slide-up space-y-5">
                {mode === 'teacher' ? (
                     <div className="p-6 bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/30 rounded-2xl shadow-lg shadow-purple-900/20">
                         <h3 className="text-purple-300 font-bold flex items-center mb-3 text-sm tracking-wider uppercase">
                            <BookOpen className="w-5 h-5 mr-2" /> Pedagogical Hint
                         </h3>
                         <p className="text-white text-xl leading-relaxed font-medium">{result.hint || result.rawTextResponse}</p>
                         {result.errorDetected && (
                             <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                                 <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                 <div>
                                     <span className="text-red-400 font-bold block text-sm mb-1">Error Detected</span>
                                     <p className="text-red-200 text-sm">{result.errorDetected}</p>
                                 </div>
                             </div>
                         )}
                     </div>
                ) : (
                    <div className="space-y-6">
                        <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/30 rounded-2xl shadow-lg shadow-cyan-900/20">
                            <h3 className="text-cyan-300 font-bold mb-3 text-xs uppercase tracking-widest">Identified Equation</h3>
                            <p className="text-3xl text-white font-mono">{result.solvedEquation}</p>
                        </div>
                        {result.steps && (
                             <div className="space-y-3">
                                 <h3 className="text-slate-400 font-bold text-sm uppercase tracking-wider pl-1">Step-by-Step Solution</h3>
                                 {result.steps.map((step, i) => (
                                     <div key={i} className="flex items-start bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                         <span className="bg-cyan-900/50 text-cyan-300 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3 flex-shrink-0 mt-0.5 border border-cyan-500/20">{i+1}</span>
                                         <p className="text-slate-200">{step}</p>
                                     </div>
                                 ))}
                             </div>
                        )}
                        {!result.steps && <p className="text-slate-300 p-4">{result.rawTextResponse}</p>}
                    </div>
                )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default MathCam;