/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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
  SendHorizontal
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
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc, limit } from 'firebase/firestore';
import { db, signInWithGoogle, logout, auth } from './lib/firebase';
import { ThemeProvider, useTheme, ThemeType, ChatMode } from './lib/ThemeContext';
import { Logo } from './components/Logo';

import darkLogo from './logo3.jpg';
import lightLogo from './logo3.jpg';

import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

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

function AppContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [input, setInput] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const { 
    setTheme, setAccentColor, accentColor, 
    user, profile, loading, 
    chatMode, setChatMode,
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
      toast.success(`Attached: ${file.name}`);
      setInput(prev => prev + (prev ? ' ' : '') + `[File: ${file.name}] `);
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
      const stream = streamChat(command, history, chatMode);

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
          
          {/* Main Sidebar */}
          <Sidebar className={`border-r transition-colors duration-500 overflow-hidden ${isDarkMode ? (friendlyMode ? 'border-zinc-800 bg-[#0f0f11]' : 'border-zinc-900 bg-zinc-950') : 'border-zinc-200 bg-white'}`}>
            <SidebarHeader className="h-16 flex items-center px-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden transition-all ${friendlyMode ? 'bg-theme-accent/10 border border-theme-accent/20' : 'bg-theme-accent-glow border border-theme-accent-glow'}`}>
                   <Logo 
                     className="w-full h-full" 
                     isDarkMode={isDarkMode} 
                     lightImageSrc={lightLogo} 
                     darkImageSrc={darkLogo}
                     isSprite={false} 
                   />
                </div>
                <span className={`font-bold text-lg tracking-tight transition-all bg-clip-text text-transparent animate-shine ${isDarkMode ? 'bg-gradient-to-r from-zinc-400 via-white to-zinc-400' : 'bg-gradient-to-r from-zinc-600 via-zinc-900 to-zinc-600'} bg-[length:200%_auto] ${friendlyMode ? 'tracking-normal' : ''}`}>
                  Worp AI
                </span>
              </div>
            </SidebarHeader>

            <SidebarContent className="px-2">
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
                <SidebarGroupLabel className="text-zinc-500 font-mono text-[9px] tracking-[0.2em] uppercase py-2">Chat Modes</SidebarGroupLabel>
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
            <AnimatePresence mode="wait">
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
                                {[
                                  "Analyze complex codebases",
                                  "Generate creative art",
                                  "Solve logical puzzles"
                                ].map((tag, idx) => (
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
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap gap-2 justify-center sm:justify-start mb-4 opacity-90"
                >
                  {[
                    { label: "Latest tech news", icon: <Sparkles className="w-3 h-3" /> },
                    { label: "Show me a photo of a galaxy", icon: <Image className="w-3 h-3" /> },
                    { label: "Find best links for React", icon: <Search className="w-3 h-3" /> },
                  ].map((item, i) => (
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
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl p-1 border transition-all shadow-2xl relative backdrop-blur-xl ${isDarkMode ? 'bg-[#0f0f11]/80 border-zinc-800/50 focus-within:border-zinc-700' : 'bg-white/80 border-zinc-200 focus-within:border-zinc-300'}`}
                >
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
    </TooltipProvider>
  );
}
