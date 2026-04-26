import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';

interface CommandInputProps {
  onSend: (command: string) => void;
  disabled?: boolean;
}

export const CommandInput: React.FC<CommandInputProps> = ({ onSend, disabled }) => {
  const [value, setValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { chatMode, isDarkMode } = useTheme();

  const suggestions = {
    standard: ["Latest tech news", "Show me a photo of a galaxy", "Find best links for React"],
    code: ["Optimize this SQL query", "React state vs props", "Latest Node.js features"],
    art: ["Neon city photo", "Minimalist layout tips", "Show me impressionist art"],
    research: ["Impact of AI on labor", "Black hole entropy", "Find research on CRISPR"]
  };

  const currentSuggestions = suggestions[chatMode] || suggestions.standard;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue('');
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit();
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="relative group">
      <AnimatePresence>
        {value.length === 0 && !disabled && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-12 left-0 right-0 flex gap-2 overflow-x-auto pb-2 no-scrollbar"
          >
            {currentSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  onSend(s);
                  setShowSuggestions(false);
                }}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full border text-[11px] hover:text-theme-accent hover:border-theme-accent-glow transition-all flex items-center gap-1.5 backdrop-blur-sm ${isDarkMode ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400' : 'bg-white/60 border-zinc-200 text-zinc-500'}`}
              >
                <Sparkles className="w-3 h-3 text-theme-accent" />
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-theme-accent-glow blur-xl group-focus-within:bg-theme-accent-glow transition-colors pointer-events-none" />
      <div className={`relative border rounded-lg flex items-center px-4 py-3 focus-within:border-theme-accent-glow focus-within:ring-1 focus-within:ring-theme-accent-glow transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-lg'}`}>
        <Terminal className={`w-4 h-4 mr-3 shrink-0 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? "Worp is processing..." : "Ask Worp anything..."}
          className={`bg-transparent border-none outline-none flex-1 text-sm font-mono ${isDarkMode ? 'text-zinc-200 placeholder:text-zinc-600' : 'text-zinc-900 placeholder:text-zinc-400'}`}
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="ml-2 p-1.5 rounded-md text-zinc-500 hover:text-theme-accent hover:bg-theme-accent-glow disabled:opacity-0 transition-all shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between px-1">
        <div className="flex gap-4">
          <span className={`text-[10px] font-mono font-medium uppercase tracking-tighter ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>Mode: {chatMode}</span>
          <span className={`text-[10px] font-mono font-medium ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>CTRL+L TO CLEAR</span>
        </div>
        <div className="flex gap-2">
          <kbd className={`px-1.5 py-0.5 rounded border text-[10px] font-mono ${isDarkMode ? 'border-zinc-800 bg-zinc-950 text-zinc-500' : 'border-zinc-200 bg-white text-zinc-400'}`}>ENTER</kbd>
        </div>
      </div>
    </div>
  );
};
