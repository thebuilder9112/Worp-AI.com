import React, { useState } from 'react';
import { CustomCommand, DEFAULT_COMMANDS, INSPIRATION_TEMPLATES, generateCommandFromNaturalLanguage } from '../lib/customCommands';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  RotateCcw, 
  Sparkles, 
  Terminal, 
  Check, 
  Info, 
  Wand2, 
  Lightbulb, 
  ArrowRight,
  Code2,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

interface CustomCommandsManagerProps {
  commands: CustomCommand[];
  onSaveCommands: (commands: CustomCommand[]) => void;
  onSelectCommand?: (cmd: CustomCommand) => void;
  isDarkMode?: boolean;
}

export const CustomCommandsManager: React.FC<CustomCommandsManagerProps> = ({
  commands,
  onSaveCommands,
  onSelectCommand,
  isDarkMode = true
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Simple English Natural Language Creator input
  const [naturalEnglishInput, setNaturalEnglishInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateFromNaturalEnglish = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = naturalEnglishInput.trim();
    if (!clean) {
      toast.error("Please describe what you want the command to do in plain English.");
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateCommandFromNaturalLanguage(clean);
      setName(generated.name);
      setDescription(generated.description);
      setPrompt(generated.prompt);
      setIsGenerating(false);
      toast.success(`Generated command ${generated.name}! Review and save below.`);
    }, 150);
  };

  const handleApplyTemplate = (tmpl: typeof INSPIRATION_TEMPLATES[0]) => {
    setName(tmpl.name);
    setDescription(tmpl.description);
    setPrompt(tmpl.prompt);
    toast.info(`Loaded template "${tmpl.name}" into editor`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let cleanName = name.trim();
    if (!cleanName) {
      toast.error("Please enter a command trigger name (e.g. /mycommand)");
      return;
    }
    if (!cleanName.startsWith('/') && !cleanName.startsWith('\\')) {
      cleanName = '/' + cleanName;
    }
    // Clean spaces
    cleanName = cleanName.replace(/\s+/g, '-');

    if (!prompt.trim()) {
      toast.error("Please enter the instruction in simple English for what the AI should do");
      return;
    }

    if (editingId) {
      const updated = commands.map(c => 
        c.id === editingId 
          ? { 
              ...c, 
              name: cleanName, 
              description: description.trim() || cleanName, 
              prompt: prompt.trim() 
            } 
          : c
      );
      onSaveCommands(updated);
      toast.success(`Updated command ${cleanName}`);
      setEditingId(null);
    } else {
      const newCmd: CustomCommand = {
        id: 'cmd_' + Date.now(),
        name: cleanName,
        description: description.trim() || cleanName,
        prompt: prompt.trim(),
        createdAt: new Date().toISOString()
      };
      const filtered = commands.filter(c => c.name.toLowerCase() !== cleanName.toLowerCase());
      onSaveCommands([newCmd, ...filtered]);
      toast.success(`Registered command ${cleanName}`);
    }

    setName('');
    setDescription('');
    setPrompt('');
    setNaturalEnglishInput('');
  };

  const handleEdit = (cmd: CustomCommand) => {
    setEditingId(cmd.id);
    setName(cmd.name);
    setDescription(cmd.description);
    setPrompt(cmd.prompt);
    // Smooth scroll into view
    const formElement = document.getElementById('custom-command-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleDelete = (id: string) => {
    const updated = commands.filter(c => c.id !== id);
    onSaveCommands(updated);
    toast.info("Command removed");
    if (editingId === id) {
      setEditingId(null);
      setName('');
      setDescription('');
      setPrompt('');
    }
  };

  const handleResetDefaults = () => {
    onSaveCommands(DEFAULT_COMMANDS);
    toast.success("Reset custom commands to default presets");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Concept Explainer */}
      <div className={`p-4 rounded-2xl border ${
        isDarkMode 
          ? 'bg-gradient-to-r from-theme-accent/10 via-zinc-900/60 to-zinc-900/40 border-theme-accent/20' 
          : 'bg-gradient-to-r from-theme-accent/5 via-zinc-50 to-white border-theme-accent/30'
      }`}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-theme-accent/20 flex items-center justify-center text-theme-accent shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-theme-accent flex items-center gap-1.5">
              Custom Command Studio
            </h3>
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Teach Worp AI any customized persona, shortcut, or task using simple English. 
              Trigger them anytime by typing <code className="text-theme-accent font-mono">/yourcommand</code> in the prompt, or create them on the fly by typing <code className="text-theme-accent font-mono">create command /name: instruction</code>!
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Simple English Instant Command Generator */}
      <div className={`p-4 rounded-xl border space-y-3 ${
        isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
      }`}>
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-theme-accent" />
          <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
            Simple English Command Creator
          </h4>
        </div>
        <p className={`text-[11px] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Describe what you want your command to do in ordinary plain English. We&apos;ll automatically build the trigger and prompt directives.
        </p>

        <form onSubmit={handleGenerateFromNaturalEnglish} className="flex flex-col sm:flex-row gap-2">
          <Input 
            value={naturalEnglishInput}
            onChange={(e) => setNaturalEnglishInput(e.target.value)}
            placeholder="e.g. A command that explains code like I'm 5 with everyday analogies..."
            className={`h-9 text-xs flex-1 ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'}`}
          />
          <Button 
            type="submit"
            disabled={isGenerating || !naturalEnglishInput.trim()}
            className="h-9 text-xs font-bold bg-theme-accent text-zinc-950 hover:bg-theme-accent/90 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Build Command
          </Button>
        </form>

        {/* Quick Inspiration Pills */}
        <div className="pt-1">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono mb-2">
            <Lightbulb className="w-3 h-3 text-amber-400" />
            <span>Click an idea to preview:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {INSPIRATION_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => handleApplyTemplate(tmpl)}
                className={`px-2 py-1 rounded-md text-[11px] font-mono flex items-center gap-1 transition-all ${
                  isDarkMode 
                    ? 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800' 
                    : 'bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 border border-zinc-200 shadow-xs'
                }`}
              >
                <span className="text-theme-accent font-semibold">{tmpl.name}</span>
                <span className="text-[10px] opacity-75">({tmpl.title})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: Command Configuration / Edit Form */}
      <form 
        id="custom-command-form"
        onSubmit={handleSave} 
        className={`p-4 rounded-xl border space-y-4 ${
          isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-theme-accent" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-theme-accent">
              {editingId ? "Edit Command Details" : "Command Specifications"}
            </h4>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setName('');
                setDescription('');
                setPrompt('');
              }}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 underline"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] font-mono text-zinc-400">Trigger Command</Label>
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="/mycommand (e.g. /eli5 or /audit)"
              className={`h-9 text-xs font-mono ${isDarkMode ? 'bg-zinc-950/70 border-zinc-800' : 'bg-white border-zinc-300'}`}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] font-mono text-zinc-400">Short Description</Label>
            <Input 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Explain for beginners with analogies"
              className={`h-9 text-xs ${isDarkMode ? 'bg-zinc-950/70 border-zinc-800' : 'bg-white border-zinc-300'}`}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] font-mono text-zinc-400">Simple English Instruction / Directive</Label>
          <textarea 
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Write what you want the AI to do in simple English (e.g. 'Review this code for edge cases and rewrite it with complete TypeScript types and comments')."
            className={`w-full text-xs p-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-theme-accent resize-none leading-relaxed ${
              isDarkMode 
                ? 'border-zinc-800 bg-zinc-950/70 text-zinc-200 placeholder:text-zinc-600' 
                : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400'
            }`}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-zinc-500 font-mono">
            Direct chat prompt: <code className="text-theme-accent">create command /name: instruction</code>
          </span>
          <Button 
            type="submit" 
            size="sm" 
            className="bg-theme-accent text-zinc-950 font-bold hover:bg-theme-accent/90 h-8 text-xs"
          >
            {editingId ? "Update Command" : "Save & Activate"}
          </Button>
        </div>
      </form>

      {/* Section 3: Commands List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono flex items-center gap-1.5">
            <BookOpen className="w-3 h-3" />
            Configured Commands ({commands.length})
          </span>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
            title="Reset to default presets"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Presets</span>
          </button>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
          {commands.map((cmd) => (
            <div 
              key={cmd.id}
              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
                isDarkMode 
                  ? 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700' 
                  : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-xs'
              }`}
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-theme-accent/15 text-theme-accent border border-theme-accent/30">
                    {cmd.name}
                  </span>
                  <span className={`text-xs font-medium truncate ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>
                    {cmd.description}
                  </span>
                  {cmd.isPreset && (
                    <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-zinc-800/80 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}`}>
                      Preset
                    </span>
                  )}
                </div>
                <p className={`text-[11px] line-clamp-2 leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
                  {cmd.prompt}
                </p>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                {onSelectCommand && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectCommand(cmd)}
                    className="h-7 px-2 text-[10px] font-mono text-theme-accent hover:bg-theme-accent/10"
                    title="Insert command into prompt"
                  >
                    Insert
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => handleEdit(cmd)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDarkMode ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800'
                  }`}
                  title="Edit command"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(cmd.id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDarkMode ? 'hover:bg-zinc-800 text-zinc-500 hover:text-red-400' : 'hover:bg-zinc-100 text-zinc-500 hover:text-red-600'
                  }`}
                  title="Delete command"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
