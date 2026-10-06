import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  Copy, 
  Check, 
  Terminal, 
  Code2, 
  Sparkles, 
  X, 
  Maximize2, 
  Minimize2,
  Trash2,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  History,
  Save,
  Undo2,
  GitBranch,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowDownToLine
} from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';
import { toast } from 'sonner';

interface ConsoleLog {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error';
  content: string;
  timestamp: string;
}

interface CodeVersion {
  id: string;
  versionNumber: number;
  title: string;
  code: string;
  timestamp: string;
  createdAt: number;
}

interface CodeSandboxRunnerProps {
  initialCode?: string;
  initialLanguage?: 'javascript' | 'typescript' | 'html';
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY_VERSIONS = 'worp_workspace_code_versions';

export const CodeSandboxRunner: React.FC<CodeSandboxRunnerProps> = ({
  initialCode = `// ⚡ Worp AI Sandboxed Runtime (JavaScript / TypeScript)
// Execute functions, async APIs, compute data or test algorithms

const dataset = [
  { name: 'Gemini 2.5 Flash', latency: 120, accuracy: 94.8 },
  { name: 'Worp Neural Core', latency: 85, accuracy: 96.2 },
  { name: 'Claude 3.5 Sonnet', latency: 145, accuracy: 95.1 }
];

console.log("Analyzing Neural Compute Benchmarks...");

const bestModel = dataset.reduce((prev, curr) => 
  curr.accuracy / curr.latency > prev.accuracy / prev.latency ? curr : prev
);

console.log("Optimal Efficiency Model:", bestModel);

// Async calculation
async function computeNeuralThroughput() {
  console.info("Simulating cluster throughput evaluation...");
  return {
    status: "SYNCHRONIZED",
    throughput: "18.4k tokens/sec",
    activeNodes: 64
  };
}

// Return the evaluated metric promise
return await computeNeuralThroughput();
`,
  initialLanguage = 'typescript',
  isOpen,
  onClose
}) => {
  const { isDarkMode } = useTheme();
  const [code, setCode] = useState(initialCode);
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'output' | 'versions' | 'preview'>('output');
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'warn' | 'info' | 'log'>('all');
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [returnValue, setReturnValue] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [versions, setVersions] = useState<CodeVersion[]>([]);
  const [versionNote, setVersionNote] = useState('');
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [selectedVersionForPreview, setSelectedVersionForPreview] = useState<CodeVersion | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load versions from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VERSIONS);
      if (saved) {
        setVersions(JSON.parse(saved));
      } else {
        // Initialize with default v1 version
        const initialV1: CodeVersion = {
          id: 'v1-init',
          versionNumber: 1,
          title: 'Initial Workspace Blueprint',
          code: initialCode,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: Date.now()
        };
        setVersions([initialV1]);
        localStorage.setItem(STORAGE_KEY_VERSIONS, JSON.stringify([initialV1]));
      }
    } catch (e) {
      console.warn('Failed to load code versions from localStorage:', e);
    }
  }, []);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode]);

  if (!isOpen) return null;

  const saveVersionsToStorage = (newVersions: CodeVersion[]) => {
    setVersions(newVersions);
    try {
      localStorage.setItem(STORAGE_KEY_VERSIONS, JSON.stringify(newVersions));
    } catch (e) {
      console.warn('Failed to persist code versions to localStorage:', e);
    }
  };

  const handleSaveVersion = (customTitle?: string) => {
    const nextVersionNum = versions.length > 0 ? Math.max(...versions.map(v => v.versionNumber)) + 1 : 1;
    const title = customTitle || versionNote.trim() || `Version ${nextVersionNum} (${code.split('\n').length} lines)`;
    
    const newVersion: CodeVersion = {
      id: `v-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      versionNumber: nextVersionNum,
      title,
      code,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now()
    };

    const updated = [newVersion, ...versions];
    saveVersionsToStorage(updated);
    setVersionNote('');
    setIsSavingVersion(false);
    toast.success(`Saved snapshot as Version ${nextVersionNum}`);
  };

  const handleRevertVersion = (version: CodeVersion) => {
    // Save current version before reverting as safety snapshot if modified
    if (code !== version.code) {
      const autoSaveTitle = `Auto-saved before revert to v${version.versionNumber}`;
      handleSaveVersion(autoSaveTitle);
    }

    setCode(version.code);
    setSelectedVersionForPreview(null);
    toast.success(`Reverted editor to "${version.title}" (v${version.versionNumber})`);
  };

  const handleDeleteVersion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = versions.filter(v => v.id !== id);
    saveVersionsToStorage(updated);
    if (selectedVersionForPreview?.id === id) {
      setSelectedVersionForPreview(null);
    }
    toast.info('Deleted version snapshot');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearLogs = () => {
    setLogs([]);
    setReturnValue(null);
    setExecutionTime(null);
    setExecutionStatus('idle');
  };

  const handleResetCode = () => {
    setCode(initialCode);
    handleClearLogs();
    toast.info('Code editor reset to default template');
  };

  const executeCode = async () => {
    setIsRunning(true);
    handleClearLogs();
    const startTime = performance.now();

    try {
      const capturedLogs: ConsoleLog[] = [];
      
      const pushLog = (type: 'log' | 'info' | 'warn' | 'error', ...args: any[]) => {
        const content = args.map(arg => {
          if (typeof arg === 'object' && arg !== null) {
            try {
              return JSON.stringify(arg, null, 2);
            } catch (e) {
              return String(arg);
            }
          }
          return String(arg);
        }).join(' ');

        const logEntry: ConsoleLog = {
          id: Math.random().toString(36).substring(7),
          type,
          content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        capturedLogs.push(logEntry);
        setLogs(prev => [...prev, logEntry]);
      };

      // Check if code contains HTML/DOM structure
      if (code.trim().startsWith('<') || code.includes('<!DOCTYPE') || code.includes('<html') || code.includes('<div') || code.includes('<svg')) {
        setActiveTab('preview');
        setPreviewHtml(code);
        pushLog('info', 'HTML/DOM Canvas rendered in Sandboxed Preview Iframe.');
        setExecutionStatus('success');
      } else {
        setActiveTab('output');
        
        // Strip TypeScript annotations using regex if present for clean JS eval
        let transpiledCode = code
          .replace(/interface\s+[\s\S]*?\{[\s\S]*?\}/g, '')
          .replace(/type\s+[\w\s=<>|&]+;/g, '')
          .replace(/:\s*(string|number|boolean|any|void|unknown|never|object|Record<[^>]+>|Array<[^>]+>|[A-Z][a-zA-Z0-9_]*(\[\])?)\b/g, '')
          .replace(/as\s+[A-Za-z0-9_<>[\]]+/g, '');

        // Safe sandbox runner function capturing return value and console proxy
        const sandboxedRunner = new Function(
          'console',
          'setTimeout',
          'setInterval',
          'clearTimeout',
          'clearInterval',
          `
          return (async () => {
            try {
              ${transpiledCode}
            } catch (err) {
              console.error(err && err.stack ? err.stack : String(err));
              throw err;
            }
          })();
          `
        );

        const customConsole = {
          log: (...args: any[]) => pushLog('log', ...args),
          info: (...args: any[]) => pushLog('info', ...args),
          warn: (...args: any[]) => pushLog('warn', ...args),
          error: (...args: any[]) => pushLog('error', ...args)
        };

        const result = await sandboxedRunner(
          customConsole,
          window.setTimeout.bind(window),
          window.setInterval.bind(window),
          window.clearTimeout.bind(window),
          window.clearInterval.bind(window)
        );

        if (result !== undefined) {
          const formattedResult = typeof result === 'object' && result !== null
            ? JSON.stringify(result, null, 2)
            : String(result);
          setReturnValue(formattedResult);
        }

        setExecutionStatus('success');
      }

      const elapsed = performance.now() - startTime;
      setExecutionTime(Math.round(elapsed));
      toast.success(`Execution completed in ${Math.round(elapsed)}ms`);
    } catch (err: any) {
      setExecutionStatus('error');
      setLogs(prev => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          type: 'error',
          content: err?.message || String(err),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      ]);
      toast.error('Execution encountered an error');
    } finally {
      setIsRunning(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (logFilter === 'all') return true;
    return log.type === logFilter;
  });

  const errorCount = logs.filter(l => l.type === 'error').length;
  const warnCount = logs.filter(l => l.type === 'warn').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 animate-in fade-in duration-200">
      <div className={`w-full max-w-6xl h-[90vh] rounded-2xl border flex flex-col overflow-hidden shadow-2xl transition-colors ${
        isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>
        {/* Workspace Header Bar */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b shrink-0 ${
          isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-theme-accent/15 border border-theme-accent/30 text-theme-accent shadow-[0_0_12px_var(--accent-glow)]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold font-mono tracking-wide">
                  VIRTUAL WORKSPACE & LIVE RUNTIME
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
                  Sandboxed Engine v2.6
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                  <History className="w-3 h-3 text-cyan-400" />
                  {versions.length} versions saved
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-sans mt-0.5">
                Execute TypeScript/JavaScript code, inspect live console outputs, and revert versions anytime
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSaveVersion()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-700 transition-all"
              title="Save snapshot to version history"
            >
              <Save className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Save Snapshot</span>
            </button>

            <button
              onClick={executeCode}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-theme-accent text-zinc-950 font-mono text-xs font-bold shadow-[0_0_15px_var(--accent-glow)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'RUNNING...' : 'EXECUTE CODE'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Workspace Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800/80">
          {/* Left Column: Code Editor & Version Revert Prompt */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col min-h-0">
            {/* Editor Action Toolbar */}
            <div className={`flex items-center justify-between px-4 py-2 border-b text-xs font-mono shrink-0 ${
              isDarkMode ? 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
            }`}>
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-theme-accent" />
                <span className="font-semibold text-zinc-300">workspace_main.ts</span>
                <span className="text-[10px] text-zinc-500">({code.split('\n').length} lines)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleResetCode}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                  title="Reset to template"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                  title="Copy code"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Editor Textarea */}
            <div className="flex-1 p-4 relative min-h-0">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Enter JavaScript or TypeScript code to execute..."
                spellCheck={false}
                className={`w-full h-full font-mono text-xs sm:text-sm resize-none bg-transparent border-none outline-none focus:outline-none focus:ring-0 leading-relaxed custom-scrollbar ${
                  isDarkMode ? 'text-zinc-200 selection:bg-theme-accent/30' : 'text-zinc-900 selection:bg-zinc-200'
                }`}
              />
            </div>

            {/* Bottom Editor Status & Quick Snapshot Trigger */}
            <div className={`px-4 py-2 border-t text-[11px] font-mono flex items-center justify-between shrink-0 ${
              isDarkMode ? 'bg-zinc-900/30 border-zinc-800/80 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-500'
            }`}>
              <div className="flex items-center gap-3">
                <span>Isolated V8 Runtime / ESNext</span>
                <span>TypeScript / JavaScript</span>
              </div>
              <button
                onClick={() => {
                  setActiveTab('versions');
                  setIsSavingVersion(true);
                }}
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                <History className="w-3 h-3" />
                <span>Version History</span>
              </button>
            </div>
          </div>

          {/* Right Column: Output Panel & Version History */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col min-h-0 bg-black/30">
            {/* Panel Tab Selector */}
            <div className={`flex items-center justify-between px-3 py-2 border-b text-xs font-mono shrink-0 ${
              isDarkMode ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-zinc-100 border-zinc-200'
            }`}>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('output')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
                    activeTab === 'output' 
                      ? 'bg-theme-accent/15 text-theme-accent font-bold shadow-[0_0_8px_var(--accent-glow)]' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>OUTPUT ({logs.length})</span>
                  {errorCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('versions')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
                    activeTab === 'versions' 
                      ? 'bg-cyan-500/15 text-cyan-400 font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>VERSIONS ({versions.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
                    activeTab === 'preview' 
                      ? 'bg-theme-accent/15 text-theme-accent font-bold' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>DOM</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {executionTime !== null && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {executionTime}ms
                  </span>
                )}
                {activeTab === 'output' && logs.length > 0 && (
                  <button
                    onClick={handleClearLogs}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                    title="Clear console output"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* TAB 1: ENHANCED OUTPUT & CONSOLE PANEL */}
            {activeTab === 'output' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Output Sub-Header Filters */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800/60 text-[11px] font-mono bg-zinc-950/40">
                  <div className="flex items-center gap-1 text-zinc-500">
                    <Filter className="w-3 h-3" />
                    <span>Filter:</span>
                    {(['all', 'log', 'info', 'warn', 'error'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setLogFilter(f)}
                        className={`px-2 py-0.5 rounded capitalize ${
                          logFilter === f 
                            ? 'bg-zinc-800 text-zinc-200 font-bold' 
                            : 'hover:text-zinc-300'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  {executionStatus !== 'idle' && (
                    <span className={`text-[10px] flex items-center gap-1 font-bold ${
                      executionStatus === 'success' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {executionStatus === 'success' ? (
                        <><CheckCircle2 className="w-3 h-3" /> SUCCESS</>
                      ) : (
                        <><AlertCircle className="w-3 h-3" /> RUNTIME ERROR</>
                      )}
                    </span>
                  )}
                </div>

                {/* Output Scroll List */}
                <div className="flex-1 p-3 overflow-y-auto custom-scrollbar font-mono text-xs space-y-2.5">
                  {/* Evaluated Return Value Banner (if returned) */}
                  {returnValue !== null && (
                    <div className={`p-3 rounded-xl border space-y-1.5 ${
                      isDarkMode ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    }`}>
                      <div className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase opacity-80">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          Evaluation Return Value
                        </span>
                        <span>ASYNC COMPLETED</span>
                      </div>
                      <pre className="text-xs font-mono whitespace-pre-wrap break-words max-h-48 overflow-y-auto leading-relaxed">
                        {returnValue}
                      </pre>
                    </div>
                  )}

                  {/* Console Logs Stream */}
                  {filteredLogs.length === 0 && returnValue === null ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-600 space-y-2">
                      <Terminal className="w-8 h-8 opacity-40" />
                      <p className="text-xs">No execution outputs yet.</p>
                      <p className="text-[11px] text-zinc-500">
                        Click 'Execute Code' to run script and inspect formatted results, return values, and logs.
                      </p>
                    </div>
                  ) : (
                    filteredLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className={`p-2.5 rounded-xl border leading-relaxed break-words whitespace-pre-wrap font-mono ${
                          log.type === 'error' 
                            ? 'bg-rose-950/25 border-rose-800/40 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.1)]' 
                            : log.type === 'warn'
                            ? 'bg-amber-950/25 border-amber-800/40 text-amber-300'
                            : log.type === 'info'
                            ? 'bg-cyan-950/25 border-cyan-800/40 text-cyan-300'
                            : isDarkMode ? 'bg-zinc-900/60 border-zinc-800/80 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-800 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1 opacity-80">
                          <span className={`uppercase font-bold tracking-wider flex items-center gap-1 ${
                            log.type === 'error' ? 'text-rose-400' :
                            log.type === 'warn' ? 'text-amber-400' :
                            log.type === 'info' ? 'text-cyan-400' : 'text-zinc-400'
                          }`}>
                            {log.type === 'error' && <AlertCircle className="w-3 h-3 inline" />}
                            {log.type}
                          </span>
                          <span>{log.timestamp}</span>
                        </div>
                        <div className="text-[12px]">{log.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: VERSIONING & REVERT SYSTEM */}
            {activeTab === 'versions' && (
              <div className="flex-1 flex flex-col min-h-0 p-3 space-y-3">
                {/* Save New Version Card */}
                <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                  isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-300">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <Save className="w-4 h-4" />
                      Save Snapshot of Current Workspace
                    </span>
                    <span className="text-[10px] text-zinc-500">v{versions.length + 1}</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={versionNote}
                      onChange={(e) => setVersionNote(e.target.value)}
                      placeholder="Optional version label (e.g. Added Dijkstra algorithm)"
                      className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                        isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'
                      }`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveVersion();
                      }}
                    />
                    <button
                      onClick={() => handleSaveVersion()}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)] shrink-0"
                    >
                      Save Version
                    </button>
                  </div>
                </div>

                {/* Versions List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                  {versions.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-center text-zinc-500 text-xs font-mono space-y-1">
                      <History className="w-6 h-6 opacity-40" />
                      <p>No saved versions found.</p>
                      <p className="text-[10px] text-zinc-600">Save a snapshot anytime to record snippet history.</p>
                    </div>
                  ) : (
                    versions.map((ver) => {
                      const isCurrent = code === ver.code;
                      return (
                        <div
                          key={ver.id}
                          className={`p-3 rounded-xl border text-xs font-mono transition-all group ${
                            isCurrent
                              ? 'border-cyan-500/50 bg-cyan-950/15'
                              : isDarkMode
                              ? 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700'
                              : 'bg-white border-zinc-200 hover:bg-zinc-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                                  v{ver.versionNumber}
                                </span>
                                <span className="font-semibold text-zinc-200">{ver.title}</span>
                                {isCurrent && (
                                  <span className="text-[10px] text-emerald-400 font-bold">(Current in Editor)</span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-500 flex items-center gap-2 pt-0.5">
                                <span>{ver.timestamp}</span>
                                <span>•</span>
                                <span>{ver.code.split('\n').length} lines</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleRevertVersion(ver)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition-all ${
                                  isCurrent
                                    ? 'bg-zinc-800 text-zinc-400 cursor-default'
                                    : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                                }`}
                                title="Revert active editor to this version"
                              >
                                <Undo2 className="w-3 h-3" />
                                <span>{isCurrent ? 'Active' : 'Revert'}</span>
                              </button>

                              <button
                                onClick={(e) => handleDeleteVersion(ver.id, e)}
                                className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800/50 transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete snapshot"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Code preview snippet */}
                          <div className={`mt-2 p-2 rounded-lg text-[11px] overflow-x-auto text-zinc-400 line-clamp-2 ${
                            isDarkMode ? 'bg-zinc-950/80' : 'bg-zinc-100 text-zinc-700'
                          }`}>
                            {ver.code.slice(0, 140)}...
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: DOM PREVIEW */}
            {activeTab === 'preview' && (
              <div className="flex-1 p-3 flex flex-col min-h-0">
                <div className="w-full h-full rounded-xl border border-zinc-800 bg-white overflow-hidden shadow-inner">
                  <iframe
                    ref={iframeRef}
                    title="Sandbox Execution View"
                    sandbox="allow-scripts allow-modals"
                    srcDoc={previewHtml || '<div style="font-family:sans-serif;padding:20px;color:#666;">Render preview ready. Put HTML/CSS/DOM widgets in editor and hit Execute.</div>'}
                    className="w-full h-full border-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

