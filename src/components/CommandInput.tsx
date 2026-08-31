import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Sparkles, Image, Search, Code, Brain, Zap, Palette, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';
import { getRandomSuggestions, SuggestionItem } from '../data/suggestions';

interface CommandInputProps {
  onSend: (command: string) => void;
  disabled?: boolean;
}

export const CommandInput: React.FC<CommandInputProps> = ({ onSend, disabled }) => {
  const [value, setValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { chatMode, isDarkMode } = useTheme();

  const [currentSuggestions, setCurrentSuggestions] = useState<SuggestionItem[]>(() => getRandomSuggestions(chatMode, 3));

  useEffect(() => {
    setCurrentSuggestions(getRandomSuggestions(chatMode, 3));
  }, [chatMode]);

  const refreshSuggestions = () => {
    setCurrentSuggestions(getRandomSuggestions(chatMode, 3));
  };

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'image': return <Image className="w-3 h-3 text-theme-accent" />;
      case 'search': return <Search className="w-3 h-3 text-theme-accent" />;
      case 'code': return <Code className="w-3 h-3 text-theme-accent" />;
      case 'brain': return <Brain className="w-3 h-3 text-theme-accent" />;
      case 'terminal': return <Terminal className="w-3 h-3 text-theme-accent" />;
      case 'palette': return <Palette className="w-3 h-3 text-theme-accent" />;
      case 'zap': return <Zap className="w-3 h-3 text-theme-accent" />;
      default: return <Sparkles className="w-3 h-3 text-theme-accent" />;
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue('');
      setShowSuggestions(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="relative group">
      <AnimatePresence>
        {value.length === 0 && !disabled && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-12 left-0 right-0 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar"
          >
            {currentSuggestions.map((s, i) => (
              <button
                key={`${s.label}-${i}`}
                onClick={() => {
                  onSend(s.label);
                  setShowSuggestions(false);
                }}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all flex items-center gap-1.5 backdrop-blur-sm ${
                  isDarkMode 
                    ? 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700' 
                    : 'bg-white text-zinc-800 border-zinc-300 hover:text-zinc-950 hover:bg-zinc-100 shadow-xs'
                }`}
              >
                {getIcon(s.iconType)}
                {s.label}
              </button>
            ))}
            <button
              onClick={refreshSuggestions}
              className={`p-1.5 rounded-full border transition-all ${
                isDarkMode 
                  ? 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white' 
                  : 'bg-white text-zinc-600 border-zinc-300 hover:text-zinc-950 hover:bg-zinc-100 shadow-xs'
              }`}
              title="Shuffle suggestions"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>


      <div className="absolute inset-0 bg-theme-accent-glow blur-xl group-focus-within:bg-theme-accent-glow transition-colors pointer-events-none" />
      <div className={`relative border rounded-lg flex items-start px-4 py-2.5 focus-within:border-theme-accent-glow focus-within:ring-1 focus-within:ring-theme-accent-glow transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-lg'}`}>
        <Terminal className={`w-4 h-4 mr-3 shrink-0 mt-1.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? "Worp is processing..." : "Ask anything"}
          className={`bg-transparent border-none outline-none focus:outline-none focus:ring-0 flex-1 text-sm font-mono resize-none min-h-[36px] max-h-[200px] overflow-y-auto leading-relaxed py-1 custom-scrollbar ${isDarkMode ? 'text-zinc-200 placeholder:text-zinc-600' : 'text-zinc-900 placeholder:text-zinc-400'}`}
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="ml-2 p-1.5 rounded-md text-zinc-500 hover:text-theme-accent hover:bg-theme-accent-glow disabled:opacity-0 transition-all shrink-0 mt-0.5"
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
          <kbd className={`px-1.5 py-0.5 rounded border text-[10px] font-mono ${isDarkMode ? 'border-zinc-800 bg-zinc-950 text-zinc-500' : 'border-zinc-200 bg-white text-zinc-400'}`}>SHIFT+ENTER ↵</kbd>
        </div>
      </div>
    </div>
  );
};
