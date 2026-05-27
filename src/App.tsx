/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WORP AI TERMINAL - LOGO SYNC VERIFIED
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  History, 
  Plus, 
  Settings, 
  Sparkles, 
  Zap, 
  Code, 
  Layout, 
  Box,
  Brain,
  MessageSquare,
  Search,
  Command as CommandIcon,
  HelpCircle,
  Cpu,
  MoreVertical,
  Trash2,
  Share2,
  ChevronRight,
  Monitor,
  Heart,
  LogIn, 
  LogOut, 
  User as UserIcon, 
  Palette,
  Sun,
  Moon,
  Orbit,
  Mic,
  Image,
  Music,
  BookOpen,
  PenLine,
  ChevronDown,
  SendHorizontal,
  FileText,
  Terminal,
  Copy,
  FileCode
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Card } from '@/components/ui/card';
import { ChatBlock } from './components/ChatBlock';
import { CommandInput } from './components/CommandInput';
import { streamChat } from './lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { BlurFade } from '@/components/ui/blur-fade';
import { Toaster, toast } from 'sonner';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc, limit, updateDoc } from 'firebase/firestore';
import { db, signInWithGoogle, logout, auth } from './lib/firebase';
import { ThemeProvider, useTheme, ThemeType, ChatMode } from './lib/ThemeContext';
import { Logo } from './components/Logo';
import { TerminalEffects } from './components/TerminalEffects';
import { CommandPalette } from './components/CommandPalette';

import darkLogo from './logo3.jpg';
import lightLogo from './logo3.jpg';

import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  command: string;
  response: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  mode: string;
  createdAt: any;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const MODE_SUGGESTIONS: Record<string, { label: string; icon: React.ReactNode }[]> = {
  standard: [
    { label: "Explain quantum computing simply", icon: <Brain className="w-3 h-3" /> },
    { label: "Summarize the latest AI news", icon: <Sparkles className="w-3 h-3" /> },
    { label: "How does the internet work?", icon: <Search className="w-3 h-3" /> },
  ],
  code: [
    { label: "Write a binary search in TypeScript", icon: <Code className="w-3 h-3" /> },
    { label: "Build a React custom hook", icon: <Terminal className="w-3 h-3" /> },
    { label: "Explain Big-O with examples", icon: <Zap className="w-3 h-3" /> },
  ],
  art: [
    { label: "Design a dark terminal UI palette", icon: <Palette className="w-3 h-3" /> },
    { label: "Write a sci-fi opening scene", icon: <PenLine className="w-3 h-3" /> },
    { label: "Tips for minimalist typography", icon: <Sparkles className="w-3 h-3" /> },
  ],
  research: [
    { label: "Impact of AI on labor markets", icon: <Brain className="w-3 h-3" /> },
    { label: "Explain black hole entropy", icon: <Search className="w-3 h-3" /> },
    { label: "Analyze CRISPR breakthroughs", icon: <BookOpen className="w-3 h-3" /> },
  ],
};

const MODE_CAPABILITIES: Record<string, string[]> = {
  standard: ["Answer any question", "Summarize content", "Brainstorm ideas"],
  code: ["Write production code", "Debug & optimize", "Explain algorithms"],
  art: ["Design direction", "Creative writing", "Visual concepts"],
  research: ["Deep analysis", "Structured breakdowns", "Cited reasoning"],
};

function AppContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [input, setInput] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'chats' | 'project'>('chats');
  const [virtualFiles, setVirtualFiles] = useState<{ name: string, content: string, language: string }[]>([]);
  const [attachedFile, setAttachedFile] = useState<{ name: string, type: string, data: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const { 
    setTheme, setAccentColor, accentColor, 
    user, profile, loading, 
    chatMode, setChatMode,
    aiModel, setAIModel,
    friendlyMode, setFriendlyMode,
    isDarkMode, setIsDarkMode
  } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const themes: { id: ThemeType; color: string; label: string }[] = [
    { id: 'warp-dark', color: 'bg-zinc-800', label: 'Dark' },
    { id: 'warp-emerald', color: 'bg-emerald-500', label: 'Emerald' },
    { id: 'cyber-pulse', color: 'bg-pink-500', label: 'Cyber' },
    { id: 'ocean-depth', color: 'bg-sky-500', label: 'Ocean' },
    { id: 'sunset-lava', color: 'bg-orange-500', label: 'Sunset' },
    { id: 'royal-void', color: 'bg-purple-500', label: 'Royal' },
    { id: 'arctic-ice', color: 'bg-teal-400', label: 'Arctic' },
  ];

  // Fetch sessions
  useEffect(() => {
    if (!user) {
      setSessions([]);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'sessions'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sess = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatSession));
      setSessions(sess);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch messages for current session
  useEffect(() => {
    if (!user || !currentSessionId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'sessions', currentSessionId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.reduce((acc: Message[], doc) => {
        const data = doc.data();
        if (data.role === 'user') {
          acc.push({
            id: doc.id,
            command: data.text,
            response: '',
            timestamp: data.timestamp?.toDate() || new Date(),
            isStreaming: false
          });
        } else if (acc.length > 0) {
          acc[acc.length - 1].response = data.text;
        }
        return acc;
      }, []);
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [user, currentSessionId]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
        toast.success("Voice captured");
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error !== 'no-speech') {
          toast.error("Speech recognition failed: " + event.error);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        setIsListening(true);
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
        setIsListening(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        const dataPrefix = base64Data.split(',')[0];
        const mimeType = dataPrefix.match(/:(.*?);/)?.[1] || file.type;
        const pureBase64 = base64Data.split(',')[1];

        setAttachedFile({
          name: file.name,
          type: mimeType,
          data: pureBase64
        });
        toast.success(`Synaptic Link established: ${file.name}`);
      };

      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startNewSession = async (initialCommand?: string) => {
    if (!user) {
      toast.error("Please sign in to save chats.");
      if (initialCommand) handleSendCommand(initialCommand, null);
      return;
    }

    const title = initialCommand ? (initialCommand.length > 30 ? initialCommand.substring(0, 30) + '...' : initialCommand) : 'New Conversation';
    
    try {
      const sessRef = await addDoc(collection(db, 'users', user.uid, 'sessions'), {
        title,
        mode: chatMode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setCurrentSessionId(sessRef.id);
      if (initialCommand) handleSendCommand(initialCommand, sessRef.id);
    } catch (e) {
      console.error(e);
      toast.error("Failed to start session");
    }
  };

  const handleSendCommand = async (command: string, sessionId: string | null = currentSessionId) => {
    if (isProcessing) return;
    if (!sessionId && user) {
       await startNewSession(command);
       return;
    }

    const newMessageId = Math.random().toString(36).substring(7);
    const userMessage: Message = {
      id: newMessageId,
      command,
      response: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    setInput('');

    try {
      // Save User Message to Firestore
      if (user && sessionId) {
        await addDoc(collection(db, 'users', user.uid, 'sessions', sessionId, 'messages'), {
          role: 'user',
          text: command,
          timestamp: serverTimestamp()
        });
      }

      const history = messages.map(m => [
        { role: 'user' as const, parts: [{ text: m.command }] },
        { role: 'model' as const, parts: [{ text: m.response }] }
      ]).flat();

      let fullResponse = '';
      const stream = streamChat(command, history, chatMode, attachedFile, aiModel);
      setAttachedFile(null); // Clear synaptic link after dispatch

      for await (const delta of stream) {
        fullResponse += delta;
        setMessages(prev => prev.map(m => 
          m.id === newMessageId ? { ...m, response: fullResponse } : m
        ));
      }

      // Save Model Response to Firestore
      if (user && sessionId) {
        await addDoc(collection(db, 'users', user.uid, 'sessions', sessionId, 'messages'), {
          role: 'model',
          text: fullResponse,
          timestamp: serverTimestamp()
        });
      }

      setMessages(prev => prev.map(m => 
        m.id === newMessageId ? { ...m, isStreaming: false } : m
      ));
    } catch (error: any) {
      console.error("Neural Link Failure:", error);
      toast.error(`Neural Link Error: ${error?.message || "Check code/connection"}`);
      setMessages(prev => prev.filter(m => m.id !== newMessageId));
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    // Scan last message for file patterns
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      const codeRegex = /```(\w+)\s+(?:title="([^"]+)"|filename="([^"]+)")?\s*([\s\S]*?)```/g;
      let match;
      const newFiles = [...virtualFiles];
      let updated = false;

      const contentToScan = lastMessage.response;
      if (contentToScan) {
        while ((match = codeRegex.exec(contentToScan)) !== null) {
          const lang = match[1];
          const name = match[2] || match[3] || `snippet_${newFiles.length + 1}.${lang === 'javascript' ? 'js' : lang === 'typescript' ? 'ts' : lang}`;
          const content = match[4].trim();

          if (!newFiles.find(f => f.name === name)) {
            newFiles.push({ name, content, language: lang });
            updated = true;
          }
        }
      }

      if (updated) setVirtualFiles(newFiles);
    }
  }, [messages]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const commandActions = [
    { 
      id: 'new-chat', 
      label: 'New AI Session', 
      icon: <Plus className="w-4 h-4" />, 
      shortcut: 'âŒ˜+SHIFT+N',
      category: 'System', 
      action: () => startNewSession() 
    },
    { 
      id: 'toggle-friendly', 
      label: `Switch to ${friendlyMode ? 'Terminal' : 'Normal'} UI`, 
      icon: friendlyMode ? <Terminal className="w-4 h-4" /> : <Monitor className="w-4 h-4" />, 
      category: 'Display', 
      action: () => setFriendlyMode(!friendlyMode) 
    },
    { 
      id: 'toggle-crt', 
      label: `${crtEnabled ? 'Disable' : 'Enable'} CRT Effects`, 
      icon: <Cpu className="w-4 h-4" />, 
      category: 'Display', 
      action: () => setCrtEnabled(!crtEnabled) 
    },
    { 
      id: 'toggle-dark', 
      label: `Toggle ${isDarkMode ? 'Light' : 'Dark'} Mode`, 
      icon: isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />, 
      category: 'Appearance', 
      action: () => setIsDarkMode(!isDarkMode) 
    },
    { 
      id: 'mode-standard', label: 'Standard Mode', icon: <MessageSquare className="w-4 h-4" />, category: 'AI Intelligence', action: () => setChatMode('standard') },
    { id: 'mode-code', label: 'Code Mode', icon: <Code className="w-4 h-4" />, category: 'AI Intelligence', action: () => setChatMode('code') },
    { id: 'mode-art', label: 'Art Mode', icon: <Sparkles className="w-4 h-4" />, category: 'AI Intelligence', action: () => setChatMode('art') },
    { id: 'mode-research', label: 'Research Mode', icon: <Brain className="w-4 h-4" />, category: 'AI Intelligence', action: () => setChatMode('research') },
  ];

  const handleShare = async () => {
    if (!user || !currentSessionId) return;

    try {
      const sessionRef = doc(db, 'users', user.uid, 'sessions', currentSessionId);
      await updateDoc(sessionRef, {
        isPublic: true,
        sharedAt: serverTimestamp()
      });

      // In a real app, you'd have a separate route for public views.
      // For this demo, we'll just simulate the URL.
      const url = `${window.location.origin}/share/${currentSessionId}`;
      setShareUrl(url);
      setIsShareDialogOpen(true);
      toast.success("Synaptic Snapshot published to the mesh.");
    } catch (err) {
      console.error(err);
      toast.error("Sharing sequence failed.");
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      toast.success("Welcome to Worp AI Console");
    } catch (error) {
      toast.error("Failed to sign in");
    }
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      setAccentColor(`${r} ${g} ${b}`);
    }
  };

  const rgbToHex = (rgb: string) => {
    const parts = rgb.split(' ').map(Number);
    if (parts.length !== 3) return "#10b981";
    return "#" + parts.map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  if (loading) {
     return (
       <div className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center gap-4">
         <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center animate-pulse">
           <Zap className="w-6 h-6 text-zinc-600" />
         </div>
       </div>
     );
  }

  const modeIcons = {
    standard: <MessageSquare className="w-4 h-4" />,
    code: <Code className="w-4 h-4" />,
    art: <Sparkles className="w-4 h-4" />,
    research: <Brain className="w-4 h-4" />
  };

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className={`flex h-screen w-full transition-all duration-500 font-sans ${friendlyMode ? 'bg-[#050505] text-zinc-300' : 'bg-black text-zinc-200'}`}>
          <Toaster theme="dark" position="top-center" />
          
          {crtEnabled && <TerminalEffects isDarkMode={isDarkMode} />}
          
          <CommandPalette 
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            actions={commandActions}
          />
          <Sidebar className={`border-r transition-colors duration-500 overflow-hidden ${isDarkMode ? (friendlyMode ? 'border-zinc-800 bg-[#0f0f11]' : 'border-zinc-900 bg-zinc-950') : 'border-zinc-200 bg-white'}`}>
            <SidebarHeader className="flex flex-col p-2 gap-2 h-auto">
              <div className="flex items-center gap-3 px-2 py-1">
                <Logo 
                  className="w-10 h-10 rounded-xl" 
                  isDarkMode={isDarkMode} 
                  imageSrc={isDarkMode ? darkLogo : lightLogo}
                  isSprite={false} 
                />
                <span className={`font-bold text-xl tracking-tight transition-all bg-clip-text text-transparent animate-shine ${isDarkMode ? 'bg-gradient-to-r from-zinc-400 via-white to-zinc-400' : 'bg-gradient-to-r from-zinc-700 via-zinc-900 to-zinc-700'} bg-[length:200%_auto] ${friendlyMode ? 'tracking-normal' : ''}`}>
                  Worp AI
                </span>
              </div>

              <div className="flex bg-zinc-900/50 p-1 rounded-lg gap-1 border border-zinc-800/50 mx-2">
                <button 
                  onClick={() => setActiveTab('chats')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'chats' ? 'bg-theme-accent text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <MessageSquare className="w-3 h-3" />
                  Terminal
                </button>
                <button 
                  onClick={() => setActiveTab('project')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'project' ? 'bg-theme-accent text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <FileCode className="w-3 h-3" />
                  Project
                </button>
              </div>
            </SidebarHeader>

            <SidebarContent className="px-2">
              {activeTab === 'chats' ? (
                <>
                  <SidebarGroup>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => startNewSession()}
                      className="text-zinc-400 hover:text-white hover:bg-zinc-900/60 rounded-lg group"
                    >
                      <Plus className="w-4 h-4 mr-2 group-hover:text-theme-accent transition-colors" />
                      <span>New chat</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel className="text-zinc-500 font-mono text-[9px] tracking-[0.2em] uppercase py-2">Neural Engine</SidebarGroupLabel>
                <SidebarMenu>
                  {[
                    { id: "gemini-2.0-flash", label: "Neural Flash 2.0", icon: <Zap className="w-4 h-4" />, desc: "Ultra-fast synaptic response" },
                    { id: "gemini-1.5-pro", label: "Intelligence Pro 1.5", icon: <Brain className="w-4 h-4" />, desc: "Complex logic & long-context" }
                  ].map((model) => (
                    <SidebarMenuItem key={model.id}>
                      <SidebarMenuButton
                        onClick={() => setAIModel(model.id as any)}
                        isActive={aiModel === model.id}
                        className={`rounded-lg py-6 ${aiModel === model.id ? "text-theme-accent bg-theme-accent-glow" : "text-zinc-500"}`}
                      >
                        <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                           <div className="flex items-center gap-2">
                             {model.icon}
                             <span className="text-[10px] font-black uppercase tracking-widest">{model.label}</span>
                           </div>
                           <span className="text-[8px] text-zinc-600 font-medium truncate w-full">{model.desc}</span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel className="text-zinc-500 font-mono text-[9px] tracking-[0.2em] uppercase py-2">Chat Protocols</SidebarGroupLabel>
                <SidebarMenu>
                  {(['standard', 'code', 'art', 'research'] as ChatMode[]).map((mode, i) => (
                    <motion.div
                      key={mode}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + (i * 0.05) }}
                    >
                      <SidebarMenuItem>
                        <SidebarMenuButton 
                          onClick={() => setChatMode(mode)}
                          isActive={chatMode === mode}
                          className={`capitalize rounded-lg ${chatMode === mode ? 'text-theme-accent bg-theme-accent-glow' : 'text-zinc-400 font-bold'}`}
                        >
                          <span className="mr-2">{modeIcons[mode]}</span>
                          <span className="text-[10px] uppercase tracking-wider">{mode} Mode</span>
                          {chatMode === mode && (
                            <motion.div 
                              layoutId="activeMode" 
                              className="ml-auto w-1 h-1 rounded-full bg-theme-accent shadow-[0_0_8px_var(--accent-glow)]" 
                            />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </motion.div>
                  ))}
                </SidebarMenu>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel className="text-zinc-500 font-mono text-[9px] tracking-[0.2em] uppercase py-2">Chats</SidebarGroupLabel>
                <ScrollArea className="h-[200px] px-2 shadow-inner">
                  <div className="space-y-1 py-1">
                    {sessions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setCurrentSessionId(s.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 group transition-all truncate ${currentSessionId === s.id ? 'bg-zinc-900 text-zinc-200 border-l-2 border-theme-accent' : 'text-zinc-500 hover:bg-zinc-900/40 hover:text-zinc-400'}`}
                      >
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${currentSessionId === s.id ? 'text-theme-accent' : 'text-zinc-600'}`} />
                        <span className="truncate flex-1 font-medium">{s.title}</span>
                         <Trash2 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (user) {
                              deleteDoc(doc(db, 'users', user.uid, 'sessions', s.id));
                              if (currentSessionId === s.id) setCurrentSessionId(null);
                            }
                          }}
                          className="w-3 h-3 text-zinc-700 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all" 
                         />
                      </button>
                    ))}
                    {sessions.length === 0 && (
                      <div className="py-4 text-center">
                        <p className="text-[10px] text-zinc-700 font-mono">NO SESSIONS FOUND</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </SidebarGroup>
              </>
              ) : (
                <div className="p-4 space-y-6">
                   <div className="space-y-4">
                     <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Monitor className="w-3 h-3" />
                        Virtual_Workspace
                      </h3>
                      
                      {virtualFiles.length === 0 ? (
                        <div className="py-20 text-center border border-dashed border-zinc-800 rounded-2xl">
                           <FileCode className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
                           <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest text-zinc-700">No Synaptic Files Found</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {virtualFiles.map((file, i) => (
                            <button 
                              key={i}
                              className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/50 hover:bg-zinc-900 transition-all group"
                            >
                              <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 group-hover:border-theme-accent/50 transition-colors">
                                <FileCode className="w-4 h-4 text-zinc-500 group-hover:text-theme-accent" />
                              </div>
                              <div className="flex-1 text-left overflow-hidden">
                                <p className="text-sm font-bold text-zinc-300 truncate">{file.name}</p>
                                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">{file.language}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                   </div>
                   
                   <div className="p-4 rounded-2xl bg-theme-accent/5 border border-theme-accent/10">
                      <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                        Synaptic extraction protocol automatically captures code blocks from your conversation and populates this terminal project.
                      </p>
                   </div>
                </div>
              )}
              
              <div className="mt-auto px-2 pb-4">
                <Card className={`overflow-hidden border transition-all duration-500 ${friendlyMode ? 'bg-gradient-to-br from-theme-accent/5 to-white/5 border-zinc-800' : 'bg-theme-accent-glow border-theme-accent-glow'}`}>
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-theme-accent" />
                      <span className="text-[10px] font-bold text-theme-accent uppercase tracking-widest">Enhanced Intelligence</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-relaxed mb-3">
                      Unlock reasoning models and infinite local history.
                    </p>
                    <ShimmerButton className="w-full h-8 text-[11px] font-bold rounded-lg" background="rgb(var(--accent-color))">
                      Upgrade Now
                    </ShimmerButton>
                  </div>
                </Card>
              </div>
            </SidebarContent>

            <SidebarFooter className={`border-t p-2 transition-colors duration-500 ${friendlyMode ? 'border-zinc-800' : 'border-zinc-900'}`}>
              {user ? (
                <div className="flex items-center gap-3 p-3 mb-2 rounded-xl border border-zinc-900 group hover:bg-zinc-900/40 transition-all cursor-default">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-zinc-800 shadow-sm" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-zinc-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-200 truncate">{user.email ? user.email.split('@')[0] : (user.displayName || 'User')}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                  </div>
                  <button onClick={() => logout()} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="w-full flex items-center justify-center gap-2 mb-2 px-4 py-2.5 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-200 transition-all shadow-lg"
                >
                  <LogIn className="w-4 h-4" />
                  Sign in to Sync
                </button>
              )}
              
              <Dialog>
                <DialogTrigger render={
                  <button className={`flex w-full items-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all group ${friendlyMode ? 'bg-white/5 text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}>
                    <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                    <span>Control Center</span>
                    <ChevronRight className="ml-auto w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </button>
                } />
                <DialogContent className="bg-zinc-950 border-zinc-900 text-zinc-200 sm:max-w-[425px] overflow-hidden p-0">
                  {/* Glass background effect */}
                  <div className="absolute inset-0 bg-theme-accent-glow/5 backdrop-blur-3xl pointer-events-none" />
                  
                  <div className="">
                    <DialogHeader className="relative pb-2 px-6 pt-6">
                      <DialogTitle className="text-xl font-bold tracking-tight">System Configuration</DialogTitle>
                      <DialogDescription className="text-zinc-500">
                        Personalize your Worp AI experience. All changes are cloud-synced.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <ScrollArea className="h-[450px] w-full rounded-md border-none">
                      <div className="grid gap-6 py-4 relative px-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                             <div className="space-y-0.5">
                                <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-2 uppercase tracking-widest">
                                   <Monitor className="w-3.5 h-3.5" /> Normal Mode
                                </h4>
                                <p className="text-[10px] text-zinc-600">Friendlier UI with softer edges and icons.</p>
                             </div>
                             <Switch 
                              checked={friendlyMode} 
                              onCheckedChange={setFriendlyMode}
                              className="data-[state=checked]:bg-theme-accent" 
                             />
                          </div>

                          <div className="flex items-center justify-between">
                             <div className="space-y-0.5">
                                <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-2 uppercase tracking-widest">
                                   {isDarkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />} Dark Mode
                                </h4>
                                <p className="text-[10px] text-zinc-600">Toggle between dark and light thematic state.</p>
                             </div>
                             <Switch 
                              checked={isDarkMode} 
                              onCheckedChange={setIsDarkMode}
                              className="data-[state=checked]:bg-theme-accent" 
                             />
                          </div>
                        </div>

                        <Separator className="bg-zinc-900" />

                        <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Layout className="w-3.5 h-3.5" /> Appearance
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            {themes.filter(t => t.id !== 'custom').map((t) => (
                              <button
                                key={t.id}
                                onClick={() => setTheme(t.id)}
                                className={`group relative aspect-square rounded-xl border transition-all ${profile?.theme === t.id ? 'border-theme-accent bg-theme-accent-glow' : 'border-zinc-800 bg-zinc-900/50'} p-1.5 hover:scale-[1.02]`}
                              >
                                <div className={`w-full h-full rounded-lg ${t.color} opacity-30 group-hover:opacity-100 transition-opacity flex items-center justify-center`}>
                                   {profile?.theme === t.id && <Zap className="w-4 h-4 text-white animate-pulse" />}
                                </div>
                                <span className="absolute bottom-1.5 left-1.5 text-[7px] font-bold text-white/50 uppercase tracking-tighter">{t.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Palette className="w-3.5 h-3.5" /> Precision Color
                          </h4>
                          <div className="flex items-center gap-6 p-4 rounded-xl shadow-inner border border-zinc-900 bg-zinc-950/50">
                            <div className="relative shrink-0">
                              <input 
                                type="color" 
                                value={rgbToHex(accentColor)}
                                onChange={handleHexChange}
                                className="w-12 h-12 rounded-xl cursor-not-allowed hidden lg:block"
                                id="customColor"
                              />
                              <label htmlFor="customColor" className="w-12 h-12 rounded-xl cursor-pointer bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors shadow-xl overflow-hidden">
                                 <div className="w-full h-full" style={{ backgroundColor: `rgb(${accentColor})` }} />
                              </label>
                              <input 
                                type="color" 
                                value={rgbToHex(accentColor)}
                                onChange={handleHexChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">ACCENT_RGB</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-theme-accent font-bold tracking-tighter">
                                  {accentColor}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
            </SidebarFooter>
          </Sidebar>

          {/* Main Area */}
          <main className={`flex-1 flex flex-col min-w-0 relative overflow-hidden ${isDarkMode ? '' : 'bg-white text-zinc-900 border-l border-zinc-200'}`}>
            {/* Background patterns */}
            <AnimatePresence>
              <motion.div 
                key={`${friendlyMode}-${isDarkMode}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
              >
                {isDarkMode ? (
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff25_1px,transparent_1px),linear-gradient(to_bottom,#ffffff25_1px,transparent_1px)] bg-[size:40px_40px]" />
                    {friendlyMode && (
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] brightness-125" />
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000015_1px,transparent_1px),linear-gradient(to_bottom,#00000015_1px,transparent_1px)] bg-[size:40px_40px]" />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Header Toolbar */}
            <motion.header 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`h-16 border-b flex items-center justify-between px-6 shrink-0 z-30 transition-all duration-500 backdrop-blur-xl ${isDarkMode ? (friendlyMode ? 'border-zinc-800 bg-[#0a0a0b]/80' : 'border-zinc-900 bg-zinc-950/80') : 'border-zinc-200 bg-white/80'}`}
            >
              <div className="flex items-center gap-4">
                <SidebarTrigger className={`transition-all ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'}`} />
                <Separator orientation="vertical" className={`h-4 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                <div className="flex items-center gap-2 bg-theme-accent-glow px-2.5 py-1 rounded-full border border-theme-accent/20">
                  {modeIcons[chatMode]}
                  <span className="text-[9px] font-bold text-theme-accent uppercase tracking-widest">{chatMode}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {currentSessionId && (
                  <button 
                    onClick={handleShare}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-theme-accent hover:bg-theme-accent/10 border border-theme-accent/20' : 'bg-theme-accent text-white shadow-lg'}`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                )}
                
                <Dialog>
                  <DialogTrigger render={
                    <button className={`p-2 rounded-lg transition-all ${friendlyMode ? 'text-zinc-600 hover:text-zinc-200 hover:bg-white/5' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}>
                      <Search className="w-4 h-4" />
                    </button>
                  } />
                  <DialogContent className="bg-zinc-950 border-zinc-900 text-zinc-200 sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Search Architecture</DialogTitle>
                      <DialogDescription>Search across all synaptic logs and neural sessions.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Input placeholder="Enter synaptic search term..." className="bg-zinc-900 border-zinc-800 text-zinc-200" />
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger render={
                    <button className={`p-2 rounded-lg transition-all ${friendlyMode ? 'text-zinc-600 hover:text-zinc-200 hover:bg-white/5' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}>
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  } />
                  <DialogContent className="bg-zinc-950 border-zinc-900 text-zinc-200 sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Worp Central Intelligence</DialogTitle>
                      <DialogDescription>Documentation and Operational Guidelines.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      <p className="text-sm font-mono text-zinc-400">COMMANDS:</p>
                      <ul className="text-xs space-y-2 text-zinc-500">
                        <li><span className="text-theme-accent">/mode [code|art|research]</span> - Switch neural processing engine.</li>
                        <li><span className="text-theme-accent">/clear</span> - Purge local session buffer.</li>
                        <li><span className="text-theme-accent">/style</span> - Toggle between Terminal and Normal UI.</li>
                      </ul>
                      <Separator className={`bg-zinc-900 ${isDarkMode ? '' : 'bg-zinc-200'}`} />
                      <p className={`text-xs ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>All data is processed using Gemini 2.0 Flash via the Worp Mesh.</p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </motion.header>

            {/* Scrollable Chat Area */}
            <div className="flex-1 relative overflow-hidden bg-transparent">
              <div 
                ref={scrollRef}
                className={`absolute inset-0 px-4 lg:px-8 custom-scrollbar pt-8 pb-32 ${messages.length > 0 ? 'overflow-y-auto' : 'overflow-y-hidden'}`}
              >
                <div className="max-w-4xl mx-auto flex flex-col min-h-full">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={chatMode + (messages.length > 0 ? '-active' : '-empty')}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 flex flex-col"
                    >
                      {messages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-center">
                          <BlurFade delay={0.2} inView>
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex flex-col items-center space-y-8 max-w-2xl px-4"
                            >
                              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-theme-accent/10 border border-theme-accent/20">
                                <Zap className="w-3 h-3 text-theme-accent" />
                                <span className="text-[10px] font-bold text-theme-accent uppercase tracking-widest">Neural_Core v2.0</span>
                              </div>
                              
                              <h1 className={`text-5xl md:text-7xl font-bold tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                                Welcome to <br />
                                <span className="text-theme-accent">Worp AI</span>
                              </h1>
                              
                              <p className="text-lg md:text-xl text-zinc-500 max-w-xl leading-relaxed">
                                Hello, {profile?.displayName || 'Explorer'}. I am your neural assistant for {chatMode} tasks. 
                                How can I help you excel today?
                              </p>

                              <div className="flex flex-wrap items-center justify-center gap-3">
                                {(MODE_CAPABILITIES[chatMode] ?? MODE_CAPABILITIES.standard).map((tag, idx) => (
                                  <span key={idx} className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border ${isDarkMode ? 'border-zinc-800 text-zinc-600' : 'border-zinc-200 text-zinc-400'}`}>
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </motion.div>
                          </BlurFade>
                        </div>
                      ) : (
                        <div className="space-y-8 pb-20">
                          {messages.map((m) => (
                            <motion.div 
                              key={m.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="group"
                            >
                              <ChatBlock 
                                id={m.id}
                                command={m.command}
                                response={m.response}
                                timestamp={m.timestamp}
                                isStreaming={m.isStreaming}
                                userName={profile?.displayName}
                                lightLogo={lightLogo}
                                darkLogo={darkLogo}
                              />
                              <div className="flex items-center gap-4 mt-4 px-12 opacity-0 group-hover:opacity-100 transition-opacity">
                                 {/* Minimalist actions can go here if needed, but keeping it clean for now */}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Bottom Input Area */}
            <div className="px-6 pb-6 pt-2 z-40 transition-all duration-700 bg-transparent flex flex-col items-center">
              <div className="max-w-4xl w-full">
                {/* Suggestions always above input - more compact and subtle */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={chatMode}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-wrap gap-2 justify-center sm:justify-start mb-4 opacity-90"
                  >
                    {(MODE_SUGGESTIONS[chatMode] ?? MODE_SUGGESTIONS.standard).map((item, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setInput(item.label); handleSendCommand(item.label); }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-[11px] font-medium border ${isDarkMode ? 'bg-zinc-900/50 text-zinc-400 border-zinc-800/80 hover:bg-zinc-800 hover:text-zinc-200' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}`}
                      >
                        <span className="text-theme-accent">{item.icon}</span>
                        {item.label}
                      </motion.button>
                    ))}
                  </motion.div>
                </AnimatePresence>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl p-1 border transition-all shadow-2xl relative backdrop-blur-xl ${isDarkMode ? 'bg-[#0f0f11]/80 border-zinc-800/50 focus-within:border-zinc-700' : 'bg-white/80 border-zinc-200 focus-within:border-zinc-300'}`}
                >
                  {attachedFile && (
                    <div className="px-4 py-2 flex items-center justify-between border-b border-zinc-800/50">
                      <div className="flex items-center gap-2">
                        {attachedFile.type.startsWith('image/') ? <Image className="w-4 h-4 text-theme-accent" /> : <FileText className="w-4 h-4 text-theme-accent" />}
                        <span className="text-xs font-mono text-zinc-400 truncate max-w-[200px]">{attachedFile.name}</span>
                      </div>
                      <button 
                        onClick={() => setAttachedFile(null)}
                        className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="pl-4 flex items-center gap-1 text-zinc-600 font-mono text-sm group-focus-within:text-theme-accent transition-colors">
                      <span>{">"}</span>
                      <span className="animate-pulse">_</span>
                    </div>
                    <Input 
                      placeholder="Ask Worp anything..."
                      className={`bg-transparent border-none focus-visible:ring-0 text-[15px] py-6 px-1 placeholder:text-zinc-600 font-sans tracking-tight ${isDarkMode ? 'text-zinc-300' : 'text-zinc-900'}`}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendCommand(input)}
                    />
                    <div className="flex items-center gap-1 pr-2">
                      <button 
                        onClick={() => handleSendCommand(input)}
                        className={`p-2 rounded-xl transition-all ${input.trim() ? 'bg-theme-accent text-zinc-950 shadow-[0_0_15px_var(--accent-glow)] scale-105' : 'bg-zinc-900 text-zinc-700'}`}
                      >
                        <SendHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="px-4 py-1.5 flex items-center justify-end">
                    <div className="flex gap-1">
                       <input 
                         type="file" 
                         ref={fileInputRef} 
                         className="hidden" 
                         onChange={handleFileChange}
                       />
                       <button 
                         onClick={() => fileInputRef.current?.click()}
                         className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-600 hover:text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700'}`}
                         title="Attach file"
                       >
                         <Plus className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={toggleListening}
                         className={`p-1 rounded transition-all ${
                           isListening 
                             ? 'bg-red-500/20 text-red-500 animate-pulse' 
                             : isDarkMode 
                               ? 'hover:bg-zinc-800 text-zinc-600 hover:text-zinc-400' 
                               : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700'
                         }`}
                         title={isListening ? "Listening..." : "Voice input"}
                       >
                         <Mic className={`w-4 h-4 ${isListening ? 'scale-110' : ''}`} />
                       </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-900 text-zinc-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-theme-accent" />
              Snapshot Published
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              Your neural session is now accessible via the synaptic mesh. This link is secret but public.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">Link</Label>
              <Input
                id="link"
                defaultValue={shareUrl}
                readOnly
                className="bg-zinc-900 border-zinc-800 text-zinc-400 text-xs font-mono"
              />
            </div>
            <Button 
              size="sm" 
              className="px-3 bg-theme-accent hover:bg-theme-accent/90"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                toast.success("Link copied to synaptic buffer");
              }}
            >
              <span className="sr-only">Copy</span>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <DialogClose render={
              <Button type="button" variant="secondary" className="bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border-none">
                Close Connection
              </Button>
            } />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}


