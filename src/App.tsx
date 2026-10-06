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
  FileCode,
  RotateCcw,
  FileDown,
  AtSign,
  Link2,
  Sliders,
  Wand2,
  X,
  Paperclip,
  Layers,
  Files
} from 'lucide-react';
import { format } from 'date-fns';
import { getRandomSuggestions, SuggestionItem } from './data/suggestions';

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
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc, limit, updateDoc, getDocs } from 'firebase/firestore';
import { db, signInWithGoogle, logout, auth } from './lib/firebase';
import { ThemeProvider, useTheme, ThemeType, ChatMode } from './lib/ThemeContext';
import { Logo } from './components/Logo';
import { TerminalEffects } from './components/TerminalEffects';
import { CommandPalette } from './components/CommandPalette';
import { AuthDialog } from './components/AuthDialog';
import { CustomCommandsManager } from './components/CustomCommandsManager';
import { MultiItemModal } from './components/MultiItemModal';
import { 
  AttachedItem, 
  readFileAsAttachedItem, 
  formatFileSize, 
  getItemBadgeLabel 
} from './lib/attachmentUtils';
import { 
  CustomCommand, 
  DEFAULT_COMMANDS, 
  loadStoredCommands, 
  saveStoredCommands, 
  parseCommandCreation, 
  findMatchingCustomCommand 
} from './lib/customCommands';

import lightLogo from '/favicon.ico';
import darkLogo from './logo3.jpg';
import logo3 from './logo3.jpg';

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

export type { AttachedItem };

interface Message {
  id: string;
  command: string;
  response: string;
  timestamp: Date;
  isStreaming?: boolean;
  attachments?: AttachedItem[];
}

interface ChatSession {
  id: string;
  title: string;
  mode: string;
  createdAt: any;
}

function extractLinkedSessions(text: string, availableSessions: ChatSession[]): ChatSession[] {
  const matches: ChatSession[] = [];
  const addedIds = new Set<string>();

  // 1. Quoted session mention: @"Session Name"
  const quotedRegex = /@"([^"]+)"/g;
  let qm;
  while ((qm = quotedRegex.exec(text)) !== null) {
    const targetTitle = qm[1].trim().toLowerCase();
    const found = availableSessions.find(s => s.title.trim().toLowerCase() === targetTitle);
    if (found && !addedIds.has(found.id)) {
      matches.push(found);
      addedIds.add(found.id);
    }
  }

  // 2. Unquoted @slug or @name or @previous / @last
  const mentionRegex = /@([a-zA-Z0-9_\-\.]+)/g;
  let mm;
  while ((mm = mentionRegex.exec(text)) !== null) {
    const rawTag = mm[1].trim();
    const tagLower = rawTag.toLowerCase();

    if (tagLower === 'previous' || tagLower === 'last') {
      if (availableSessions.length > 0) {
        const prev = availableSessions[0];
        if (!addedIds.has(prev.id)) {
          matches.push(prev);
          addedIds.add(prev.id);
        }
      }
      continue;
    }

    const found = availableSessions.find(s => {
      const sTitle = s.title.trim().toLowerCase();
      const sClean = sTitle.replace(/\s+/g, '_');
      const sHyphen = sTitle.replace(/\s+/g, '-');
      return sTitle === tagLower || sClean === tagLower || sHyphen === tagLower || s.id === rawTag;
    });

    if (found && !addedIds.has(found.id)) {
      matches.push(found);
      addedIds.add(found.id);
    }
  }

  // 3. Match full session titles if prefixed with @
  for (const session of availableSessions) {
    if (!addedIds.has(session.id) && session.title) {
      const escaped = session.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`@${escaped}\\b`, 'i').test(text)) {
        matches.push(session);
        addedIds.add(session.id);
      }
    }
  }

  return matches;
}

