import React, { useState } from 'react';
import { Play, RotateCcw, X, Terminal, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CodeRunnerProps {
  code: string;
  language?: string;
}

export const CodeRunner: React.FC<CodeRunnerProps> = ({ code, language }) => {
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const runCode = () => {
    setIsRunning(true);
    setIsOpen(true);
    setOutput(["Initializing synaptic execution environment...", "Connecting to local node..."]);
    
    // Safety check for basic JS execution
    try {
      // NEURAL GUARD: Filter sensitive keywords to prevent data exfiltration
      const sensitiveKeywords = ['localStorage', 'sessionStorage', 'cookie', 'fetch', 'XMLHttpRequest', 'indexedDB', 'alert'];
      const foundKeyword = sensitiveKeywords.find(kw => code.includes(kw));
      
      if (foundKeyword) {
        throw new Error(`Neural Guard Blocked: Unauthorized access to '${foundKeyword}' detected.`);
      }

      const logs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
        error: (...args: any[]) => logs.push(`[ERROR] ${args.join(' ')}`),
        warn: (...args: any[]) => logs.push(`[WARN] ${args.join(' ')}`),
      };

      // Create a function from the code
      const runner = new Function('console', code);
      runner(customConsole);
      
      setTimeout(() => {
        setOutput(prev => [...prev, ...logs, "", ">> EXECUTION_COMPLETE"]);
        setIsRunning(false);
      }, 600);
    } catch (err: any) {
      setOutput(prev => [...prev, `[CRITICAL_FAILURE] ${err.message}`, "", ">> EXECUTION_TERMINATED"]);
      setIsRunning(false);
    }
  };

  const isExecutable = language === 'javascript' || language === 'typescript' || language === 'js' || language === 'ts';

  if (!isExecutable) return null;

  return (
    <div className="absolute top-2 right-12 opacity-0 group-hover/code:opacity-100 transition-opacity flex gap-2">
      <button
        onClick={runCode}
        className="flex items-center gap-1.5 px-2 py-1 rounded bg-theme-accent/20 border border-theme-accent/30 text-theme-accent text-[10px] font-bold uppercase tracking-widest hover:bg-theme-accent/40 transition-all hover:scale-105"
      >
        <Play className="w-3 h-3" />
        Run Snippet
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-8 right-8 w-full max-w-md bg-black border border-zinc-800 rounded-xl shadow-2xl z-[200] overflow-hidden flex flex-col h-[300px]"
          >
            <div className="p-3 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-theme-accent" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Neural_Runner_Console</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-600 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1 custom-scrollbar">
              {output.map((line, i) => (
                <p key={i} className={`${line.includes('[ERROR]') ? 'text-red-400' : line.includes('>>') ? 'text-theme-accent' : 'text-zinc-400'}`}>
                  <span className="text-zinc-700 mr-2">[{i+1}]</span>
                  {line}
                </p>
              ))}
              {isRunning && (
                <div className="flex items-center gap-2 text-theme-accent">
                  <RotateCcw className="w-3 h-3 animate-spin" />
                  <span className="animate-pulse">Processing...</span>
                </div>
              )}
            </div>

            <div className="p-2 bg-zinc-950 border-t border-zinc-900 flex justify-end gap-2">
              <button 
                onClick={() => setOutput([])}
                className="px-2 py-1 rounded hover:bg-zinc-800 text-[9px] font-bold text-zinc-600 uppercase transition-all"
              >
                Clear Buffer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

