import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Copy, Check, Terminal, Cpu, MessageSquare, Code, Sparkles, Brain, Download, Eye, Volume2, VolumeX, Link2, Zap, AtSign, FileText, Paperclip } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { useTheme } from '../lib/ThemeContext';
import { CodeRunner } from './CodeRunner';
import { LivePreview } from './LivePreview';
import { Logo } from './Logo';
import { highlightCode } from '../lib/prismHighlighter';

interface ChatBlockProps {
  id: string;
  command: string;
  response: string;
  timestamp: Date;
  isStreaming?: boolean;
  userName?: string;
  lightLogo?: string;
  darkLogo?: string;
  attachments?: Array<{ id?: string; name: string; type: string; data?: string; size?: number }>;
}

function cleanMarkdownForSpeech(text: string): string {
  if (!text) return '';
  return text
    // Replace code blocks with brief note so it doesn't read hundreds of lines of code syntax
    .replace(/```[\s\S]*?```/g, ' [Code snippet omitted] ')
    // Replace inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // Remove headers #, ##, etc.
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold and italics
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove unordered list bullets
    .replace(/^[-*+]\s+/gm, '')
    // Remove math delimiters
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/\$([^$]+)\$/g, '$1')
    // Clean multiple spaces/newlines
    .replace(/\n+/g, ' ')
    .trim();
}

