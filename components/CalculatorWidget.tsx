import React, { useState, useEffect, useRef } from 'react';
import { X, Calculator, Delete, Equal, Beaker } from 'lucide-react';

interface CalculatorWidgetProps {
  onClose: () => void;
}

const CalculatorWidget: React.FC<CalculatorWidgetProps> = ({ onClose }) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 380, y: 100 });
  const [size, setSize] = useState({ width: 340, height: 520 });
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showScientific, setShowScientific] = useState(false);
  
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState('');
  
  const widgetRef = useRef<HTMLDivElement>(null);

  // Handle Dragging (Header)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (widgetRef.current && !isResizing) {
      e.preventDefault(); // Prevent text selection
      const rect = widgetRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  // Handle Resizing (Bottom-Right Corner)
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent text selection
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      } else if (isResizing && widgetRef.current) {
        e.preventDefault();
        const rect = widgetRef.current.getBoundingClientRect();
        // Constrain resize limits
        const newWidth = Math.max(300, e.clientX - rect.left);
        const newHeight = Math.max(400, e.clientY - rect.top);
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset]);

  // Calculator Logic
  const handlePress = (val: string) => {
    if (val === 'AC') {
      setDisplay('0');
      setHistory('');
    } else if (val === 'DEL') {
      setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (val === '=') {
      try {
        let expression = display
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/\^/g, '**')
            .replace(/π/g, 'Math.PI')
            .replace(/√\(/g, 'Math.sqrt(')
            .replace(/sin\(/g, 'Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(');

        // Safe evaluation
        // eslint-disable-next-line no-new-func
        const result = new Function('return ' + expression)();
        
        // Format to avoid long decimals
        const formatted = String(Math.round(result * 10000000000) / 10000000000);
        setHistory(display + ' =');
        setDisplay(formatted);
      } catch (e) {
        setDisplay('Error');
        setTimeout(() => setDisplay(display), 1000);
      }
    } else if (['sin', 'cos', 'tan', 'sqrt'].includes(val)) {
        setDisplay(prev => prev === '0' ? `${val}(` : `${prev}${val}(`);
    } else {
      const operatorMap: Record<string, string> = { '*': '×', '/': '÷' };
      const displayVal = operatorMap[val] || val;
      
      setDisplay(prev => {
        if (prev === '0' && !['.', '+', '-', '*', '/', '^'].includes(val)) return displayVal;
        return prev + displayVal;
      });
    }
  };

  return (
    <div
      ref={widgetRef}
      style={{ left: position.x, top: position.y, width: size.width, height: size.height }}
      className="fixed z-[100] glass-card rounded-[2rem] overflow-hidden shadow-2xl animate-fade-in-up backdrop-blur-3xl bg-white/80 dark:bg-[#0f172a]/90 border border-white/60 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/5 flex flex-col select-none"
    >
      {/* Header - Draggable Area */}
      <div 
        onMouseDown={handleMouseDown}
        className="bg-gradient-to-b from-white/50 to-transparent dark:from-white/5 dark:to-transparent p-4 flex items-center justify-between cursor-move flex-shrink-0 z-10"
      >
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-sm px-1">
            <div className="p-1.5 bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-500/20 dark:to-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-500/20 shadow-sm">
               <Calculator className="w-4 h-4" /> 
            </div>
            <span className="tracking-wide opacity-80">Calculator</span>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setShowScientific(!showScientific)}
                className={`p-1.5 rounded-lg transition-all ${showScientific ? 'bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400' : 'hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400'}`}
                title="Scientific Mode"
            >
                <Beaker className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
            
            {/* Single Close Button */}
            <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors"
                title="Close Widget"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Display */}
      <div className="px-6 py-2 text-right flex-shrink-0 flex flex-col justify-end h-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-black/20 pointer-events-none"></div>
        <div className="text-slate-400 dark:text-slate-500 text-sm h-6 font-medium tracking-wide flex items-center justify-end gap-1 relative z-10 overflow-hidden text-ellipsis whitespace-nowrap">
             {history && <span className="opacity-60">{history}</span>}
        </div>
        <div className="text-5xl font-light text-slate-800 dark:text-white tracking-tight overflow-x-auto scrollbar-hide py-2 relative z-10 font-mono">
            {display}
        </div>
      </div>

      {/* Keypad - Responsive Layout */}
      <div 
        className={`p-4 bg-slate-50/50 dark:bg-black/20 border-t border-slate-200/50 dark:border-white/5 flex-1 grid gap-2 ${
            showScientific ? 'grid-cols-5 grid-rows-6' : 'grid-cols-4 grid-rows-5'
        }`}
      >
        
        {/* Scientific Row 1 */}
        {showScientific && (
            <>
                <CalcButton label="(" onClick={() => handlePress('(')} className="text-xs font-bold text-secondary-600 dark:text-secondary-400 bg-secondary-50 dark:bg-secondary-500/10" />
                <CalcButton label=")" onClick={() => handlePress(')')} className="text-xs font-bold text-secondary-600 dark:text-secondary-400 bg-secondary-50 dark:bg-secondary-500/10" />
                <CalcButton label="^" onClick={() => handlePress('^')} className="text-xs font-bold text-secondary-600 dark:text-secondary-400 bg-secondary-50 dark:bg-secondary-500/10" />
                <CalcButton label="√" onClick={() => handlePress('sqrt')} className="text-xs font-bold text-secondary-600 dark:text-secondary-400 bg-secondary-50 dark:bg-secondary-500/10" />
                <CalcButton label="π" onClick={() => handlePress('π')} className="text-xs font-bold text-secondary-600 dark:text-secondary-400 bg-secondary-50 dark:bg-secondary-500/10" />
            </>
        )}

        {/* Standard Keys - Row 1 */}
        <CalcButton label="AC" onClick={() => handlePress('AC')} className="text-red-500 dark:text-red-400 font-bold bg-red-50 dark:bg-red-500/10" />
        <CalcButton label="DEL" onClick={() => handlePress('DEL')} className="text-slate-500 dark:text-slate-400" icon={<Delete className="w-5 h-5" />} />
        <CalcButton label="%" onClick={() => handlePress('%')} className="text-primary-600 dark:text-primary-400" />
        <CalcButton label="÷" onClick={() => handlePress('/')} className="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 text-xl" />
        {showScientific && <CalcButton label="sin" onClick={() => handlePress('sin')} className="text-xs font-bold text-secondary-600 dark:text-secondary-400" />}

        {/* Row 2 */}
        <CalcButton label="7" onClick={() => handlePress('7')} />
        <CalcButton label="8" onClick={() => handlePress('8')} />
        <CalcButton label="9" onClick={() => handlePress('9')} />
        <CalcButton label="×" onClick={() => handlePress('*')} className="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 text-xl" />
        {showScientific && <CalcButton label="cos" onClick={() => handlePress('cos')} className="text-xs font-bold text-secondary-600 dark:text-secondary-400" />}

        {/* Row 3 */}
        <CalcButton label="4" onClick={() => handlePress('4')} />
        <CalcButton label="5" onClick={() => handlePress('5')} />
        <CalcButton label="6" onClick={() => handlePress('6')} />
        <CalcButton label="-" onClick={() => handlePress('-')} className="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 text-xl" />
        {showScientific && <CalcButton label="tan" onClick={() => handlePress('tan')} className="text-xs font-bold text-secondary-600 dark:text-secondary-400" />}

        {/* Row 4 */}
        <CalcButton label="1" onClick={() => handlePress('1')} />
        <CalcButton label="2" onClick={() => handlePress('2')} />
        <CalcButton label="3" onClick={() => handlePress('3')} />
        <CalcButton label="+" onClick={() => handlePress('+')} className="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 text-xl" />
        {showScientific && <div className="hidden"></div>} 
        
        {/* Row 5 */}
        <CalcButton label="0" onClick={() => handlePress('0')} className={`${showScientific ? 'col-span-2' : 'col-span-2'}`} />
        <CalcButton label="." onClick={() => handlePress('.')} className="font-bold text-xl" />
        <button 
            onClick={() => handlePress('=')}
            className={`
                rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/30 
                hover:shadow-primary-500/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center 
                ${showScientific ? 'col-span-2' : 'col-span-1'}
                h-full w-full
            `}
        >
            <Equal className="w-7 h-7" />
        </button>
      </div>

      {/* Resize Handle */}
      <div 
        onMouseDown={handleResizeMouseDown}
        className="absolute bottom-0 right-0 p-3 cursor-se-resize text-slate-300 dark:text-slate-600 hover:text-primary-500 dark:hover:text-primary-400 transition-colors z-20"
      >
          <div className="w-3 h-3 border-b-2 border-r-2 border-current rounded-br-sm"></div>
      </div>
    </div>
  );
};

const CalcButton: React.FC<{ label: string, onClick: () => void, icon?: React.ReactNode, className?: string }> = ({ label, onClick, icon, className = '' }) => (
    <button
        onClick={onClick}
        className={`
            w-full h-full rounded-xl text-lg font-medium transition-all duration-200 active:scale-90 flex items-center justify-center
            bg-white dark:bg-white/5 shadow-sm border border-slate-100 dark:border-white/5
            hover:bg-slate-50 dark:hover:bg-white/10 hover:border-primary-200 dark:hover:border-primary-500/30 hover:shadow-md
            text-slate-700 dark:text-slate-200
            ${className}
        `}
    >
        {icon || label}
    </button>
);

export default CalculatorWidget;