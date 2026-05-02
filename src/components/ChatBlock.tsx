import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, Terminal, Cpu, MessageSquare, Code, Sparkles, Brain } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';

interface ChatBlockProps {
  id: string;
  command: string;
  response: string;
  timestamp: Date;
  isStreaming?: boolean;
  userName?: string;
  lightLogo?: string;
  darkLogo?: string;
}

export const ChatBlock: React.FC<ChatBlockProps> = ({ command, response, timestamp, isStreaming, userName, lightLogo, darkLogo }) => {
  const [copied, setCopied] = useState(false);
  const { chatMode, friendlyMode, isDarkMode } = useTheme();

  const finalLogo = isDarkMode ? darkLogo : lightLogo;

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modeIcons = {
    standard: <MessageSquare className="w-3.5 h-3.5" />,
    code: <Code className="w-3.5 h-3.5" />,
    art: <Sparkles className="w-3.5 h-3.5" />,
    research: <Brain className="w-3.5 h-3.5" />
  };

  const modeStyles = {
    standard: isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200",
    code: isDarkMode ? "bg-zinc-900 border-blue-900/30" : "bg-blue-50 border-blue-200",
    art: isDarkMode ? "bg-zinc-900 border-pink-900/30" : "bg-pink-50 border-pink-200",
    research: isDarkMode ? "bg-zinc-900 border-emerald-900/30" : "bg-emerald-50 border-emerald-200"
  };

  if (friendlyMode) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
        {/* User Bubble */}
        <div className="flex flex-col items-end">
          <div className="max-w-[80%] bg-theme-accent text-white px-5 py-3 rounded-3xl rounded-tr-none shadow-xl">
             <p className="text-sm font-medium">{command}</p>
          </div>
          <div className="flex items-center gap-2 mt-2 px-2">
            <span className="text-[10px] text-theme-accent font-bold uppercase tracking-wider">{userName || 'User'}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-500/30" />
            <span className="text-[10px] text-zinc-500 font-medium">{format(timestamp, 'HH:mm')}</span>
          </div>
        </div>

        {/* AI Bubble */}
        <div className="flex gap-4">
           <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              {finalLogo ? (
                <img src={finalLogo} alt="AI" className="w-full h-full object-cover" />
              ) : (
                <div className="text-theme-accent">{modeIcons[chatMode]}</div>
              )}
           </div>
           <div className="flex-1 space-y-2">
              <div className={`p-6 rounded-3xl rounded-tl-none shadow-2xl relative overflow-hidden group border ${isDarkMode ? 'bg-[#0f0f12] border-zinc-800' : 'bg-white border-zinc-200 text-zinc-700'}`}>
                 <div className="flex items-center gap-2 mb-3">
                   <span className="text-[10px] font-bold text-theme-accent uppercase tracking-wider">Worp_AI</span>
                   <span className="w-1 h-1 rounded-full bg-zinc-500/30" />
                 </div>
                 {chatMode === 'art' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5 pointer-events-none" />
                 )}
                 <div className={`relative z-10 text-[15px] leading-relaxed markdown-friendly ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        img: ({ src, alt }) => (
                          <div className={`my-4 rounded-2xl overflow-hidden border shadow-xl ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
                            <img 
                              src={src} 
                              alt={alt || "Worp AI Visual"} 
                              className="w-full h-auto object-cover max-h-[400px]"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )
                      }}
                    >
                      {response}
                    </ReactMarkdown>
                    {isStreaming && <span className="inline-block w-2 h-4 bg-theme-accent ml-1 animate-pulse" />}
                 </div>
                 <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={handleCopy} className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-900'}`}>
                       {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* User Message - Aligned Right */}
      <div className="flex flex-col items-end mb-8">
        <div className={`max-w-[85%] rounded-[2rem] px-5 py-2.5 shadow-sm border ${
          isDarkMode 
            ? 'bg-[#2a2a2c] border-zinc-700/50 text-white font-medium' 
            : 'bg-zinc-100 border-zinc-200 text-zinc-900'
        }`}>
          <p className="text-[15px] leading-relaxed tracking-tight">{command}</p>
        </div>
      </div>

      {/* AI Message - Aligned Left */}
      <div className="flex gap-6">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 overflow-hidden border ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
          {finalLogo ? (
            <img src={finalLogo} alt="AI" className="w-full h-full object-cover" />
          ) : (
            <Sparkles className="w-4 h-4 text-theme-accent" />
          )}
        </div>
        
        <div className="flex-1 space-y-4">
          <div className={`p-5 px-6 rounded-2xl rounded-tl-none shadow-sm border ${
            isDarkMode 
              ? 'bg-[#151518] border-zinc-800 text-zinc-200' 
              : 'bg-white border-zinc-200 text-zinc-700'
          }`}>
            <div className="flex items-center gap-2 mb-4 border-b border-zinc-800/20 pb-2">
              <span className="text-[10px] font-bold text-theme-accent uppercase tracking-wider animate-shine bg-gradient-to-r from-theme-accent via-white to-theme-accent bg-clip-text text-transparent bg-[length:200%_auto]">Neural_Core_Output</span>
              <span className="w-1 h-1 rounded-full bg-zinc-500/30" />
              <span className="text-[10px] text-zinc-500 font-mono lowercase opacity-50">{id}</span>
            </div>
            <div className={`text-[15px] leading-relaxed markdown-friendly`}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="px-1.5 py-0.5 rounded font-mono text-[13px] bg-zinc-900/50 text-theme-accent">{children}</code>
                    ) : (
                      <div className="relative group/code my-6">
                        <pre className={`relative p-5 rounded-xl border overflow-x-auto shadow-sm font-mono text-[13px] leading-relaxed ${isDarkMode ? 'bg-black/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                          <code>{children}</code>
                        </pre>
                      </div>
                    );
                  },
                  img: ({ src, alt }) => (
                    <div className={`my-6 rounded-2xl overflow-hidden border shadow-sm ${isDarkMode ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
                      <img 
                        src={src} 
                        alt={alt || "Worp Neural Visual"} 
                        className="w-full h-auto object-cover max-h-[600px]"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ),
                }}
              >
                {response}
              </ReactMarkdown>
              {isStreaming && (
                <motion.span 
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block w-2 h-4 bg-theme-accent ml-1 align-middle" 
                />
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={handleCopy}
              className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-300"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
