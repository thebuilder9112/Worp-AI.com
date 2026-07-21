import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Brain, 
  Zap, 
  Clock, 
  Plus, 
  Trash2, 
  ArrowRight, 
  LineChart, 
  Activity, 
  Sliders, 
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  BookOpen,
  CheckCircle2,
  BellRing
} from 'lucide-react';
import { KNOWLEDGE_BASE, KnowledgeEntry, queryKnowledgeBase } from '../data/knowledgeBase';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface ProactiveCopilotProps {
  messages: Array<{ id: string; command: string; response: string; timestamp: Date }>;
  input: string;
  setInput: (val: string) => void;
  onSendCommand: (command: string) => void;
  isDarkMode: boolean;
}

interface SimulatedEvent {
  id: string;
  title: string;
  timeRemaining: number; // in seconds
  type: 'study' | 'audit' | 'optimize';
  isRecurring: boolean;
  status: 'active' | 'triggered';
}

export function ProactiveCopilot({ messages, input, setInput, onSendCommand, isDarkMode }: ProactiveCopilotProps) {
  const [activeSubTab, setActiveSubTab] = useState<'profiler' | 'automation' | 'scheduler' | 'insights'>('profiler');
  
  // Cognitive Profile State
  const [profileMetrics, setProfileMetrics] = useState({
    comprehensionLevel: 65,
    focusArea: 'General AI',
    attentionSpectrum: [] as string[],
    activeTurnCount: 0
  });

  // Simulator States (Profiler)
  const [learningRate, setLearningRate] = useState(0.01);
  const [optimizer, setOptimizer] = useState<'sgd' | 'adam' | 'adamw'>('adamw');
  const [weightDecay, setWeightDecay] = useState(0.01);
  const [epochProgress, setEpochProgress] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [lossHistory, setLossHistory] = useState<{ epoch: number; trainLoss: number; valLoss: number }[]>([]);

  // Interactive Layer Checker (Automation Tab)
  const [layerCount, setLayerCount] = useState(4);
  const [activationFn, setActivationFn] = useState<'sigmoid' | 'relu' | 'gelu'>('relu');
  const [vanishingAlert, setVanishingAlert] = useState(false);
  const [gradientStrengths, setGradientStrengths] = useState<number[]>([]);

  // Interactive Transformer Footprint State
  const [paramSize, setParamSize] = useState(7); // in Billion
  const [precision, setPrecision] = useState<'fp32' | 'fp16' | 'int8' | 'int4'>('fp16');

  // Scheduler / Proactive Reminders state
  const [events, setEvents] = useState<SimulatedEvent[]>([
    { id: '1', title: 'Schedule Optimizer Calibration Run', timeRemaining: 180, type: 'optimize', isRecurring: false, status: 'active' },
    { id: '2', title: 'Daily Deep Learning Concept Drill', timeRemaining: 600, type: 'study', isRecurring: true, status: 'active' },
  ]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('5'); // minutes

  // Auto-Grounding Insights state
  const [autoInsights, setAutoInsights] = useState<KnowledgeEntry[]>([]);

  // --- Dynamic Profile Tracker Effect ---
  useEffect(() => {
    setProfileMetrics(prev => ({
      ...prev,
      activeTurnCount: messages.length
    }));

    if (messages.length === 0) {
      setAutoInsights([]);
      return;
    }

    // Extract potential categories or keywords from conversation history
    const allText = messages.map(m => m.command + " " + m.response).join(" ").toLowerCase();
    const spectrum: string[] = [];
    let focus = 'General AI';

    if (allText.includes('attention') || allText.includes('transformer') || allText.includes('lora') || allText.includes('peft')) {
      spectrum.push('Attention Architectures', 'Parameter Efficiency');
      focus = 'Advanced NLP / Transformers';
    }
    if (allText.includes('gradient') || allText.includes('backpropagation') || allText.includes('layer') || allText.includes('relu')) {
      spectrum.push('Gradient Dynamics', 'Neural Convergence');
      focus = 'Deep Neural Networks';
    }
    if (allText.includes('clustering') || allText.includes('kmeans') || allText.includes('svm') || allText.includes('pca')) {
      spectrum.push('Unsupervised Clustering', 'Dimensionality Reduction');
      focus = 'Classical Machine Learning';
    }
    if (allText.includes('rag') || allText.includes('retrieval') || allText.includes('embeddings')) {
      spectrum.push('Context Augmentation', 'Vector Space Routing');
      focus = 'Information Retrieval (RAG)';
    }

    // Retrieve corresponding knowledge base concepts
    const latestQuery = messages[messages.length - 1]?.command || '';
    const recommended = queryKnowledgeBase(latestQuery, 2);

    setProfileMetrics(prev => ({
      ...prev,
      attentionSpectrum: Array.from(new Set(spectrum)),
      focusArea: focus,
      comprehensionLevel: Math.min(65 + messages.length * 4, 100)
    }));

    setAutoInsights(recommended);

    // Proactive trigger trigger-once notification if a match is found and tab isn't active
    if (recommended.length > 0 && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.response && !lastMsg.response.includes('Grounding Node')) {
        // Offer suggestion implicitly
      }
    }
  }, [messages]);

  // --- Interactive Loss Simulator Logic ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      interval = setInterval(() => {
        setEpochProgress(prev => {
          if (prev >= 20) {
            setIsSimulating(false);
            toast.success("Cognitive model training run simulated successfully.");
            return 20;
          }
          const nextEpoch = prev + 1;
          
          // Generate realistic loss values based on LR, weight decay, optimizer
          // Larger learning rate with SGD might oscillate or explode
          let noise = Math.random() * 0.05;
          let optimizerFactor = optimizer === 'adamw' ? 0.9 : optimizer === 'adam' ? 0.82 : 0.65;
          let lrFactor = learningRate > 0.1 ? 1.4 : learningRate < 0.001 ? 0.5 : 1.0;
          
          let trainLoss = 1.5 * Math.pow(1 - 0.15 * optimizerFactor * lrFactor, nextEpoch) + noise * (1 / nextEpoch) + weightDecay * 0.5;
          let valLoss = trainLoss * 1.1 + Math.sin(nextEpoch * 0.5) * 0.02 + (learningRate > 0.05 ? 0.15 * nextEpoch / 10 : 0); // show overfitting with high LR
          
          setLossHistory(history => [...history, {
            epoch: nextEpoch,
            trainLoss: Math.max(trainLoss, 0.01),
            valLoss: Math.max(valLoss, 0.02)
          }]);

          return nextEpoch;
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isSimulating, learningRate, optimizer, weightDecay]);

  const handleStartSimulation = () => {
    setEpochProgress(0);
    setLossHistory([]);
    setIsSimulating(true);
  };

  // --- Layer Vanishing Gradient Checker ---
  useEffect(() => {
    const strengths: number[] = [];
    let isVanished = false;
    
    for (let i = 0; i < layerCount; i++) {
      // Backwards calculation
      let decay = 1.0;
      if (activationFn === 'sigmoid') {
        decay = Math.pow(0.25, layerCount - i); // Sigmoid derivative is max 0.25
      } else if (activationFn === 'relu') {
        decay = Math.pow(0.92, layerCount - i); // Very slight decay due to dead nodes
      } else {
        decay = Math.pow(0.97, layerCount - i); // GELU holds strength well
      }
      
      const val = parseFloat((0.85 * decay).toFixed(3));
      strengths.push(val);
      if (val < 0.05) isVanished = true;
    }

    setGradientStrengths(strengths);
    setVanishingAlert(isVanished);
  }, [layerCount, activationFn]);

  // --- Scheduler Timer Effect ---
  useEffect(() => {
    const timer = setInterval(() => {
      setEvents(prev => prev.map(event => {
        if (event.status === 'active' && event.timeRemaining > 0) {
          const nextTime = event.timeRemaining - 1;
          if (nextTime === 0) {
            toast('📅 Timed Assistant Trigger', {
              description: `Autonomous Event Fired: ${event.title}`,
              action: {
                label: 'Respond',
                onClick: () => onSendCommand(`Let's execute the scheduled routine: ${event.title}`)
              }
            });
            return { ...event, timeRemaining: 0, status: 'triggered' };
          }
          return { ...event, timeRemaining: nextTime };
        }
        return event;
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const seconds = parseInt(newEventTime) * 60;
    if (isNaN(seconds) || seconds <= 0) return;

    const newEvent: SimulatedEvent = {
      id: Math.random().toString(36).substring(7),
      title: newEventTitle,
      timeRemaining: seconds,
      type: 'study',
      isRecurring: false,
      status: 'active'
    };

    setEvents(prev => [newEvent, ...prev]);
    setNewEventTitle('');
    toast.success(`Event scheduled: "${newEventTitle}" in ${newEventTime}m`);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    toast.success("Event removed from scheduler queue");
  };

  // Memory usage for parameter calculations
  const calculateMemoryUsage = () => {
    const bytesPerParam = precision === 'fp32' ? 4 : precision === 'fp16' ? 2 : precision === 'int8' ? 1 : 0.5;
    const modelBytes = paramSize * 1e9 * bytesPerParam;
    const modelGB = modelBytes / (1024 * 1024 * 1024);
    
    // KV Cache and training overhead estimates
    const activeKVCacheGB = modelGB * 0.25; 
    const totalGBNeeded = modelGB + activeKVCacheGB;
    
    return {
      modelSize: modelGB.toFixed(1),
      kvCache: activeKVCacheGB.toFixed(1),
      total: totalGBNeeded.toFixed(1),
      gpuRecommended: totalGBNeeded < 8 ? 'NVIDIA T4 / RTX 4060' : totalGBNeeded < 16 ? 'NVIDIA RTX 4080 (16GB)' : totalGBNeeded < 24 ? 'NVIDIA RTX 4090 / A10G (24GB)' : totalGBNeeded < 48 ? 'NVIDIA A40 / RTX 6000 (48GB)' : 'Multi-GPU Cluster / A100 (80GB)'
    };
  };

  const memStats = calculateMemoryUsage();

  return (
    <div id="proactive-copilot" className="flex flex-col h-full bg-zinc-950/20 border-l border-zinc-900">
      {/* Tab Selectors */}
      <div className="flex border-b border-zinc-900 bg-zinc-950/40 p-1 gap-1">
        {[
          { id: 'profiler', label: 'Dynamic Profiler', icon: <Activity className="w-3.5 h-3.5" /> },
          { id: 'automation', label: 'Routine Tools', icon: <Cpu className="w-3.5 h-3.5" /> },
          { id: 'scheduler', label: 'Synaptic Events', icon: <Clock className="w-3.5 h-3.5" /> },
          { id: 'insights', label: 'Auto-Grounding', icon: <Sparkles className="w-3.5 h-3.5" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all border ${
              activeSubTab === tab.id
                ? 'bg-zinc-900 border-zinc-800 text-white shadow-sm'
                : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.icon}
            <span className="hidden md:inline">{tab.label.split(' ')[1] || tab.label}</span>
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1 p-4">
        <AnimatePresence mode="wait">
          {/* TAB 1: COGNITIVE PROFILER */}
          {activeSubTab === 'profiler' && (
            <motion.div
              key="profiler"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Dynamic User Profile Status */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-theme-accent animate-pulse" />
                    <span className="text-[10px] font-bold font-mono tracking-widest text-zinc-400 uppercase">Interactive Diagnostics</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 bg-theme-accent/10 border border-theme-accent/20 rounded-md text-theme-accent font-mono">ACTIVE TURN: {profileMetrics.activeTurnCount}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-900">
                    <span className="text-[8px] font-bold text-zinc-600 block uppercase tracking-wider font-mono">Cognitive Domain</span>
                    <span className="text-xs font-bold text-zinc-200 mt-1 block truncate">{profileMetrics.focusArea}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-900">
                    <span className="text-[8px] font-bold text-zinc-600 block uppercase tracking-wider font-mono">Understanding level</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-theme-accent rounded-full" style={{ width: `${profileMetrics.comprehensionLevel}%` }} />
                      </div>
                      <span className="text-[9px] font-mono text-theme-accent font-bold">{profileMetrics.comprehensionLevel}%</span>
                    </div>
                  </div>
                </div>

                {profileMetrics.attentionSpectrum.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Attuned Concepts</span>
                    <div className="flex flex-wrap gap-1.5">
                      {profileMetrics.attentionSpectrum.map((spec, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-900 text-[9px] text-zinc-400 font-mono">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-500 font-mono italic">Start chatting to build your profile focus trajectory.</p>
                )}
              </div>

              {/* Training Dynamics Simulator */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LineChart className="w-4 h-4 text-theme-accent" />
                    <span className="text-[10px] font-bold font-mono tracking-widest text-zinc-300 uppercase">Convergence Simulator</span>
                  </div>
                  <Sliders className="w-3.5 h-3.5 text-zinc-600" />
                </div>

                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Analyze training dynamics. Test how hyperparameters affect neural networks. See if higher learning rates risk divergence or overshooting.
                </p>

                {/* Hyperparameter Inputs */}
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[9px]">
                  <div className="space-y-1">
                    <label className="text-zinc-500 font-bold block uppercase">Learning Rate</label>
                    <select
                      value={learningRate}
                      onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1 text-zinc-300 focus:outline-none"
                    >
                      <option value="0.5">0.5 (High)</option>
                      <option value="0.1">0.1</option>
                      <option value="0.01">0.01 (Med)</option>
                      <option value="0.001">0.001</option>
                      <option value="0.0001">0.0001 (Low)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-500 font-bold block uppercase">Optimizer</label>
                    <select
                      value={optimizer}
                      onChange={(e) => setOptimizer(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1 text-zinc-300 focus:outline-none font-sans"
                    >
                      <option value="sgd">SGD</option>
                      <option value="adam">Adam</option>
                      <option value="adamw">AdamW</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-500 font-bold block uppercase">Weight Decay</label>
                    <select
                      value={weightDecay}
                      onChange={(e) => setWeightDecay(parseFloat(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1 text-zinc-300 focus:outline-none"
                    >
                      <option value="0.1">0.1 (High)</option>
                      <option value="0.01">0.01 (Std)</option>
                      <option value="0.001">0.001</option>
                      <option value="0">0.0 (None)</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleStartSimulation}
                    disabled={isSimulating}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-theme-accent/15 border border-theme-accent/30 hover:bg-theme-accent/25 hover:border-theme-accent/50 text-theme-accent text-[9px] font-bold tracking-wider uppercase rounded-lg transition-all"
                  >
                    <Play className="w-3 h-3" />
                    Simulate Convergence
                  </button>
                  {lossHistory.length > 0 && (
                    <button
                      onClick={() => { setLossHistory([]); setEpochProgress(0); }}
                      className="px-2.5 bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-zinc-500 rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Loss Chart Rendering */}
                {lossHistory.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between text-[9px] font-mono">
                      <span className="text-zinc-500 uppercase font-bold">Simulating Training Epochs ({epochProgress}/20)</span>
                      <div className="flex gap-3">
                        <span className="text-emerald-500 font-bold">Train Loss</span>
                        <span className="text-blue-400 font-bold">Val Loss</span>
                      </div>
                    </div>

                    {/* Pure CSS/SVG graph */}
                    <div className="h-28 w-full border border-zinc-900 rounded-lg bg-zinc-950 relative overflow-hidden flex flex-col justify-end p-2">
                      <svg className="absolute inset-0 w-full h-full">
                        {/* Grid lines */}
                        <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#111" strokeDasharray="3" />
                        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#111" strokeDasharray="3" />
                        <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#111" strokeDasharray="3" />

                        {/* Train Loss line */}
                        <path
                          d={lossHistory.map((pt, i) => {
                            const x = (i / 20) * 100 + '%';
                            const y = 100 - (pt.trainLoss / 1.6) * 100 + '%';
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="1.5"
                          className="transition-all duration-300"
                        />

                        {/* Val Loss line */}
                        <path
                          d={lossHistory.map((pt, i) => {
                            const x = (i / 20) * 100 + '%';
                            const y = 100 - (pt.valLoss / 1.6) * 100 + '%';
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="1.5"
                          className="transition-all duration-300"
                        />
                      </svg>
                      
                      <div className="absolute top-2 left-2 text-[8px] font-mono text-zinc-600">Max Loss Scale: 1.6</div>
                      <div className="absolute bottom-2 right-2 text-[8px] font-mono text-zinc-600">Epoch 20</div>
                    </div>

                    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-900 text-[9px] leading-relaxed text-zinc-400 font-mono">
                      {learningRate >= 0.5 ? (
                        <div className="flex items-start gap-1.5 text-amber-500/90">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Divergence Detected! Your Learning Rate (0.5) is too high. The loss is oscillating or exploding. Try reducing LR to 0.01 or below.</span>
                        </div>
                      ) : epochProgress === 20 ? (
                        <div className="flex items-start gap-1.5 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Optimal Convergence Reached! Optimizer {optimizer.toUpperCase()} successfully converged model loss with healthy validation mapping.</span>
                        </div>
                      ) : (
                        <span>Simulating forward model loss computations... Observe gradient updates and loss reduction curves.</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: ROUTINE DIAGNOSTICS & AUTOMATION */}
          {activeSubTab === 'automation' && (
            <motion.div
              key="automation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Interactive Layer Flow / Gradient flow checker */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-theme-accent" />
                    <span className="text-[10px] font-bold font-mono tracking-widest text-zinc-300 uppercase">Backprop Gradient Flow</span>
                  </div>
                  <span className="text-[8px] font-mono font-bold bg-zinc-950 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-900">VERIFIER NODE</span>
                </div>

                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Interactive simulation of backpropagation vanishing/exploding gradients. Add deep neural layers and test different activations.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1 text-[9px] font-mono">
                  <div className="space-y-1">
                    <label className="text-zinc-500 font-bold block uppercase">Network Depth</label>
                    <input 
                      type="range" 
                      min="2" 
                      max="8" 
                      value={layerCount}
                      onChange={(e) => setLayerCount(parseInt(e.target.value))}
                      className="w-full accent-theme-accent bg-zinc-950 border border-zinc-900 rounded p-1"
                    />
                    <span className="text-[9px] text-zinc-400">{layerCount} Deep Hidden Layers</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-500 font-bold block uppercase">Activation Mode</label>
                    <select
                      value={activationFn}
                      onChange={(e) => setActivationFn(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1 text-zinc-300 focus:outline-none"
                    >
                      <option value="sigmoid">Sigmoid</option>
                      <option value="relu">ReLU</option>
                      <option value="gelu">GELU</option>
                    </select>
                  </div>
                </div>

                {/* Layer Visualizers */}
                <div className="flex items-center justify-between gap-1.5 p-3 bg-zinc-950/60 border border-zinc-900 rounded-lg">
                  {gradientStrengths.map((str, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div className="text-[8px] font-mono text-zinc-600">L{idx+1}</div>
                      <div className="w-full h-12 bg-zinc-900 rounded border border-zinc-850 flex items-end relative overflow-hidden">
                        <div 
                          className={`w-full transition-all duration-300 ${
                            str < 0.1 
                              ? 'bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]' 
                              : str < 0.5 
                                ? 'bg-amber-500/80' 
                                : 'bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                          }`}
                          style={{ height: `${str * 100}%` }}
                        />
                      </div>
                      <div className="text-[7.5px] font-mono text-zinc-400">{str}</div>
                    </div>
                  ))}
                </div>

                {vanishingAlert ? (
                  <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-900/30 flex gap-2 items-start text-[9.5px] font-mono text-red-400 leading-relaxed">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    <span>
                      WARNING: Vanishing Gradient Risk! Using {activationFn.toUpperCase()} on deep hidden layers ({layerCount} layers) caused early layers to suffer extremely low weight adjustments (below 0.05). Consider swapping to GELU or adding Residual/Skip Connections.
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/30 flex gap-2 items-start text-[9.5px] font-mono text-emerald-400 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                    <span>
                      Healthy Gradient Flow! Activation {activationFn.toUpperCase()} successfully preserves backpropagated gradient values through neural stack pathways.
                    </span>
                  </div>
                )}
              </div>

              {/* Advanced Transformer Parameter / Memory Calculator */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LineChart className="w-4 h-4 text-theme-accent" />
                    <span className="text-[10px] font-bold font-mono tracking-widest text-zinc-300 uppercase">Transformer Footprint Tool</span>
                  </div>
                  <span className="text-[8px] font-mono font-bold bg-zinc-950 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-900">VRAM AUDITOR</span>
                </div>

                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Calculate real-time VRAM overhead of model configurations based on param size and quantization modes.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1 text-[9px] font-mono">
                  <div className="space-y-1">
                    <label className="text-zinc-500 font-bold block uppercase">Parameter Count (Billion)</label>
                    <input 
                      type="range" 
                      min="1" 
                      max="70" 
                      value={paramSize}
                      onChange={(e) => setParamSize(parseInt(e.target.value))}
                      className="w-full accent-theme-accent bg-zinc-950 border border-zinc-900 rounded p-1"
                    />
                    <span className="text-[9px] text-zinc-400">{paramSize}B Parameters</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-500 font-bold block uppercase">Quantization Mode</label>
                    <select
                      value={precision}
                      onChange={(e) => setPrecision(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded px-1.5 py-1 text-zinc-300 focus:outline-none"
                    >
                      <option value="fp32">FP32 (Uncompressed)</option>
                      <option value="fp16">FP16 (Half Precision)</option>
                      <option value="int8">INT8 (8-bit Quantized)</option>
                      <option value="int4">INT4 (4-bit QLoRA)</option>
                    </select>
                  </div>
                </div>

                {/* Stats Readout */}
                <div className="p-3 bg-zinc-950/60 border border-zinc-900 rounded-lg space-y-2 text-[9.5px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Model Memory footprint:</span>
                    <span className="text-zinc-300 font-bold">{memStats.modelSize} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Activation / KV Cache buffer:</span>
                    <span className="text-zinc-300 font-bold">{memStats.kvCache} GB</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-900 pt-1.5 font-bold">
                    <span className="text-theme-accent">Total estimated VRAM:</span>
                    <span className="text-theme-accent">{memStats.total} GB</span>
                  </div>
                  <div className="pt-1.5 border-t border-zinc-900 space-y-1">
                    <span className="text-zinc-500 font-sans font-bold text-[8px] uppercase tracking-wider block">Recommended Hardware Config</span>
                    <span className="text-emerald-400 font-bold block">{memStats.gpuRecommended}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSendCommand(`Analyze deployment capabilities and memory costs of a ${paramSize}B parameter Transformer utilizing ${precision.toUpperCase()} precision quantization.`);
                  }}
                  className="w-full py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-[9.5px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                >
                  Insert Analysis Request in Chat
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 3: SYNAPTIC SCHEDULER & EVENTS */}
          {activeSubTab === 'scheduler' && (
            <motion.div
              key="scheduler"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-theme-accent animate-pulse" />
                    <span className="text-[10px] font-bold font-mono tracking-widest text-zinc-300 uppercase">Interactive Event Planner</span>
                  </div>
                  <BellRing className="w-3.5 h-3.5 text-zinc-600" />
                </div>

                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Plan model evaluation checkpoints, study drills, or optimization tasks. The AI will monitor countdown timers and trigger reminders on expiry.
                </p>

                {/* Form to create event */}
                <form onSubmit={handleAddEvent} className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="e.g. Profiling gradient saturation issues..."
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none focus:border-theme-accent/50"
                    />
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-zinc-950 border border-zinc-850 rounded-lg px-2 text-xs">
                      <span className="text-zinc-600 text-[10px] font-mono">TIMER:</span>
                      <select
                        value={newEventTime}
                        onChange={(e) => setNewEventTime(e.target.value)}
                        className="bg-transparent border-none focus:outline-none text-zinc-300 flex-1 py-1 font-mono text-xs"
                      >
                        <option value="1">1 Minute</option>
                        <option value="3">3 Minutes</option>
                        <option value="5">5 Minutes</option>
                        <option value="10">10 Minutes</option>
                        <option value="30">30 Minutes</option>
                        <option value="60">60 Minutes</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-theme-accent text-zinc-950 font-bold rounded-lg text-xs hover:bg-theme-accent/90 transition-colors flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Add Event
                    </button>
                  </div>
                </form>
              </div>

              {/* Active Events Queue */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Pending Triggers ({events.length})</span>
                
                <div className="space-y-2">
                  {events.map((evt) => {
                    const mins = Math.floor(evt.timeRemaining / 60);
                    const secs = evt.timeRemaining % 60;
                    
                    return (
                      <div 
                        key={evt.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                          evt.status === 'triggered' 
                            ? 'bg-emerald-500/5 border-emerald-500/20' 
                            : 'bg-zinc-900/30 border-zinc-900 hover:border-zinc-850'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-xs font-bold leading-snug truncate ${evt.status === 'triggered' ? 'text-emerald-400 line-through' : 'text-zinc-300'}`}>
                            {evt.title}
                          </h4>
                          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5 block">{evt.type}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          {evt.status === 'triggered' ? (
                            <span className="text-[9px] font-bold font-mono text-emerald-400">FIRED</span>
                          ) : (
                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold font-mono text-theme-accent">{mins}:{secs < 10 ? `0${secs}` : secs}</span>
                              <span className="text-[8px] text-zinc-600 block font-mono">REMAINING</span>
                            </div>
                          )}

                          <button 
                            onClick={() => handleDeleteEvent(evt.id)}
                            className="p-1 hover:bg-zinc-900 rounded text-zinc-600 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {events.length === 0 && (
                    <div className="py-8 text-center bg-zinc-950/20 border border-zinc-900 rounded-xl">
                      <Clock className="w-5 h-5 text-zinc-800 mx-auto mb-1.5" />
                      <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Scheduler empty</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: AUTOGROUNDING INSIGHTS */}
          {activeSubTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-theme-accent" />
                  <span className="text-[10px] font-bold font-mono tracking-widest text-zinc-300 uppercase">Context Grounding Hub</span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  The AI monitor parses active turn tokens in real-time. When advanced ML, NLP, or Deep Learning concepts are identified, matching groundings are presented here automatically.
                </p>
              </div>

              {autoInsights.length > 0 ? (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Contextual Groundings Detected ({autoInsights.length})</span>
                  
                  {autoInsights.map((entry) => (
                    <div key={entry.id} className="p-4 rounded-xl bg-zinc-900/20 border border-zinc-900/80 hover:border-zinc-850 transition-all space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-theme-accent/10 border border-theme-accent/20 text-theme-accent">
                          {entry.category.toUpperCase()}
                        </span>
                        <h4 className="text-xs font-bold text-zinc-300">{entry.title}</h4>
                      </div>
                      
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{entry.summary}</p>
                      
                      <div className="p-2 bg-zinc-950 border border-zinc-900 rounded-lg text-[9px] font-mono text-zinc-500 whitespace-pre-wrap truncate max-h-[60px]">
                        {entry.details}
                      </div>

                      <button
                        onClick={() => {
                          setInput(input + (input ? ' ' : '') + `@${entry.id}`);
                          toast.success(`Context tag @${entry.id} referenced in dialogue input.`);
                        }}
                        className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-theme-accent/5 border border-theme-accent/15 hover:bg-theme-accent/15 hover:border-theme-accent/30 text-theme-accent text-[9px] font-bold uppercase tracking-wider transition-all"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Inject Semantic Context Token
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-zinc-950/20 border border-zinc-900 rounded-xl">
                  <Brain className="w-6 h-6 text-zinc-800 mx-auto mb-2 animate-pulse" />
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Listening for semantic signals...</p>
                  <p className="text-[9px] text-zinc-500 max-w-[200px] mx-auto mt-1 leading-normal">
                    Try mentioning topics like "Transformers", "RAG", "CNN", "LoRA" or "Clustering" in the chat console!
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}