export const ChatBlock: React.FC<ChatBlockProps> = ({ id, command, response, timestamp, isStreaming, userName, lightLogo, darkLogo, attachments }) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [previewState, setPreviewState] = useState<{ isOpen: boolean; code: string; language: string }>({
    isOpen: false,
    code: '',
    language: ''
  });
  const { chatMode, friendlyMode, isDarkMode } = useTheme();

  const finalLogo = isDarkMode ? darkLogo : lightLogo;

  React.useEffect(() => {
    return () => {
      // Cancel speech synthesis if block unmounts while speaking
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
      }
    };
  }, []);

  const handleToggleTTS = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      toast.info("Audio playback stopped.");
      return;
    }

    // Cancel any previous speech
    window.speechSynthesis.cancel();

    const spokenText = cleanMarkdownForSpeech(response);
    if (!spokenText) {
      toast.error("No text available to read.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.default)) || voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn("Speech synthesis error:", e);
        toast.error("Speech playback error.");
      }
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
    toast.success("Reading AI response aloud...");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Basic PDF formatting
      const margin = 10;
      const pageWidth = doc.internal.pageSize.getWidth();
      const textWidth = pageWidth - (margin * 2);
      
      doc.setFontSize(16);
      doc.text("Worp AI Neural Export", margin, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on ${format(timestamp, 'yyyy-MM-dd HH:mm:ss')}`, margin, 30);
      
      doc.setDrawColor(200);
      doc.line(margin, 35, pageWidth - margin, 35);
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      
      const splitText = doc.splitTextToSize(response, textWidth);
      doc.text(splitText, margin, 45);
      
      doc.save(`worp-export-${id}.pdf`);
      toast.success("Synaptic Archive physicalized as PDF.");
    } catch (err) {
      console.error(err);
      toast.error("Physicalization sequence failed.");
    }
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

  const linkedMentions = Array.from(command.matchAll(/@(?:"([^"]+)"|([a-zA-Z0-9_\-\.]+))/g))
    .map(m => m[1] || m[2])
    .filter(Boolean);
  const isInit = /^\s*(\\|\/)init\b/i.test(command) || command.includes('\\init') || command.includes('/init');
  const isCmd = !isInit && /^\s*([\/\\a-zA-Z0-9_\-]+)/.test(command);
  const customCmdName = isCmd ? /^\s*([\/\\a-zA-Z0-9_\-]+)/.exec(command)?.[1] : null;

  if (friendlyMode) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
        {/* User Bubble */}
        <div className="flex flex-col items-end">
          {(linkedMentions.length > 0 || isInit || (customCmdName && (customCmdName.startsWith('/') || customCmdName.startsWith('\\')))) && (
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5 justify-end">
              {isInit && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-xs">
                  <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
                  \INIT AUDIT
                </span>
              )}
              {customCmdName && (customCmdName.startsWith('/') || customCmdName.startsWith('\\')) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-xs">
                  <Terminal className="w-3 h-3 text-purple-400" />
                  {customCmdName}
                </span>
              )}
              {linkedMentions.map((m, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-theme-accent/20 text-theme-accent border border-theme-accent/30 shadow-xs">
                  <Link2 className="w-3 h-3" />
                  @{m}
                </span>
              ))}
            </div>
          )}

          {/* Render User Attachments if present */}
          {attachments && attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 justify-end max-w-[85%]">
              {attachments.map((att, i) => (
                <div 
                  key={i} 
                  className={`flex items-center gap-2 p-1.5 rounded-xl border text-xs shadow-xs ${
                    isDarkMode ? 'bg-zinc-900/90 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-800'
                  }`}
                >
                  {att.type.startsWith('image/') && att.data ? (
                    <img 
                      src={`data:${att.type};base64,${att.data}`} 
                      alt={att.name} 
                      className="w-9 h-9 rounded-lg object-cover border border-zinc-700/60"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-theme-accent/15 border border-theme-accent/30 flex items-center justify-center text-theme-accent shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 pr-1 text-left">
                    <span className="text-[11px] font-medium truncate max-w-[130px]" title={att.name}>{att.name}</span>
                    <span className="text-[9px] font-mono opacity-60 uppercase">{att.type.split('/')[1] || 'FILE'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="max-w-[80%] bg-theme-accent text-white px-5 py-3 rounded-3xl rounded-tr-none shadow-xl">
             <p className="text-sm font-medium whitespace-pre-wrap break-words">{command}</p>
          </div>
          <div className="flex items-center gap-2 mt-2 px-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-theme-accent' : 'text-zinc-900 font-extrabold'}`}>{userName || 'User'}</span>
            <span className={`w-1 h-1 rounded-full ${isDarkMode ? 'bg-zinc-500/30' : 'bg-zinc-400'}`} />
            <span className={`text-[10px] font-medium ${isDarkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>{format(timestamp, 'HH:mm')}</span>
          </div>
        </div>

        {/* AI Bubble */}
        <div className="flex gap-4">
           <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <Logo 
                className="w-full h-full text-theme-accent p-1" 
                isDarkMode={isDarkMode}
                imageSrc={finalLogo}
              />
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
                        code: ({ children, className }) => {
                          const isInline = !className;
                          const language = className?.replace('language-', '') || '';
                          const codeString = String(children).replace(/\n$/, '');

                          return isInline ? (
                            <code className={`px-1.5 py-0.5 rounded font-mono text-[13px] font-semibold border ${
                              isDarkMode 
                                ? 'bg-zinc-800/90 text-emerald-400 border-zinc-700/60' 
                                : 'bg-zinc-100 text-zinc-900 border-zinc-300'
                            }`}>
                              {children}
                            </code>
                          ) : (
                            <div className="relative group/code my-4">
                              <div className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity flex gap-1.5 z-10">
                                 <button 
                                   onClick={() => setPreviewState({ isOpen: true, code: codeString, language })}
                                   className="p-1.5 rounded border border-zinc-700/60 bg-zinc-900/90 text-zinc-300 hover:text-white"
                                   title="Preview"
                                 >
                                   <Eye className="w-3.5 h-3.5" />
                                 </button>
                                 <CodeRunner code={codeString} language={language} />
                                 <button 
                                   onClick={() => {
                                     navigator.clipboard.writeText(codeString);
                                     toast.success("Code copied to synaptic buffer");
                                   }}
                                   className="p-1.5 rounded border border-zinc-700/60 bg-zinc-900/90 text-zinc-300 hover:text-white"
                                 >
                                   <Copy className="w-3.5 h-3.5" />
                                 </button>
                              </div>
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border-t border-x border-zinc-800 rounded-t-xl text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                                <Terminal className="w-3 h-3 text-zinc-500" />
                                <span>{language || 'code'}</span>
                              </div>
                              <pre className="p-4 rounded-b-xl border border-zinc-800 bg-zinc-950 overflow-x-auto prism-code">
                                <code dangerouslySetInnerHTML={{ __html: highlightCode(codeString, language) }} />
                              </pre>
                            </div>
                          );
                        },
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
                 <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                       onClick={handleToggleTTS} 
                       className={`p-2 rounded-xl transition-all ${
                         isSpeaking 
                           ? 'bg-theme-accent text-white shadow-md animate-pulse' 
                           : isDarkMode 
                             ? 'bg-zinc-800 text-zinc-400 hover:text-white' 
                             : 'bg-zinc-100 text-zinc-500 hover:text-zinc-900'
                       }`}
                       title={isSpeaking ? "Stop reading aloud" : "Read response aloud"}
                       aria-label={isSpeaking ? "Stop reading aloud" : "Read response aloud"}
                    >
                       {isSpeaking ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <button onClick={handleCopy} className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-900'}`} title="Copy response">
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
        {(linkedMentions.length > 0 || isInit || (customCmdName && (customCmdName.startsWith('/') || customCmdName.startsWith('\\')))) && (
          <div className="flex flex-wrap items-center gap-1.5 mb-2 justify-end">
            {isInit && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-xs">
                <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
                \INIT AUDIT PROTOCOL
              </span>
            )}
            {customCmdName && (customCmdName.startsWith('/') || customCmdName.startsWith('\\')) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-xs">
                <Terminal className="w-3 h-3 text-purple-400" />
                {customCmdName}
              </span>
            )}
            {linkedMentions.map((m, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-theme-accent/20 text-theme-accent border border-theme-accent/30 shadow-xs">
                <Link2 className="w-3 h-3" />
                @{m}
              </span>
            ))}
          </div>
        )}

        {/* Render User Attachments if present in standard mode */}
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 justify-end max-w-[85%]">
            {attachments.map((att, i) => (
              <div 
                key={i} 
                className={`flex items-center gap-2 p-1.5 rounded-xl border text-xs shadow-xs ${
                  isDarkMode ? 'bg-[#222225] border-zinc-700/60 text-zinc-300' : 'bg-zinc-100 border-zinc-300 text-zinc-800'
                }`}
              >
                {att.type.startsWith('image/') && att.data ? (
                  <img 
                    src={`data:${att.type};base64,${att.data}`} 
                    alt={att.name} 
                    className="w-9 h-9 rounded-lg object-cover border border-zinc-700/60"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-theme-accent/15 border border-theme-accent/30 flex items-center justify-center text-theme-accent shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                )}
                <div className="flex flex-col min-w-0 pr-1 text-left">
                  <span className="text-[11px] font-medium truncate max-w-[130px]" title={att.name}>{att.name}</span>
                  <span className="text-[9px] font-mono opacity-60 uppercase">{att.type.split('/')[1] || 'FILE'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={`max-w-[85%] rounded-[2rem] px-5 py-2.5 shadow-sm border ${
          isDarkMode 
            ? 'bg-[#2a2a2c] border-zinc-700/50 text-white font-medium' 
            : 'bg-zinc-100 border-zinc-200 text-zinc-900'
        }`}>
          <p className="text-[15px] leading-relaxed tracking-tight whitespace-pre-wrap break-words">{command}</p>
        </div>
      </div>

      {/* AI Message - Aligned Left */}
      <div className="flex gap-6">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 overflow-hidden border ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200 bg-zinc-50'}`}>
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
              : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'
          }`}>
            <div className={`flex items-center gap-2 mb-4 border-b pb-2 ${isDarkMode ? 'border-zinc-800/60' : 'border-zinc-100'}`}>
              <span className="text-[10px] font-bold text-theme-accent uppercase tracking-wider animate-shine bg-gradient-to-r from-theme-accent via-white to-theme-accent bg-clip-text text-transparent bg-[length:200%_auto]">Neural_Core_Output</span>
              <span className="w-1 h-1 rounded-full bg-zinc-500/30" />
              <span className="text-[10px] text-zinc-500 font-mono lowercase opacity-60">{timestamp.getTime()}</span>
            </div>
            <div className={`text-[15px] leading-relaxed markdown-friendly ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
                  code: ({ children, className }) => {
                    const isInline = !className;
                    const language = className?.replace('language-', '') || '';
                    const codeString = String(children).replace(/\n$/, '');

                    return isInline ? (
                      <code className={`px-1.5 py-0.5 rounded font-mono text-[13px] font-semibold border ${
                        isDarkMode 
                          ? 'bg-zinc-800/90 text-emerald-400 border-zinc-700/60' 
                          : 'bg-zinc-100 text-zinc-900 border-zinc-300'
                      }`}>
                        {children}
                      </code>
                    ) : (
                      <div className="relative group/code my-6">
                        <div className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity flex gap-2 z-10">
                           <button 
                             onClick={() => setPreviewState({ isOpen: true, code: codeString, language })}
                             className={`p-1.5 rounded border transition-all ${
                               isDarkMode 
                                 ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-theme-accent' 
                                 : 'bg-white border-zinc-300 text-zinc-600 hover:text-zinc-950 shadow-sm'
                             }`}
                             title="Preview"
                           >
                             <Eye className="w-3.5 h-3.5" />
                           </button>
                           <CodeRunner code={codeString} language={language} />
                           <button 
                             onClick={() => {
                               navigator.clipboard.writeText(codeString);
                               toast.success("Code copied to synaptic buffer");
                             }}
                             className={`p-1.5 rounded border transition-all ${
                               isDarkMode 
                                 ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' 
                                 : 'bg-white border-zinc-300 text-zinc-600 hover:text-zinc-950 shadow-sm'
                             }`}
                           >
                             <Copy className="w-3.5 h-3.5" />
                           </button>
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2 border-t border-x rounded-t-xl ${
                          isDarkMode 
                            ? 'bg-zinc-950 border-zinc-800' 
                            : 'bg-zinc-100 border-zinc-300 text-zinc-800'
                        }`}>
                          <Terminal className={`w-3 h-3 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-500'}`} />
                          <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>{language || 'text'}</span>
                        </div>
                        <pre className={`relative p-5 rounded-b-xl border overflow-x-auto shadow-sm font-mono text-[13px] leading-relaxed prism-code ${
                          isDarkMode 
                            ? 'bg-black/75 border-zinc-800 text-zinc-100' 
                            : 'bg-zinc-50 border-zinc-300 text-zinc-950'
                        }`}>
                          <code dangerouslySetInnerHTML={{ __html: highlightCode(codeString, language) }} />
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
          
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={handleToggleTTS}
              className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${
                isSpeaking 
                  ? 'text-theme-accent bg-theme-accent/10 border border-theme-accent/30 font-medium' 
                  : isDarkMode 
                    ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300' 
                    : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
              title={isSpeaking ? "Stop reading aloud" : "Read response aloud (Text-to-speech)"}
              aria-label={isSpeaking ? "Stop reading aloud" : "Read response aloud"}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4 text-theme-accent animate-pulse" />
                  <span className="text-[10px] uppercase font-mono tracking-wider text-theme-accent">Speaking</span>
                </>
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <button 
              onClick={handleCopy}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300' 
                  : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button 
              onClick={handleExportPDF}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300' 
                  : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
              title="Export as PDF"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
