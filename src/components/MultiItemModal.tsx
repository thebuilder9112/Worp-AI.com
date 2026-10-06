import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  Link2, 
  Code, 
  Trash2, 
  Check, 
  Plus, 
  ClipboardPaste, 
  Layers, 
  Sparkles,
  FileCode,
  Globe
} from 'lucide-react';
import { 
  AttachedItem, 
  readFileAsAttachedItem, 
  createTextSnippetItem, 
  createUrlLinkItem, 
  formatFileSize,
  getItemBadgeLabel 
} from '../lib/attachmentUtils';
import { toast } from 'sonner';

interface MultiItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  stagedItems: AttachedItem[];
  onAddItems: (items: AttachedItem[]) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  isDarkMode: boolean;
}

export const MultiItemModal: React.FC<MultiItemModalProps> = ({
  isOpen,
  onClose,
  stagedItems,
  onAddItems,
  onRemoveItem,
  onClearAll,
  isDarkMode
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'bulk_text' | 'links'>('files');
  const [isDragging, setIsDragging] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkSplitMode, setBulkSplitMode] = useState<'lines' | 'single' | 'code'>('lines');
  const [snippetTitle, setSnippetTitle] = useState('snippet_code.ts');
  const [urlInput, setUrlInput] = useState('');
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleProcessFileList = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsProcessingFiles(true);
    const toastId = toast.loading(`Processing ${fileArray.length} file${fileArray.length > 1 ? 's' : ''}...`);

    try {
      const newItems: AttachedItem[] = [];
      for (const file of fileArray) {
        const item = await readFileAsAttachedItem(file);
        newItems.push(item);
      }
      onAddItems(newItems);
      toast.success(`Successfully added ${newItems.length} item${newItems.length > 1 ? 's' : ''}!`, { id: toastId });
    } catch (err: any) {
      toast.error('Failed to process some attachments: ' + (err?.message || 'Unknown error'), { id: toastId });
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleProcessFileList(e.dataTransfer.files);
    }
  };

  const handleBulkTextSubmit = () => {
    const text = bulkText.trim();
    if (!text) {
      toast.error("Please enter or paste some content first");
      return;
    }

    if (bulkSplitMode === 'lines') {
      // Split by newlines, ignore empty lines
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) return;

      const items: AttachedItem[] = lines.map((line, idx) => {
        // Detect if line is a URL
        if (line.startsWith('http://') || line.startsWith('https://') || line.match(/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/)) {
          return createUrlLinkItem(line, `Link_${idx + 1}`);
        }
        return createTextSnippetItem(`Item_${idx + 1}`, line, 'txt');
      });

      onAddItems(items);
      toast.success(`Added ${items.length} separate items from pasted text!`);
      setBulkText('');
    } else if (bulkSplitMode === 'code') {
      const ext = snippetTitle.includes('.') ? snippetTitle.split('.').pop() || 'ts' : 'ts';
      const item = createTextSnippetItem(snippetTitle, text, ext);
      onAddItems([item]);
      toast.success(`Attached code snippet "${item.name}"`);
      setBulkText('');
    } else {
      // Single combined snippet
      const item = createTextSnippetItem('pasted_content.txt', text, 'txt');
      onAddItems([item]);
      toast.success(`Attached content as 1 item`);
      setBulkText('');
    }
  };

  const handleUrlSubmit = () => {
    const urls = urlInput
      .split(/[\n,]+/)
      .map(u => u.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      toast.error("Please enter at least one URL");
      return;
    }

    const items = urls.map((u, i) => createUrlLinkItem(u, `Resource_${i + 1}`));
    onAddItems(items);
    toast.success(`Added ${items.length} link reference${items.length > 1 ? 's' : ''}!`);
    setUrlInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl flex flex-col overflow-hidden max-h-[90vh] transition-all ${
          isDarkMode ? 'bg-[#0f0f11] border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          isDarkMode ? 'border-zinc-800/80 bg-zinc-900/40' : 'border-zinc-200 bg-zinc-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-theme-accent/15 text-theme-accent border border-theme-accent/30 shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Add / Paste Multiple Items</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-theme-accent/20 text-theme-accent border border-theme-accent/30">
                  {stagedItems.length} Staged
                </span>
              </h2>
              <p className="text-xs text-zinc-500">
                Attach multiple images, files, code snippets, or URLs into your prompt box at once
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors ${
              isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-200'
            }`}
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-b px-5 pt-2 gap-4 text-xs font-semibold ${
          isDarkMode ? 'border-zinc-800/80 bg-zinc-950/40' : 'border-zinc-200 bg-zinc-100/50'
        }`}>
          <button
            onClick={() => setActiveTab('files')}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'files'
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Multi-File Upload & Dropzone</span>
          </button>

          <button
            onClick={() => setActiveTab('bulk_text')}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'bulk_text'
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ClipboardPaste className="w-4 h-4" />
            <span>Bulk Text & Snippets</span>
          </button>

          <button
            onClick={() => setActiveTab('links')}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'links'
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Multiple URLs / Links</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* TAB 1: FILES */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-theme-accent bg-theme-accent/10 scale-[1.01]'
                    : isDarkMode 
                      ? 'border-zinc-800 hover:border-theme-accent/60 bg-zinc-900/30 hover:bg-zinc-900/60' 
                      : 'border-zinc-300 hover:border-theme-accent/60 bg-zinc-50 hover:bg-zinc-100'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleProcessFileList(e.target.files);
                    }
                    if (e.target) e.target.value = '';
                  }}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-theme-accent/15 text-theme-accent flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6 animate-bounce" />
                </div>
                <h3 className="font-semibold text-sm mb-1">
                  Drag & drop multiple files or click to browse
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mb-3">
                  Select multiple images (PNG, JPG, WebP), documents (PDF, TXT, MD), or code files (TS, PY, JSON) at once.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Tip: You can also press Ctrl+V anywhere to paste multiple items</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BULK TEXT */}
          {activeTab === 'bulk_text' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-zinc-400">Pasting Mode:</span>
                <div className="flex gap-1.5 p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setBulkSplitMode('lines')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      bulkSplitMode === 'lines' ? 'bg-theme-accent text-zinc-950 font-bold shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    1 Item Per Line (Multi-Item)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkSplitMode('code')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      bulkSplitMode === 'code' ? 'bg-theme-accent text-zinc-950 font-bold shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Code Snippet
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkSplitMode('single')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      bulkSplitMode === 'single' ? 'bg-theme-accent text-zinc-950 font-bold shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Single Block
                  </button>
                </div>
              </div>

              {bulkSplitMode === 'code' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 shrink-0">Snippet Filename:</span>
                  <input
                    type="text"
                    value={snippetTitle}
                    onChange={(e) => setSnippetTitle(e.target.value)}
                    placeholder="e.g. schema.sql, utils.py, component.tsx"
                    className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-theme-accent"
                  />
                </div>
              )}

              <textarea
                rows={6}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={
                  bulkSplitMode === 'lines'
                    ? "Paste multiple items, prompts, or links here (each line becomes an individual attached item):\nItem 1: Fix navigation responsive layout\nItem 2: Implement dark mode toggle\nItem 3: Optimize database query index\nhttps://example.com/api-docs"
                    : "Paste code or text snippet here..."
                }
                className="w-full p-3 text-xs font-mono rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-theme-accent resize-none custom-scrollbar"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleBulkTextSubmit}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-theme-accent text-zinc-950 hover:brightness-110 transition-all flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Convert & Attach Items</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MULTIPLE LINKS */}
          {activeTab === 'links' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">
                Paste one or multiple web URLs separated by newlines or commas. They will be added as attached research links.
              </p>
              <textarea
                rows={5}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://github.com/repository&#10;https://docs.anthropic.com/api&#10;https://developer.mozilla.org/docs"
                className="w-full p-3 text-xs font-mono rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-theme-accent resize-none custom-scrollbar"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-theme-accent text-zinc-950 hover:brightness-110 transition-all flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Attach Links</span>
                </button>
              </div>
            </div>
          )}

          {/* STAGED ITEMS PREVIEW LIST */}
          <div className="border-t border-zinc-800/80 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Currently Attached in Prompt Box ({stagedItems.length})
                </span>
              </div>
              {stagedItems.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All Items</span>
                </button>
              )}
            </div>

            {stagedItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500 font-mono border border-dashed border-zinc-800/80 rounded-xl">
                No items attached yet. Drop files or paste text above!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {stagedItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                      isDarkMode 
                        ? 'bg-zinc-900/80 border-zinc-800 text-zinc-200 hover:border-zinc-700' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.type.startsWith('image/') && item.data ? (
                        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-zinc-700 bg-black/40">
                          <img
                            src={`data:${item.type};base64,${item.data}`}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : item.type === 'text/uri-list' ? (
                        <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                          <Globe className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-theme-accent/15 border border-theme-accent/30 flex items-center justify-center text-theme-accent shrink-0">
                          <FileCode className="w-4 h-4" />
                        </div>
                      )}

                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate max-w-[170px]" title={item.name}>
                          {item.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                          <span className="uppercase text-theme-accent font-semibold">
                            {getItemBadgeLabel(item)}
                          </span>
                          {item.size && (
                            <>
                              <span>•</span>
                              <span>{formatFileSize(item.size)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-red-400 transition-colors ml-2 shrink-0"
                      title="Remove item"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-5 py-3.5 border-t flex items-center justify-between ${
          isDarkMode ? 'border-zinc-800 bg-zinc-950/60' : 'border-zinc-200 bg-zinc-50'
        }`}>
          <span className="text-xs text-zinc-500 font-mono">
            {stagedItems.length} item{stagedItems.length !== 1 ? 's' : ''} ready for prompt
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-theme-accent text-zinc-950 hover:brightness-110 shadow-md transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Done & Return to Prompt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
