import React, { useState } from 'react';
import { 
  Search, 
  Brain, 
  Cpu, 
  Code, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Terminal,
  Layers,
  Sparkles,
  SearchCode
} from 'lucide-react';
import { KNOWLEDGE_BASE, KnowledgeEntry, queryKnowledgeBase } from '../data/knowledgeBase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'motion/react';

interface KnowledgeBaseExplorerProps {
  onInsertReference?: (text: string) => void;
}

export function KnowledgeBaseExplorer({ onInsertReference }: KnowledgeBaseExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'concepts' | 'networks' | 'algorithms' | 'nlp'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'concepts':
        return <Brain className="w-3.5 h-3.5 text-blue-400" />;
      case 'networks':
        return <Layers className="w-3.5 h-3.5 text-emerald-400" />;
      case 'algorithms':
        return <Cpu className="w-3.5 h-3.5 text-amber-400" />;
      case 'nlp':
        return <BookOpen className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Terminal className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'concepts':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'networks':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'algorithms':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'nlp':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'concepts': return 'Core Concept';
      case 'networks': return 'Neural Net';
      case 'algorithms': return 'ML Algorithm';
      case 'nlp': return 'NLP Domain';
      default: return 'General';
    }
  };

  // Perform search or filter
  let filteredEntries: KnowledgeEntry[] = [];
  if (searchQuery.trim() !== '') {
    filteredEntries = queryKnowledgeBase(searchQuery, 20);
    // If we have a category filter active, further filter the search results
    if (activeCategory !== 'all') {
      filteredEntries = filteredEntries.filter(e => e.category === activeCategory);
    }
  } else {
    filteredEntries = KNOWLEDGE_BASE;
    if (activeCategory !== 'all') {
      filteredEntries = filteredEntries.filter(e => e.category === activeCategory);
    }
  }

  const handleToggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div id="kb-explorer" className="flex flex-col h-full bg-zinc-950/20 rounded-xl">
      {/* Search Header */}
      <div className="p-3 pb-2 space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
          <input
            id="kb-search-input"
            type="text"
            placeholder="Search AI terms, CNNs, LoRA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900/50 border border-zinc-800/80 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-theme-accent/50 focus:ring-1 focus:ring-theme-accent/20 transition-all font-mono"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1">
          {(['all', 'concepts', 'networks', 'algorithms', 'nlp'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border transition-all ${
                activeCategory === cat
                  ? 'bg-zinc-800 text-white border-zinc-700 shadow-sm'
                  : 'bg-zinc-950 text-zinc-500 border-zinc-900 hover:text-zinc-300 hover:border-zinc-800'
              }`}
            >
              {cat === 'all' ? 'All' : cat === 'networks' ? 'Nets' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2 py-2">
          {filteredEntries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            return (
              <div 
                key={entry.id}
                className={`border rounded-xl transition-all duration-300 overflow-hidden ${
                  isExpanded 
                    ? 'border-theme-accent/30 bg-zinc-900/40 shadow-lg shadow-theme-accent/5' 
                    : 'border-zinc-900/80 bg-zinc-950/40 hover:border-zinc-800 hover:bg-zinc-900/10'
                }`}
              >
                {/* Entry Header */}
                <div 
                  onClick={() => handleToggleExpand(entry.id)}
                  className="p-3 flex items-start justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono border ${getCategoryBadgeColor(entry.category)}`}>
                        {getCategoryLabel(entry.category)}
                      </span>
                      <span className="text-[10px] text-zinc-600 font-mono">ID: {entry.id}</span>
                    </div>
                    <h4 className="text-xs font-bold text-zinc-200 tracking-tight leading-snug">
                      {entry.title}
                    </h4>
                    {!isExpanded && (
                      <p className="text-[10px] text-zinc-500 line-clamp-1">
                        {entry.summary}
                      </p>
                    )}
                  </div>
                  <div className="pt-0.5 text-zinc-600">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-3 pb-3 pt-1 border-t border-zinc-900/60 text-[11px] leading-relaxed text-zinc-400 space-y-3 font-sans">
                        <p className="text-xs text-zinc-300 font-medium">
                          {entry.summary}
                        </p>
                        
                        <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-900 font-mono text-[9.5px] leading-relaxed text-zinc-400 whitespace-pre-wrap overflow-x-auto shadow-inner">
                          <div className="flex items-center justify-between mb-1 text-[8px] text-zinc-600 font-sans tracking-wider uppercase font-bold border-b border-zinc-900 pb-1">
                            <span>Technical Context Node</span>
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-theme-accent animate-pulse" />
                              <span>LINKED TO CORE AI</span>
                            </div>
                          </div>
                          {entry.details}
                        </div>

                        {/* Keywords Tag Bar */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {entry.keywords.map((kw, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-850 text-zinc-500 text-[8.5px] font-mono">
                              #{kw}
                            </span>
                          ))}
                        </div>

                        {/* Actions */}
                        {onInsertReference && (
                          <button
                            onClick={() => onInsertReference(entry.title)}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-theme-accent/10 border border-theme-accent/20 hover:bg-theme-accent/25 hover:border-theme-accent/45 text-theme-accent text-[10px] font-bold uppercase tracking-wider transition-all"
                          >
                            <SearchCode className="w-3.5 h-3.5" />
                            Reference in Chat Command
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {filteredEntries.length === 0 && (
            <div className="py-12 text-center">
              <Sparkles className="w-6 h-6 text-zinc-800 mx-auto mb-2" />
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">No matching query nodes</p>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Information footer */}
      <div className="p-3 bg-zinc-950/40 border-t border-zinc-900 rounded-b-xl flex items-center gap-2">
        <Brain className="w-3.5 h-3.5 text-theme-accent animate-pulse" />
        <p className="text-[9.5px] text-zinc-500 leading-snug">
          The AI core automatically searches this knowledge base to ground its responses when advanced ML/NLP topics are detected in conversation.
        </p>
      </div>
    </div>
  );
}
