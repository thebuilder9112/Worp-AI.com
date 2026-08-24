import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Terminal, 
  Moon, 
  Sun, 
  Plus, 
  Palette, 
  Monitor,
  Command as CommandIcon,
  Cpu,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';

interface CommandAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  actions: CommandAction[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, actions }) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { isDarkMode } = useTheme();

  const filteredActions = actions.filter(action => 
    action.label.toLowerCase().includes(search.toLowerCase()) ||
    action.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredActions.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredActions.length) % Math.max(1, filteredActions.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className={`fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl border rounded-2xl shadow-2xl z-[151] overflow-hidden ${
              isDarkMode 
                ? 'bg-zinc-950 border-zinc-800' 
                : 'bg-white border-zinc-300 shadow-2xl text-zinc-900'
            }`}
          >
            <div className={`p-4 border-b flex items-center gap-3 ${isDarkMode ? 'border-zinc-900' : 'border-zinc-100'}`}>
              <Search className={`w-5 h-5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
              <input 
                autoFocus
                type="text" 
                placeholder="Type a command or search..." 
                className={`bg-transparent border-none outline-none w-full text-base font-medium ${
                  isDarkMode 
                    ? 'text-zinc-200 placeholder:text-zinc-600' 
                    : 'text-zinc-900 placeholder:text-zinc-400'
                }`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-zinc-100 border-zinc-200 text-zinc-600'}`}>
                <span className="text-[10px] font-bold uppercase">ESC</span>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-none">
              {filteredActions.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest">No synaptic routes found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    {filteredActions.map((action, index) => (
                      <button
                        key={action.id}
                        onClick={() => {
                          action.action();
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                          index === selectedIndex 
                            ? isDarkMode 
                              ? 'bg-zinc-900 text-white' 
                              : 'bg-zinc-100 text-zinc-950 font-medium'
                            : isDarkMode 
                              ? 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-300' 
                              : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${
                          index === selectedIndex 
                            ? 'bg-theme-accent/20 text-theme-accent' 
                            : isDarkMode 
                              ? 'bg-zinc-900 border border-zinc-800 text-zinc-400' 
                              : 'bg-zinc-100 border border-zinc-200 text-zinc-700'
                        }`}>
                          {action.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-semibold">{action.label}</p>
                          <p className="text-[10px] uppercase tracking-widest opacity-60 font-mono">{action.category}</p>
                        </div>
                        {action.shortcut && (
                          <div className="flex items-center gap-1">
                            {action.shortcut.split('+').map((key, i) => (
                              <span key={i} className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase ${
                                isDarkMode 
                                  ? 'bg-zinc-800 border-zinc-700 text-zinc-400' 
                                  : 'bg-zinc-100 border-zinc-300 text-zinc-700'
                              }`}>
                                {key}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={`p-3 border-t flex items-center justify-between ${isDarkMode ? 'border-zinc-900 bg-zinc-950/50' : 'border-zinc-100 bg-zinc-50/80'}`}>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>↑↓</span>
                  <span className={`text-[10px] font-mono ${isDarkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>NAVIGATE</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>ENTER</span>
                  <span className={`text-[10px] font-mono ${isDarkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>EXECUTE</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className={`w-3 h-3 ${isDarkMode ? 'text-zinc-700' : 'text-zinc-400'}`} />
                <span className={`text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-700' : 'text-zinc-500'}`}>Worp_CMD_v1.0</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