function buildInitDirective(options: {
  attachedFiles?: AttachedItem[];
  attachedFile?: { name: string; type: string; data: string } | null;
  virtualFiles?: { name: string; content: string; language: string }[];
  linkedSessions?: ChatSession[];
}): string {
  const parts: string[] = [
    `[SYSTEM DIRECTIVE: \\INIT COMPREHENSIVE MULTI-MODAL INITIALIZATION PROTOCOL]`,
    `The user has invoked the \\init command. You are acting as an elite Principal Software & Systems Architect performing an exhaustive ingestion, audit, and structural breakdown of ALL available resources, code files, attachments, and referenced conversations.`,
    ``,
    `Your objectives:`,
    `1. COMPREHENSIVE INGESTION: Read, deconstruct, and absorb all attachments (images, documents, code files, datasets), virtual workspace files, and linked chat histories provided.`,
    `2. ARCHITECTURAL & STRUCTURAL AUDIT:`,
    `   - Identify schemas, data structures, state trees, logic pipelines, and API patterns.`,
    `   - If images/diagrams/screenshots are attached, describe their visual layout, components, UX elements, and implied functionality with precision.`,
    `3. ENTITY & DEPENDENCY EXTRACTION: Catalog all core entities, external libraries, runtime dependencies, and potential technical bottlenecks.`,
    `4. SITUATIONAL READINESS & RECOMMENDED ACTIONS:`,
    `   - Summarize the exact current state.`,
    `   - Outline concrete, executable implementation phases or next steps so the user can immediately build or refine upon this foundation.`,
    ``,
    `Provide a clean, highly structured, technical report with Markdown headers, bullet points, and code/table references where appropriate.`
  ];

  const allAttachments = options.attachedFiles && options.attachedFiles.length > 0 
    ? options.attachedFiles 
    : (options.attachedFile ? [options.attachedFile] : []);

  if (allAttachments.length > 0) {
    parts.push(``, `=== ATTACHED MULTI-MODAL ASSETS (${allAttachments.length} ITEMS) ===`);
    allAttachments.forEach((file, idx) => {
      parts.push(
        `--- Attachment [${idx + 1}/${allAttachments.length}]: "${file.name}" (Type: ${file.type}) ---`
      );
    });
  }

  if (options.virtualFiles && options.virtualFiles.length > 0) {
    parts.push(``, `=== VIRTUAL WORKSPACE PROJECT FILES (${options.virtualFiles.length} FILES) ===`);
    options.virtualFiles.forEach((file, idx) => {
      parts.push(
        `--- File [${idx + 1}/${options.virtualFiles!.length}]: ${file.name} (${file.language}) ---`,
        file.content.length > 2500 ? file.content.substring(0, 2500) + '\n... [truncated for brevity]' : file.content,
        `----------------------------------------`
      );
    });
  }

  return parts.join('\n');
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
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'chats' | 'project'>('chats');
  const [virtualFiles, setVirtualFiles] = useState<{ name: string, content: string, language: string }[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<AttachedItem[]>([]);
  const [isMultiItemModalOpen, setIsMultiItemModalOpen] = useState(false);
  const attachedFile = attachedFiles[0] || null;
  const setAttachedFile = (file: { name: string, type: string, data: string } | null) => {
    if (!file) {
      setAttachedFiles([]);
    } else {
      setAttachedFiles([{
        id: 'att_' + Date.now(),
        name: file.name,
        type: file.type,
        data: file.data
      }]);
    }
  };
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [mentionState, setMentionState] = useState<{
    isOpen: boolean;
    query: string;
    selectedIndex: number;
  }>({
    isOpen: false,
    query: '',
    selectedIndex: 0,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const filteredMentionSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(mentionState.query.toLowerCase())
  );

  const [customCommands, setCustomCommands] = useState<CustomCommand[]>(() => loadStoredCommands());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'system' | 'commands'>('system');
  const [slashCommandState, setSlashCommandState] = useState<{
    isOpen: boolean;
    query: string;
    selectedIndex: number;
  }>({
    isOpen: false,
    query: '',
    selectedIndex: 0,
  });

  const handleSaveCustomCommands = (newCommands: CustomCommand[]) => {
    setCustomCommands(newCommands);
    saveStoredCommands(newCommands);
  };

  const allAvailableCommands = [
    { name: '/init', description: 'Deep multi-modal audit of attachments & resources', prompt: '\\init', isBuiltIn: true },
    { name: '/export', description: 'Export current session chat history as Markdown', prompt: 'export', isBuiltIn: true },
    { name: '/clear', description: 'Purge local conversation buffer', prompt: 'clear', isBuiltIn: true },
    ...customCommands
  ];

  const filteredSlashCommands = allAvailableCommands.filter(c => 
    c.name.toLowerCase().includes(slashCommandState.query.toLowerCase()) ||
    c.description.toLowerCase().includes(slashCommandState.query.toLowerCase())
  );

  const insertSlashCommand = (cmd: { name: string; prompt?: string }) => {
    const cursor = textareaRef.current?.selectionStart ?? input.length;
    const textBeforeCursor = input.substring(0, cursor);
    const textAfterCursor = input.substring(cursor);
    const match = /(?:^|\s)([\/\\][a-zA-Z0-9_\-]*)$/.exec(textBeforeCursor);

    let newInput = '';
    let newCursorPos = 0;

    if (match) {
      const matchIndex = match.index + (match[0].startsWith(' ') ? 1 : 0);
      newInput = textBeforeCursor.substring(0, matchIndex) + `${cmd.name} ` + textAfterCursor;
      newCursorPos = matchIndex + cmd.name.length + 1;
    } else {
      newInput = `${input}${input && !input.endsWith(' ') ? ' ' : ''}${cmd.name} `;
      newCursorPos = newInput.length;
    }

    setInput(newInput);
    setSlashCommandState({ isOpen: false, query: '', selectedIndex: 0 });
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
    toast.success(`Command selected: ${cmd.name}`);
  };

  const insertMention = (session: ChatSession) => {
    const cursor = textareaRef.current?.selectionStart ?? input.length;
    const textBeforeCursor = input.substring(0, cursor);
    const textAfterCursor = input.substring(cursor);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    const titleToInsert = session.title.includes(' ') ? `@"${session.title}"` : `@${session.title}`;
    let newInput = '';
    let newCursorPos = 0;
    
    if (atIndex !== -1) {
      newInput = textBeforeCursor.substring(0, atIndex) + `${titleToInsert} ` + textAfterCursor;
      newCursorPos = atIndex + titleToInsert.length + 1;
    } else {
      newInput = `${input}${input && !input.endsWith(' ') ? ' ' : ''}${titleToInsert} `;
      newCursorPos = newInput.length;
    }

    setInput(newInput);
    setMentionState({ isOpen: false, query: '', selectedIndex: 0 });
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
    toast.success(`Linked context: @${session.title}`);
  };
  const { 
    setTheme, setAccentColor, accentColor, 
    user, profile, loading, 
    chatMode, setChatMode,
    friendlyMode, setFriendlyMode,
    isDarkMode, setIsDarkMode
  } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [randomSuggestions, setRandomSuggestions] = useState<SuggestionItem[]>(() => getRandomSuggestions('standard', 3));

  // Shuffle/update suggestions on mode change or first load
  useEffect(() => {
    setRandomSuggestions(getRandomSuggestions(chatMode, 3));
  }, [chatMode]);

  const refreshRandomSuggestions = () => {
    setRandomSuggestions(getRandomSuggestions(chatMode, 3));
  };

  const getSuggestionIcon = (iconType: string) => {
    switch (iconType) {
      case 'image': return <Image className="w-3 h-3" />;
      case 'search': return <Search className="w-3 h-3" />;
      case 'code': return <Code className="w-3 h-3" />;
      case 'brain': return <Brain className="w-3 h-3" />;
      case 'terminal': return <Terminal className="w-3 h-3" />;
      case 'palette': return <Palette className="w-3 h-3" />;
      case 'zap': return <Zap className="w-3 h-3" />;
      default: return <Sparkles className="w-3 h-3" />;
    }
  };

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
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(prev => prev + (prev ? ' ' : '') + transcript);
          setIsListening(false);
          toast.success("Voice captured");
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition status:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            toast.error("Microphone access is blocked. Please allow microphone permission in your browser to use voice input.", { duration: 4000 });
          } else if (event.error === 'audio-capture') {
            toast.error("No microphone was found. Please check your audio input device.");
          } else if (event.error === 'network') {
            toast.error("Speech service network error. Please try again.");
          } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
            toast.error(`Voice input error: ${event.error}`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn("Could not initialize SpeechRecognition:", err);
      }
    }
  }, []);

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in this browser environment. Chrome/Edge recommended.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        // Request microphone permission if available
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop the temporary stream right away
            stream.getTracks().forEach(track => track.stop());
          } catch (permErr: any) {
            if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
              toast.error("Microphone permission was denied. Please allow microphone access in your browser settings.");
              return;
            }
          }
        }
        setIsListening(true);
        recognitionRef.current.start();
        toast.info("Listening... Speak now", { duration: 2500 });
      } catch (e: any) {
        console.error("Speech start error:", e);
        setIsListening(false);
        if (e?.name !== 'InvalidStateError') {
          toast.error("Unable to start microphone. Please check browser permissions.");
        }
      }
    }
  };

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const toastId = toast.loading(`Processing ${fileArray.length} item${fileArray.length > 1 ? 's' : ''}...`);
    try {
      const newItems: AttachedItem[] = [];
      for (const file of fileArray) {
        const item = await readFileAsAttachedItem(file);
        newItems.push(item);
      }
      setAttachedFiles(prev => [...prev, ...newItems]);
      toast.success(`Attached ${newItems.length} item${newItems.length > 1 ? 's' : ''} to prompt box`, { id: toastId });
    } catch (err: any) {
      toast.error('Failed to attach files: ' + (err?.message || 'Unknown error'), { id: toastId });
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;
    await processFiles([file]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    const files = e.clipboardData?.files;
    const collectedFiles: File[] = [];

    // Collect all direct files
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file) collectedFiles.push(file);
      }
    }

    // Collect all items of kind 'file'
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file && !collectedFiles.some(f => f.name === file.name && f.size === file.size)) {
            collectedFiles.push(file);
          }
        }
      }
    }

    if (collectedFiles.length > 0) {
      const text = e.clipboardData.getData('text/plain');
      if (!text || text.trim() === '') {
        e.preventDefault();
      }
      await processFiles(collectedFiles);
    }
  };

  // Global paste handler so user can press Ctrl+V anywhere in the application
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      // If focused inside a different search or rename modal input, skip
      if (activeEl && activeEl.tagName === 'INPUT' && activeEl.id !== 'chat-user-input') {
        return;
      }
      const items = e.clipboardData?.items;
      const files = e.clipboardData?.files;
      const collectedFiles: File[] = [];

      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file) collectedFiles.push(file);
        }
      }

      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file && !collectedFiles.some(f => f.name === file.name && f.size === file.size)) {
              collectedFiles.push(file);
            }
          }
        }
      }

      if (collectedFiles.length > 0) {
        e.preventDefault();
        await processFiles(collectedFiles);
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Synchronize Tab Logo / Favicon dynamically based on Theme Mode (Light / Dark)
  useEffect(() => {
    const faviconElement = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    const shortcutIconElement = document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement;
    const appleIconElement = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;

    const activeLogo = isDarkMode ? logo3 : '/favicon.ico';

    if (faviconElement) {
      faviconElement.href = activeLogo;
    }
    if (shortcutIconElement) {
      shortcutIconElement.href = activeLogo;
    }
    if (appleIconElement) {
      appleIconElement.href = activeLogo;
    }
  }, [isDarkMode]);

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
    
    const trimmedCommand = (command || '').trim();
    if (!trimmedCommand && attachedFiles.length === 0) {
      return;
    }

    const effectiveCommand = trimmedCommand || (attachedFiles.length > 0 
      ? (attachedFiles.length === 1 
          ? (attachedFiles[0].type.startsWith('image/') 
              ? "Please analyze and explain this attached image." 
              : "Please analyze this attached file.")
          : `Please analyze and examine these ${attachedFiles.length} attached items in detail.`)
      : "");

    // Check if user is creating a custom command directly from the prompt area:
    // e.g. /createcommand /eli5 Explain in simple English like I am 5
    const creation = parseCommandCreation(effectiveCommand);
    if (creation) {
      const newCmd: CustomCommand = {
        id: 'cmd_' + Date.now(),
        name: creation.name,
        description: creation.description || (creation.prompt.length > 50 ? creation.prompt.substring(0, 50) + '...' : creation.prompt),
        prompt: creation.prompt,
        createdAt: new Date().toISOString()
      };
      const updated = [newCmd, ...customCommands.filter(c => c.name.toLowerCase() !== newCmd.name.toLowerCase())];
      handleSaveCustomCommands(updated);
      toast.success(`Custom command "${newCmd.name}" registered!`);

      const ackMessage: Message = {
        id: Math.random().toString(36).substring(7),
        command: effectiveCommand,
        response: `### ⚡ Custom Command Activated: \`${newCmd.name}\`\n\n**Directive (Simple English):**\n> "${newCmd.prompt}"\n\n**Quick Ways to Use It:**\n- In the prompt area: type \`${newCmd.name} [your input, code, or context]\`\n- Click the **\`/commands\`** pill below the prompt to pick it from the list\n- Open **Control Center > Custom Commands** in settings to edit, test, or fine-tune\n\n*The neural engine has memorized this directive and it is active immediately.*`,
        timestamp: new Date(),
        isStreaming: false
      };
      setMessages(prev => [...prev, ackMessage]);
      setInput('');
      return;
    }

    if (!sessionId && user) {
       await startNewSession(effectiveCommand);
       return;
    }

    const currentAttachments = [...attachedFiles];
    setAttachedFiles([]); // Clear attached items after dispatch

    const newMessageId = Math.random().toString(36).substring(7);
    const userMessage: Message = {
      id: newMessageId,
      command: effectiveCommand,
      response: '',
      timestamp: new Date(),
      isStreaming: true,
      attachments: currentAttachments,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    setInput('');

    try {
      // 1. Check if invoking a registered custom command
      const customMatch = findMatchingCustomCommand(effectiveCommand, customCommands);
      let customCommandDirective = '';
      if (customMatch) {
        customCommandDirective = `[CUSTOM USER COMMAND ACTIVATED: "${customMatch.command.name}"]\n` +
          `Directive: ${customMatch.command.prompt}\n\n` +
          `[USER INPUT / CONTENT]:\n${customMatch.rest || '(Apply directive to current attachments and context)'}`;
        toast.info(`Executing custom command ${customMatch.command.name}...`);
      }

      // 2. Resolve Linked Chats (@...)
      const linked = extractLinkedSessions(effectiveCommand, sessions);
      let linkedContextText = '';
      
      if (linked.length > 0) {
        toast.info(`Retrieving context from ${linked.length} linked chat(s)...`);
        for (const sess of linked) {
          try {
            if (user) {
              const snap = await getDocs(
                query(
                  collection(db, 'users', user.uid, 'sessions', sess.id, 'messages'),
                  orderBy('timestamp', 'asc'),
                  limit(30)
                )
              );
              const historyText = snap.docs.map(d => {
                const data = d.data();
                return `${data.role === 'user' ? 'User' : 'AI Assistant'}: ${data.text}`;
              }).join('\n\n');

              if (historyText) {
                linkedContextText += `\n[LINKED CONVERSATION RESOURCE: @"${sess.title}" (Mode: ${sess.mode}, Session ID: ${sess.id})]\n${historyText}\n[END OF LINKED CONVERSATION @"${sess.title}"]\n`;
              }
            }
          } catch (linkErr) {
            console.warn("Failed fetching linked conversation:", linkErr);
          }
        }
      }

      // 3. Check for \init or /init command
      const isInitCommand = /^\s*(\\|\/)init\b/i.test(effectiveCommand) || effectiveCommand.includes('\\init') || effectiveCommand.includes('/init');
      let initDirectiveText = '';
      if (isInitCommand) {
        initDirectiveText = buildInitDirective({
          attachedFiles: currentAttachments,
          virtualFiles: virtualFiles,
          linkedSessions: linked
        });
        toast.success("Executing \\init Multi-Modal Deep Analysis Protocol...");
      }

      // 4. Construct the enriched prompt for the model
      let aiPrompt = effectiveCommand;
      if (customCommandDirective) {
        aiPrompt = `${customCommandDirective}\n\n[ORIGINAL INVOCATION]:\n${aiPrompt}`;
      }
      if (linkedContextText) {
        aiPrompt = `${linkedContextText}\n\n[USER QUERY WITH REFERENCED CONTEXT ABOVE]:\n${aiPrompt}`;
      }
      if (initDirectiveText) {
        aiPrompt = `${initDirectiveText}\n\n[USER INVOCATION]:\n${aiPrompt}`;
      }

      // Save User Message to Firestore in the background without blocking stream start
      if (user && sessionId) {
        addDoc(collection(db, 'users', user.uid, 'sessions', sessionId, 'messages'), {
          role: 'user',
          text: effectiveCommand,
          timestamp: serverTimestamp()
        }).catch(err => console.warn("Firestore user message background save warning:", err));
      }

      const history = messages.slice(-10).map(m => [
        { role: 'user' as const, parts: [{ text: m.command }] },
        { role: 'model' as const, parts: [{ text: m.response }] }
      ]).flat();

      let fullResponse = '';
      const stream = streamChat(aiPrompt, history, chatMode, currentAttachments);

      for await (const delta of stream) {
        fullResponse += delta;
        setMessages(prev => prev.map(m => 
          m.id === newMessageId ? { ...m, response: fullResponse } : m
        ));
      }

      // Save Model Response to Firestore in background
      if (user && sessionId) {
        addDoc(collection(db, 'users', user.uid, 'sessions', sessionId, 'messages'), {
          role: 'model',
          text: fullResponse,
          timestamp: serverTimestamp()
        }).catch(err => console.warn("Firestore model message background save warning:", err));
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
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        setIsMultiItemModalOpen(true);
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
      shortcut: '⌘+SHIFT+N',
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
    { 
      id: 'auth-modal', 
      label: user ? 'Operative Profile / Switch Account' : 'Sign in / Authenticate (Email & Google)', 
      icon: <LogIn className="w-4 h-4" />, 
      category: 'Account', 
      action: () => setIsAuthDialogOpen(true) 
    },
    { 
      id: 'export-markdown', 
      label: 'Export Current Session (Markdown)', 
      icon: <FileDown className="w-4 h-4" />, 
      category: 'System', 
      action: () => handleExportMarkdown() 
    },
    { 
      id: 'init-protocol', 
      label: '\\init Multi-Modal Deep Analysis Protocol', 
      icon: <Zap className="w-4 h-4 text-amber-400" />, 
      category: 'Intelligence', 
      action: () => {
        setInput(prev => prev.trim() ? prev + ' \\init' : '\\init ');
        setTimeout(() => textareaRef.current?.focus(), 50);
      } 
    },
    { 
      id: 'custom-commands-studio', 
      label: 'Custom Commands Studio (Create in Simple English)', 
      icon: <Terminal className="w-4 h-4 text-theme-accent" />, 
      category: 'Intelligence', 
      action: () => {
        setActiveSettingsTab('commands');
        setIsSettingsOpen(true);
      } 
    },
    { 
      id: 'control-center-settings', 
      label: 'Control Center / System Configuration', 
      icon: <Settings className="w-4 h-4" />, 
      category: 'System', 
      action: () => {
        setActiveSettingsTab('system');
        setIsSettingsOpen(true);
      } 
    },
    { 
      id: 'link-chat-mention', 
      label: 'Link Previous Chat Session (@)', 
      icon: <AtSign className="w-4 h-4 text-theme-accent" />, 
      category: 'Intelligence', 
      action: () => {
        setInput(prev => prev + (prev && !prev.endsWith(' ') ? ' @' : '@'));
        setMentionState({ isOpen: true, query: '', selectedIndex: 0 });
        setTimeout(() => textareaRef.current?.focus(), 50);
      } 
    },
    { 
      id: 'multi-item-add', 
      label: 'Add / Paste Multiple Items (Files, Images, Snippets, URLs)', 
      icon: <Layers className="w-4 h-4 text-theme-accent" />, 
      shortcut: '⌘+SHIFT+U',
      category: 'Attachments', 
      action: () => setIsMultiItemModalOpen(true) 
    },
  ];

  const handleExportMarkdown = () => {
    if (messages.length === 0) {
      toast.error("No messages in the current session to export.");
      return;
    }

    const currentSession = sessions.find(s => s.id === currentSessionId);
    const sessionTitle = currentSession?.title || 'Worp AI Conversation';
    const timestampStr = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const safeSlug = sessionTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 40) || 'chat-history';

    let markdown = `# ${sessionTitle}\n\n`;
    markdown += `> **Export Date:** ${timestampStr}  \n`;
    markdown += `> **Neural Mode:** ${chatMode.toUpperCase()}  \n`;
    markdown += `> **Total Exchanges:** ${messages.length}  \n\n`;
    markdown += `---\n\n`;

    messages.forEach((msg, idx) => {
      const msgTime = format(msg.timestamp || new Date(), 'yyyy-MM-dd HH:mm:ss');
      const author = profile?.displayName || user?.displayName || 'User';
      markdown += `### 👤 ${author} (${msgTime})\n\n`;
      markdown += `${msg.command}\n\n`;
      markdown += `### 🤖 Worp AI\n\n`;
      markdown += `${msg.response || '*(No response)*'}\n\n`;
      if (idx < messages.length - 1) {
        markdown += `---\n\n`;
      }
    });

    try {
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${safeSlug}-${format(new Date(), 'yyyyMMdd-HHmmss')}.md`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      toast.success("Chat history exported as Markdown file!");
    } catch (err) {
      console.error("Markdown export failed:", err);
      toast.error("Failed to export chat history.");
    }
  };

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
    } catch (error: any) {
      console.warn("Google popup interrupted or blocked, opening Auth Dialog", error);
      setIsAuthDialogOpen(true);
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
          
          {crtEnabled && <TerminalEffects />}
          
          <CommandPalette 
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            actions={commandActions}
          />
          <Sidebar className={`border-r transition-colors duration-500 overflow-hidden ${isDarkMode ? (friendlyMode ? 'border-zinc-800 bg-[#0f0f11]' : 'border-zinc-900 bg-zinc-950') : 'border-zinc-200 bg-white'}`}>
            <SidebarHeader className="flex flex-col p-2 gap-2 h-auto">
              <div className="flex items-center gap-3 px-2 py-1">
                <Logo 
                  className="w-10 h-10 rounded-xl text-theme-accent" 
                  isDarkMode={isDarkMode} 
                  imageSrc="/favicon.ico"
                  lightImageSrc="/favicon.ico"
                  darkImageSrc={logo3}
                />
                <span className={`font-bold text-xl tracking-tight transition-all bg-clip-text text-transparent animate-shine ${isDarkMode ? 'bg-gradient-to-r from-zinc-400 via-white to-zinc-400' : 'bg-gradient-to-r from-zinc-700 via-zinc-900 to-zinc-700'} bg-[length:200%_auto] ${friendlyMode ? 'tracking-normal' : ''}`}>
                  Worp AI
                </span>
              </div>

              <div className="grid grid-cols-2 bg-zinc-900/50 p-1 rounded-lg gap-1 border border-zinc-800/50 mx-2">
                <button 
                  id="tab-terminal-btn"
                  onClick={() => setActiveTab('chats')}
                  className={`flex items-center justify-center gap-1 py-1.5 rounded-md text-[8.5px] font-bold uppercase tracking-wider transition-all ${activeTab === 'chats' ? 'bg-theme-accent text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                  title="Terminal"
                >
                  <MessageSquare className="w-3 h-3 shrink-0" />
                  <span className="hidden min-[380px]:inline">Term</span>
                </button>
                <button 
                  id="tab-project-btn"
                  onClick={() => setActiveTab('project')}
                  className={`flex items-center justify-center gap-1 py-1.5 rounded-md text-[8.5px] font-bold uppercase tracking-wider transition-all ${activeTab === 'project' ? 'bg-theme-accent text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                  title="Project Workspace"
                >
                  <FileCode className="w-3 h-3 shrink-0" />
                  <span className="hidden min-[380px]:inline">Proj</span>
                </button>
              </div>
            </SidebarHeader>

            <SidebarContent className="px-2">
              {activeTab === 'chats' && (
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
              </>
              )}

              {activeTab === 'project' && (
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

            <SidebarFooter className={`border-t p-2 transition-colors duration-500 ${isDarkMode ? (friendlyMode ? 'border-zinc-800' : 'border-zinc-900') : 'border-zinc-200'}`}>
              {user ? (
                <div className={`flex items-center gap-3 p-3 mb-2 rounded-xl border transition-all cursor-pointer ${
                  isDarkMode 
                    ? 'border-zinc-900 hover:bg-zinc-900/40 bg-zinc-950/40' 
                    : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 shadow-xs'
                }`} onClick={() => setIsAuthDialogOpen(true)}>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-zinc-800 shadow-sm" referrerPolicy="no-referrer" />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                      <UserIcon className={`w-4 h-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-700'}`} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900 font-extrabold'}`}>
                      {user.isAnonymous ? 'Guest Operative' : (user.displayName || (user.email ? user.email.split('@')[0] : 'Operative'))}
                    </p>
                    <p className={`text-[10px] truncate ${isDarkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
                      {user.isAnonymous ? 'Ephemeral Sync' : (user.email || 'Synced to Mesh')}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); logout(); toast.info("Disconnected from session"); }} 
                    className={`p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-500 hover:text-white' : 'hover:bg-zinc-200 text-zinc-600 hover:text-zinc-950'}`}
                    title="Log Out"
                  >
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
              
              <button 
                onClick={() => {
                  setActiveSettingsTab('commands');
                  setIsSettingsOpen(true);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl transition-all group mb-1 ${friendlyMode ? 'bg-white/5 text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
                title="Create and manage custom commands in simple English"
              >
                <Terminal className="w-4 h-4 text-theme-accent group-hover:scale-110 transition-transform" />
                <span>Custom Commands</span>
                <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 group-hover:text-theme-accent font-bold">
                  {customCommands.length}
                </span>
              </button>

              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger render={
                  <button 
                    onClick={() => {
                      setActiveSettingsTab('system');
                      setIsSettingsOpen(true);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all group ${friendlyMode ? 'bg-white/5 text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
                  >
                    <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                    <span>Control Center</span>
                    <ChevronRight className="ml-auto w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </button>
                } />
                <DialogContent className={`bg-zinc-950 border-zinc-900 text-zinc-200 overflow-hidden p-0 transition-all duration-300 ${activeSettingsTab === 'commands' ? 'sm:max-w-2xl max-w-2xl' : 'sm:max-w-[460px]'}`}>
                  {/* Glass background effect */}
                  <div className="absolute inset-0 bg-theme-accent-glow/5 backdrop-blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col h-full max-h-[85vh]">
                    <DialogHeader className="relative pb-2 px-6 pt-6">
                      <DialogTitle className="text-xl font-bold tracking-tight">System Configuration</DialogTitle>
                      <DialogDescription className="text-zinc-500">
                        Personalize your Worp AI experience, theme, and custom commands.
                      </DialogDescription>

                      {/* Tab Switcher */}
                      <div className="flex items-center gap-2 pt-3 border-b border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setActiveSettingsTab('system')}
                          className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
                            activeSettingsTab === 'system'
                              ? 'border-theme-accent text-white'
                              : 'border-transparent text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>System & Appearance</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSettingsTab('commands')}
                          className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
                            activeSettingsTab === 'commands'
                              ? 'border-theme-accent text-white'
                              : 'border-transparent text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          <Terminal className="w-3.5 h-3.5 text-theme-accent" />
                          <span>Custom Commands</span>
                          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-theme-accent/20 text-theme-accent border border-theme-accent/30 font-bold">
                            {customCommands.length}
                          </span>
                        </button>
                      </div>
                    </DialogHeader>
                    
                    <ScrollArea className="flex-1 w-full max-h-[580px] rounded-md border-none">
                      {activeSettingsTab === 'system' ? (
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
                      ) : (
                        <div className="py-4 px-6 relative">
                          <CustomCommandsManager 
                            commands={customCommands}
                            onSaveCommands={handleSaveCustomCommands}
                            onSelectCommand={(cmd) => {
                              insertSlashCommand(cmd);
                              setIsSettingsOpen(false);
                            }}
                            isDarkMode={isDarkMode}
                          />
                        </div>
                      )}
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
                {currentSessionId && (
                  <button 
                    onClick={handleShare}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-theme-accent hover:bg-theme-accent/10 border border-theme-accent/20' : 'bg-theme-accent text-white shadow-lg'}`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                )}

                {messages.length > 0 && (
                  <button 
                    onClick={handleExportMarkdown}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[11px] font-bold uppercase tracking-widest ${
                      isDarkMode 
                        ? 'text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 shadow-sm' 
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 shadow-sm'
                    }`}
                    title="Export current session's chat history as Markdown (.md)"
                    aria-label="Export chat history as Markdown"
                  >
                    <FileDown className="w-3.5 h-3.5 text-theme-accent" />
                    <span>Export MD</span>
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
                      <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Built and architected by <span className={`${isDarkMode ? 'text-zinc-100' : 'text-zinc-950 font-bold'}`}>Aum Chauhan</span> • Powered by Worp Neural Engine</p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </motion.header>

            {/* Scrollable Chat Area */}
            <div className="flex-1 relative overflow-hidden bg-transparent">
              <div 
                ref={scrollRef}
                className="absolute inset-0 px-4 lg:px-8 custom-scrollbar pt-4 pb-4 overflow-y-auto"
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
                        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center my-auto">
                          <BlurFade delay={0.1} inView>
                            <motion.div 
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex flex-col items-center space-y-6 max-w-2xl px-4"
                            >
                              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-theme-accent/10 border border-theme-accent/20">
                                <Zap className="w-3 h-3 text-theme-accent" />
                                <span className="text-[10px] font-bold text-theme-accent uppercase tracking-widest">Neural_Core v2.0</span>
                              </div>
                              
                              <h1 className={`text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                                Welcome to <span className="text-theme-accent">Worp AI</span>
                              </h1>
                              
                              <p className={`text-sm sm:text-base max-w-lg leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-700'}`}>
                                Hello, <strong className={`font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-950 font-bold'}`}>{profile?.displayName || user?.displayName || 'Explorer'}</strong>. I am your neural assistant for {chatMode} tasks. 
                                How can I help you excel today?
                              </p>

                              <div className="flex flex-wrap items-center justify-center gap-2">
                                {[
                                  "Analyze complex codebases",
                                  "Generate creative art",
                                  "Solve logical puzzles"
                                ].map((tag, idx) => (
                                  <span key={idx} className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border ${isDarkMode ? 'border-zinc-800 text-zinc-500' : 'border-zinc-200 text-zinc-400'}`}>
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </motion.div>
                          </BlurFade>
                        </div>
                      ) : (
                        <div className="space-y-6 pb-4">
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
                                lightLogo="/favicon.ico"
                                darkLogo={logo3}
                                attachments={m.attachments}
                              />
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
                {/* Dynamic Randomized Suggestions with High Contrast */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mb-4"
                >
                  {randomSuggestions.map((item, i) => (
                    <motion.button 
                      key={`${item.label}-${i}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setInput(item.label); handleSendCommand(item.label); }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-[11px] font-semibold border ${
                        isDarkMode 
                          ? 'bg-zinc-900/70 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white' 
                          : 'bg-white text-zinc-800 border-zinc-300/90 hover:bg-zinc-100 hover:text-zinc-950 shadow-xs'
                      }`}
                    >
                      <span className="text-theme-accent shrink-0">{getSuggestionIcon(item.iconType)}</span>
                      <span className="truncate max-w-[240px] sm:max-w-none">{item.label}</span>
                    </motion.button>
                  ))}

                  {/* Quick Shuffle/Randomize button */}
                  <motion.button
                    whileHover={{ scale: 1.05, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={refreshRandomSuggestions}
                    className={`p-1.5 rounded-full transition-all border ${
                      isDarkMode 
                        ? 'bg-zinc-900/70 text-zinc-400 border-zinc-800 hover:text-theme-accent hover:bg-zinc-800' 
                        : 'bg-white text-zinc-600 border-zinc-300/90 hover:text-zinc-950 hover:bg-zinc-100 shadow-xs'
                    }`}
                    title="Get new random suggestions"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </motion.button>

                  {attachedFile && (
                    <motion.button
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={() => {
                        setInput('\\init Perform exhaustive structural analysis of this attachment');
                        handleSendCommand('\\init Perform exhaustive structural analysis of this attachment');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm animate-pulse hover:bg-amber-500/30 transition-all ml-1"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>\init: Deep Analyze Attachment</span>
                    </motion.button>
                  )}
                </motion.div>

                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onPaste={handlePaste}
                  className={`rounded-xl p-1 border transition-all shadow-2xl relative backdrop-blur-xl ${
                    isDraggingOver 
                      ? 'border-theme-accent ring-2 ring-theme-accent/40 bg-theme-accent/5' 
                      : isDarkMode 
                        ? 'bg-[#0f0f11]/80 border-zinc-800/50 focus-within:border-zinc-700' 
                        : 'bg-white/80 border-zinc-200 focus-within:border-zinc-300'
                  }`}
                >
                  {/* Floating Mention Autocomplete for Chat Linking */}
                  <AnimatePresence>
                    {mentionState.isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        className={`absolute bottom-full left-0 right-0 mb-3 rounded-2xl border shadow-2xl p-2 z-50 backdrop-blur-2xl max-h-64 overflow-y-auto custom-scrollbar ${
                          isDarkMode 
                            ? 'bg-zinc-950/95 border-zinc-800 text-zinc-200' 
                            : 'bg-white/95 border-zinc-300 text-zinc-900 shadow-xl'
                        }`}
                      >
                        <div className="flex items-center justify-between px-3 py-1.5 mb-1.5 border-b border-zinc-800/40">
                          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-theme-accent uppercase tracking-wider">
                            <AtSign className="w-3.5 h-3.5" />
                            Link Previous Chat Context (@...)
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono">Use ↑↓ keys & Enter</span>
                        </div>
                        {filteredMentionSessions.length === 0 ? (
                          <div className="py-4 text-center text-xs text-zinc-500 font-mono">
                            {sessions.length === 0 ? "No saved sessions yet. Start a chat to link history!" : "No matching chat sessions found"}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {filteredMentionSessions.map((s, idx) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => insertMention(s)}
                                onMouseEnter={() => setMentionState(prev => ({ ...prev, selectedIndex: idx }))}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all ${
                                  idx === mentionState.selectedIndex
                                    ? 'bg-theme-accent text-zinc-950 font-bold shadow-md scale-[1.01]'
                                    : isDarkMode
                                      ? 'hover:bg-zinc-900 text-zinc-300'
                                      : 'hover:bg-zinc-100 text-zinc-800'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`p-1.5 rounded-lg shrink-0 ${
                                    idx === mentionState.selectedIndex 
                                      ? 'bg-black/20 text-zinc-950' 
                                      : isDarkMode 
                                        ? 'bg-zinc-900 text-theme-accent' 
                                        : 'bg-zinc-100 text-theme-accent'
                                  }`}>
                                    <Link2 className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="truncate font-semibold text-[13px]">@{s.title}</span>
                                    <span className={`text-[10px] font-mono truncate ${idx === mentionState.selectedIndex ? 'text-zinc-800' : 'text-zinc-500'}`}>
                                      Mode: {s.mode.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                                  idx === mentionState.selectedIndex 
                                    ? 'bg-black/20 text-zinc-950 font-bold' 
                                    : isDarkMode 
                                      ? 'bg-zinc-900 text-zinc-400' 
                                      : 'bg-zinc-100 text-zinc-600'
                                }`}>
                                  Link
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Slash Command Autocomplete Popover */}
                  <AnimatePresence>
                    {slashCommandState.isOpen && filteredSlashCommands.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className={`absolute bottom-full left-0 right-0 mb-2 rounded-2xl border shadow-2xl overflow-hidden z-40 max-h-72 flex flex-col ${
                          isDarkMode 
                            ? 'bg-zinc-950/95 border-zinc-800 backdrop-blur-xl' 
                            : 'bg-white/95 border-zinc-300 backdrop-blur-xl'
                        }`}
                      >
                        <div className={`px-3 py-2 border-b flex items-center justify-between text-[11px] font-mono ${
                          isDarkMode ? 'border-zinc-800 text-zinc-400 bg-zinc-900/60' : 'border-zinc-200 text-zinc-600 bg-zinc-50'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-theme-accent" />
                            <span className="font-bold uppercase tracking-wider text-theme-accent">Commands & Directives</span>
                            <span className="text-[10px] text-zinc-500">({filteredSlashCommands.length})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSlashCommandState(prev => ({ ...prev, isOpen: false }));
                              setActiveSettingsTab('commands');
                              setIsSettingsOpen(true);
                            }}
                            className="hover:underline flex items-center gap-1 text-[10px] text-theme-accent hover:opacity-80 transition-opacity"
                          >
                            <Settings className="w-3 h-3" />
                            <span>Manage in Settings</span>
                          </button>
                        </div>

                        <div className="p-1.5 overflow-y-auto space-y-1 custom-scrollbar">
                          {filteredSlashCommands.map((cmd, idx) => (
                            <button
                              key={cmd.name}
                              type="button"
                              onClick={() => insertSlashCommand(cmd)}
                              onMouseEnter={() => setSlashCommandState(prev => ({ ...prev, selectedIndex: idx }))}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all ${
                                idx === slashCommandState.selectedIndex
                                  ? 'bg-theme-accent text-zinc-950 font-bold shadow-md scale-[1.01]'
                                  : isDarkMode
                                    ? 'hover:bg-zinc-900 text-zinc-300'
                                    : 'hover:bg-zinc-100 text-zinc-800'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`p-1.5 rounded-lg shrink-0 ${
                                  idx === slashCommandState.selectedIndex 
                                    ? 'bg-black/20 text-zinc-950' 
                                    : isDarkMode 
                                      ? 'bg-zinc-900 text-theme-accent' 
                                      : 'bg-zinc-100 text-theme-accent'
                                }`}>
                                  {cmd.name === '/init' ? <Zap className="w-3.5 h-3.5 text-amber-400" /> : <Terminal className="w-3.5 h-3.5" />}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate font-mono font-bold text-[13px]">{cmd.name}</span>
                                  <span className={`text-[11px] truncate ${idx === slashCommandState.selectedIndex ? 'text-zinc-800' : 'text-zinc-500'}`}>
                                    {cmd.description}
                                  </span>
                                </div>
                              </div>
                              <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                                idx === slashCommandState.selectedIndex 
                                  ? 'bg-black/20 text-zinc-950 font-bold' 
                                  : isDarkMode 
                                    ? 'bg-zinc-900 text-zinc-400' 
                                    : 'bg-zinc-100 text-zinc-600'
                              }`}>
                                {'isBuiltIn' in cmd && cmd.isBuiltIn ? 'System' : 'Custom'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isDraggingOver && (
                    <div className="absolute inset-0 z-30 rounded-xl bg-zinc-950/85 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-theme-accent text-theme-accent font-mono text-xs font-bold uppercase tracking-wider animate-pulse pointer-events-none">
                      <div className="flex items-center gap-2">
                        <Image className="w-5 h-5" />
                        <span>Drop Image or File to Attach</span>
                      </div>
                    </div>
                  )}

                  {attachedFiles.length > 0 && (
                    <div className={`px-3 py-2 border-b rounded-t-lg flex flex-col gap-2 transition-all ${
                      isDarkMode ? 'border-zinc-800/60 bg-zinc-900/60' : 'border-zinc-200 bg-zinc-50/90'
                    }`}>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-theme-accent uppercase flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            <span>Attached Items</span>
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-theme-accent/20 text-theme-accent font-bold border border-theme-accent/30">
                            {attachedFiles.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setIsMultiItemModalOpen(true)}
                            className="text-theme-accent hover:underline flex items-center gap-1 hover:opacity-80 transition-opacity"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add / Paste More</span>
                          </button>
                          <span className="text-zinc-600">•</span>
                          <button
                            type="button"
                            onClick={() => setAttachedFiles([])}
                            className="text-zinc-500 hover:text-red-400 hover:underline flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Clear All</span>
                          </button>
                        </div>
                      </div>

                      {/* Horizontally scrollable chips */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 custom-scrollbar">
                        {attachedFiles.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className={`flex items-center gap-2 p-1.5 pr-2 rounded-xl border text-xs shrink-0 max-w-[260px] transition-all group ${
                              isDarkMode 
                                ? 'bg-zinc-950/80 border-zinc-800 text-zinc-200 hover:border-zinc-700' 
                                : 'bg-white border-zinc-200 text-zinc-800 hover:border-zinc-300'
                            }`}
                          >
                            {item.type.startsWith('image/') && item.data ? (
                              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-zinc-700 shrink-0 bg-black/40">
                                <img
                                  src={`data:${item.type};base64,${item.data}`}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-theme-accent/15 border border-theme-accent/30 flex items-center justify-center text-theme-accent shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                            )}
                            <div className="flex flex-col min-w-0 pr-1 text-left">
                              <span className="text-[11px] font-medium truncate max-w-[130px]" title={item.name}>
                                {item.name}
                              </span>
                              <div className="flex items-center gap-1 text-[9px] font-mono text-zinc-500">
                                <span className="uppercase text-theme-accent font-semibold">
                                  {getItemBadgeLabel(item)}
                                </span>
                                {item.size ? <span>• {formatFileSize(item.size)}</span> : null}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAttachedFiles(prev => prev.filter(f => f.id !== item.id))}
                              className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-800/60 transition-colors ml-auto shrink-0"
                              title={`Remove ${item.name}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2 pt-2 px-2">
                    <div className="pl-2 pt-2.5 flex items-center gap-1 text-zinc-600 font-mono text-sm group-focus-within:text-theme-accent transition-colors shrink-0">
                      <span>{">"}</span>
                      <span className="animate-pulse">_</span>
                    </div>
                    <textarea 
                      id="chat-user-input"
                      ref={textareaRef}
                      rows={1}
                      placeholder="Ask anything"
                      className={`bg-transparent border-none focus:outline-none focus:ring-0 text-[15px] py-2 px-1 placeholder:text-zinc-500 font-sans tracking-tight resize-none flex-1 min-h-[40px] max-h-[220px] overflow-y-auto leading-relaxed custom-scrollbar ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}
                      value={input}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        setInput(newVal);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 220)}px`;

                        const cursor = e.target.selectionStart || 0;
                        const textBeforeCursor = newVal.substring(0, cursor);
                        const atMatch = /@([^\s@]*)$/.exec(textBeforeCursor);
                        const slashMatch = /(?:^|\s)([\/\\][a-zA-Z0-9_\-]*)$/.exec(textBeforeCursor);

                        if (atMatch) {
                          setMentionState({
                            isOpen: true,
                            query: atMatch[1],
                            selectedIndex: 0,
                          });
                          setSlashCommandState(prev => ({ ...prev, isOpen: false }));
                        } else {
                          if (mentionState.isOpen) setMentionState(prev => ({ ...prev, isOpen: false }));

                          if (slashMatch) {
                            setSlashCommandState({
                              isOpen: true,
                              query: slashMatch[1].replace(/^[\/\\]/, ''),
                              selectedIndex: 0,
                            });
                          } else if (slashCommandState.isOpen) {
                            setSlashCommandState(prev => ({ ...prev, isOpen: false }));
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (mentionState.isOpen && filteredMentionSessions.length > 0) {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setMentionState(prev => ({ ...prev, selectedIndex: (prev.selectedIndex + 1) % filteredMentionSessions.length }));
                            return;
                          }
                          if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setMentionState(prev => ({ ...prev, selectedIndex: (prev.selectedIndex - 1 + filteredMentionSessions.length) % filteredMentionSessions.length }));
                            return;
                          }
                          if (e.key === 'Enter' || e.key === 'Tab') {
                            e.preventDefault();
                            insertMention(filteredMentionSessions[mentionState.selectedIndex]);
                            return;
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            setMentionState(prev => ({ ...prev, isOpen: false }));
                            return;
                          }
                        }

                        if (slashCommandState.isOpen && filteredSlashCommands.length > 0) {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setSlashCommandState(prev => ({ ...prev, selectedIndex: (prev.selectedIndex + 1) % filteredSlashCommands.length }));
                            return;
                          }
                          if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setSlashCommandState(prev => ({ ...prev, selectedIndex: (prev.selectedIndex - 1 + filteredSlashCommands.length) % filteredSlashCommands.length }));
                            return;
                          }
                          if (e.key === 'Enter' || e.key === 'Tab') {
                            e.preventDefault();
                            insertSlashCommand(filteredSlashCommands[slashCommandState.selectedIndex]);
                            return;
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            setSlashCommandState(prev => ({ ...prev, isOpen: false }));
                            return;
                          }
                        }

                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          setMentionState(prev => ({ ...prev, isOpen: false }));
                          setSlashCommandState(prev => ({ ...prev, isOpen: false }));
                          handleSendCommand(input);
                          if (textareaRef.current) {
                            textareaRef.current.style.height = 'auto';
                          }
                        }
                      }}
                      onPaste={handlePaste}
                    />
                    <div className="flex items-center gap-1 pr-2 pt-1 shrink-0">
                      <button 
                        id="submit-command-btn"
                        onClick={() => {
                          setMentionState(prev => ({ ...prev, isOpen: false }));
                          setSlashCommandState(prev => ({ ...prev, isOpen: false }));
                          handleSendCommand(input);
                          if (textareaRef.current) {
                            textareaRef.current.style.height = 'auto';
                          }
                        }}
                        className={`p-2 rounded-xl transition-all ${input.trim() || attachedFile ? 'bg-theme-accent text-zinc-950 shadow-[0_0_15px_var(--accent-glow)] scale-105' : 'bg-zinc-900 text-zinc-700'}`}
                      >
                        <SendHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 flex items-center justify-between border-t border-zinc-800/30 mt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        id="quick-commands-btn"
                        type="button"
                        onClick={() => {
                          if (slashCommandState.isOpen) {
                            setSlashCommandState(prev => ({ ...prev, isOpen: false }));
                          } else {
                            setMentionState(prev => ({ ...prev, isOpen: false }));
                            setSlashCommandState({
                              isOpen: true,
                              query: '',
                              selectedIndex: 0,
                            });
                            textareaRef.current?.focus();
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all ${
                          slashCommandState.isOpen
                            ? 'bg-theme-accent/25 text-theme-accent border border-theme-accent/40 shadow-xs'
                            : isDarkMode 
                              ? 'bg-zinc-900/70 hover:bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-800' 
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 border border-zinc-300'
                        }`}
                        title="Browse and insert custom commands or create in Settings"
                      >
                        <Terminal className="w-3.5 h-3.5 text-theme-accent" />
                        <span>/commands</span>
                      </button>

                      <button
                        id="quick-init-btn"
                        type="button"
                        onClick={() => {
                          const prefix = input.trim() ? input + ' \\init' : '\\init ';
                          setInput(prefix);
                          textareaRef.current?.focus();
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all ${
                          input.includes('\\init') || input.includes('/init')
                            ? 'bg-amber-500/25 text-amber-400 border border-amber-500/40 shadow-xs'
                            : isDarkMode 
                              ? 'bg-zinc-900/70 hover:bg-zinc-850 text-zinc-400 hover:text-amber-400 border border-zinc-800' 
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-amber-600 border border-zinc-300'
                        }`}
                        title="\\init: Exhaustive multi-modal structural audit of attachments, code, and resources"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>\init</span>
                      </button>

                      <button
                        id="link-chat-btn"
                        type="button"
                        onClick={() => {
                          setInput(prev => prev + (prev && !prev.endsWith(' ') ? ' @' : '@'));
                          setMentionState({
                            isOpen: true,
                            query: '',
                            selectedIndex: 0,
                          });
                          textareaRef.current?.focus();
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all ${
                          mentionState.isOpen || input.includes('@')
                            ? 'bg-theme-accent/20 text-theme-accent border border-theme-accent/40 shadow-xs'
                            : isDarkMode 
                              ? 'bg-zinc-900/70 hover:bg-zinc-850 text-zinc-400 hover:text-theme-accent border border-zinc-800' 
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-theme-accent border border-zinc-300'
                        }`}
                        title="Link a previous chat conversation (@...)"
                      >
                        <AtSign className="w-3.5 h-3.5 text-theme-accent" />
                        <span>Link @</span>
                      </button>
                    </div>

                    <div className="flex gap-1.5 items-center">
                       <input 
                         type="file" 
                         ref={fileInputRef} 
                         multiple
                         className="hidden" 
                         onChange={handleFileChange}
                       />
                       <button 
                         id="attach-file-btn"
                         type="button"
                         onClick={() => fileInputRef.current?.click()}
                         className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700'}`}
                         title="Attach files or images (Hold Ctrl/Shift to pick multiple, or paste Ctrl+V)"
                       >
                         <Plus className="w-4 h-4" />
                       </button>

                       <button 
                         id="multi-items-btn"
                         type="button"
                         onClick={() => setIsMultiItemModalOpen(true)}
                         className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                           attachedFiles.length > 0 
                             ? 'bg-theme-accent/20 text-theme-accent border border-theme-accent/40 font-bold shadow-xs' 
                             : isDarkMode 
                               ? 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80' 
                               : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-800 border border-zinc-300'
                         }`}
                         title="Add or paste multiple items (Files, Images, Snippets, URLs) - ⌘+Shift+U"
                       >
                         <Layers className="w-3.5 h-3.5 text-theme-accent" />
                         <span>+ Items {attachedFiles.length > 0 ? `(${attachedFiles.length})` : ''}</span>
                       </button>

                       <button 
                         id="voice-input-btn"
                         type="button"
                         onClick={toggleListening}
                         className={`p-1.5 rounded-lg transition-all ${
                           isListening 
                             ? 'bg-red-500/20 text-red-500 animate-pulse' 
                             : isDarkMode 
                               ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300' 
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

          <MultiItemModal
            isOpen={isMultiItemModalOpen}
            onClose={() => setIsMultiItemModalOpen(false)}
            stagedItems={attachedFiles}
            onAddItems={(newItems) => {
              setAttachedFiles(prev => [...prev, ...newItems]);
            }}
            onRemoveItem={(id) => {
              setAttachedFiles(prev => prev.filter(f => f.id !== id));
            }}
            onClearAll={() => {
              setAttachedFiles([]);
            }}
            isDarkMode={isDarkMode}
          />
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

      <AuthDialog 
        isOpen={isAuthDialogOpen} 
        onOpenChange={setIsAuthDialogOpen} 
      />
    </TooltipProvider>
  );
}
