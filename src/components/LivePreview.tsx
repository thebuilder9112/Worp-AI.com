import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, RotateCcw, X, Eye, Code as CodeIcon, FileCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LivePreviewProps {
  code: string;
  language: string;
  isOpen: boolean;
  onClose: () => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ code, language, isOpen, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [srcDoc, setSrcDoc] = useState('');

  useEffect(() => {
    if (language === 'html' || language === 'xml') {
      setSrcDoc(code);
    } else if (language === 'javascript' || language === 'typescript' || language === 'js' || language === 'ts') {
      const doc = `
        <html>
          <head>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { background: transparent; color: white; font-family: sans-serif; padding: 20px; }
            </style>
          </head>
          <body>
            <div id="root"></div>
            <script>
              try {
                ${code}
              } catch (err) {
                document.body.innerHTML = '<div style="color: #ff5555; font-family: monospace;">[SYNAPTIC_ERROR] ' + err.message + '</div>';
              }
            </script>
          </body>
        </html>
      `;
      setSrcDoc(doc);
    }
  }, [code, language]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`fixed z-[200] flex flex-col bg-zinc-950 border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden transition-all duration-500 ${
            isFullscreen ? 'inset-4' : 'bottom-8 right-8 w-full max-w-2xl h-[500px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
              </div>
              <div className="h-4 w-[1px] bg-zinc-800 mx-1" />
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-theme-accent" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Neural_Live_Render</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition-colors"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Device Frame (Mock) */}
          <div className="flex-1 bg-white relative">
            <iframe
              title="Live Preview"
              srcDoc={srcDoc}
              className="w-full h-full border-none"
              sandbox="allow-scripts"
            />
            
            {/* Terminal Overlay for Mobile Feel */}
            {!isFullscreen && (
              <div className="absolute inset-0 pointer-events-none border-[12px] border-zinc-950/10 rounded-xl" />
            )}
          </div>

          <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-zinc-500 uppercase">Status: Live</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-mono text-zinc-600">RENDER_ENGINE_V1.0</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
