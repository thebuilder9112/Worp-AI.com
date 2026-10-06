import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Radio, 
  X, 
  Sparkles, 
  Zap, 
  Activity, 
  Play, 
  Square,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';
import { toast } from 'sonner';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({ isOpen, onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcripts, setTranscripts] = useState<{ sender: 'user' | 'model'; text: string; time: string }[]>([]);
  const [volumeLevel, setVolumeLevel] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  const { isDarkMode } = useTheme();

  // Start Real-Time Audio Capture & Live WebSocket/Speech simulation with gemini-3.1-flash-live-preview
  const startLiveSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
      setIsConnected(true);

      // Initialize Live Speech recognition loop
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onresult = async (event: any) => {
          const lastIdx = event.results.length - 1;
          const userSpeech = event.results[lastIdx][0].transcript;
          if (userSpeech.trim()) {
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setTranscripts(prev => [...prev, { sender: 'user', text: userSpeech, time: timeStr }]);

            // Stream response from gemini-3.1-flash-live-preview through live stream endpoint
            try {
              setIsSpeaking(true);
              const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  messages: [{ role: 'user', content: userSpeech }],
                  selectedModel: 'gemini-3.1-flash-live-preview',
                  chatMode: 'standard'
                })
              });

              if (response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullModelText = '';

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  const chunk = decoder.decode(value);
                  const lines = chunk.split('\n\n');
                  for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                      try {
                        const parsed = JSON.parse(line.replace('data: ', ''));
                        if (parsed.text) {
                          fullModelText += parsed.text;
                        }
                      } catch (e) {
                        // ignore parsing error
                      }
                    }
                  }
                }

                if (fullModelText) {
                  setTranscripts(prev => [...prev, { 
                    sender: 'model', 
                    text: fullModelText, 
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  }]);

                  // Speak model response using native Synthesis for full auditory feedback
                  if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(fullModelText);
                    utterance.rate = 1.05;
                    utterance.onend = () => setIsSpeaking(false);
                    utterance.onerror = () => setIsSpeaking(false);
                    window.speechSynthesis.speak(utterance);
                  } else {
                    setIsSpeaking(false);
                  }
                }
              }
            } catch (err) {
              console.error("Live streaming error:", err);
              setIsSpeaking(false);
            }
          }
        };

        rec.start();
        recognitionRef.current = rec;
      }

      toast.success("Live Voice connected (gemini-3.1-flash-live-preview)");
    } catch (err: any) {
      console.error("Audio capture failed:", err);
      toast.error(err?.message || "Microphone permission required for Live Voice");
    }
  };

  const endLiveSession = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    if (recognitionRef.current) recognitionRef.current.stop();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    setIsConnected(false);
    setIsSpeaking(false);
    setVolumeLevel(0);
  };

  useEffect(() => {
    if (!isOpen) {
      endLiveSession();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className={`w-full max-w-2xl rounded-2xl border flex flex-col overflow-hidden shadow-2xl transition-colors ${
        isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b shrink-0 ${
          isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-theme-accent/15 border border-theme-accent/30 text-theme-accent shadow-[0_0_12px_var(--accent-glow)] animate-pulse">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold font-mono tracking-wide">
                  LIVE VOICE CONVERSATIONS
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  gemini-3.1-flash-live-preview
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-sans mt-0.5">
                Real-time low-latency bidirectional voice conversation session
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              endLiveSession();
              onClose();
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Audio Visualizer Area */}
        <div className="p-6 flex flex-col items-center justify-center border-b border-zinc-800/60 space-y-4 bg-gradient-to-b from-transparent to-black/20">
          <div className="relative flex items-center justify-center">
            {/* Pulsing rings */}
            {isConnected && (
              <>
                <motion.div
                  animate={{ scale: [1, 1.4 + volumeLevel / 100, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute w-36 h-36 rounded-full bg-theme-accent/20 blur-xl"
                />
                <motion.div
                  animate={{ scale: [1, 1.2 + volumeLevel / 150, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="absolute w-28 h-28 rounded-full border border-theme-accent/40"
                />
              </>
            )}

            <div className={`w-24 h-24 rounded-full flex items-center justify-center border transition-all ${
              isConnected 
                ? 'bg-theme-accent text-zinc-950 shadow-[0_0_30px_var(--accent-glow)] border-theme-accent' 
                : isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-400'
            }`}>
              {isConnected ? (
                isSpeaking ? (
                  <Volume2 className="w-10 h-10 animate-bounce" />
                ) : (
                  <Mic className="w-10 h-10 animate-pulse" />
                )
              ) : (
                <MicOff className="w-10 h-10" />
              )}
            </div>
          </div>

          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-zinc-600'}`} />
              <span className="text-xs font-mono font-bold">
                {isConnected 
                  ? (isSpeaking ? 'GEMINI LIVE IS RESPONDING...' : 'LISTENING & STREAMING...') 
                  : 'DISCONNECTED'}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              {isConnected 
                ? `Input Level: ${volumeLevel}% • Natural Speech Flow` 
                : 'Click connect below to begin real-time voice chat with Live API.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isConnected ? (
              <button
                onClick={startLiveSession}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-theme-accent text-zinc-950 font-mono text-xs font-bold shadow-[0_0_15px_var(--accent-glow)] hover:opacity-90 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>START LIVE CONVERSATION</span>
              </button>
            ) : (
              <button
                onClick={endLiveSession}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition-all"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>STOP SESSION</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Conversation Transcript Stream */}
        <div className="flex-1 p-4 overflow-y-auto max-h-[300px] space-y-3 font-mono text-xs custom-scrollbar">
          {transcripts.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-center text-zinc-500 space-y-1">
              <Activity className="w-6 h-6 opacity-40" />
              <p>No audio transcribed yet.</p>
              <p className="text-[10px] text-zinc-600">Spoken words and Live responses will appear in this real-time stream.</p>
            </div>
          ) : (
            transcripts.map((t, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-xl border ${
                  t.sender === 'user'
                    ? isDarkMode ? 'bg-zinc-900/60 border-zinc-800 text-zinc-200 ml-8' : 'bg-zinc-100 border-zinc-200 text-zinc-900 ml-8'
                    : isDarkMode ? 'bg-cyan-950/20 border-cyan-800/40 text-cyan-200 mr-8' : 'bg-cyan-50 border-cyan-200 text-cyan-900 mr-8'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] opacity-70 mb-1">
                  <span className="font-bold uppercase tracking-wider">{t.sender === 'user' ? 'You (Voice)' : 'Gemini Live'}</span>
                  <span>{t.time}</span>
                </div>
                <p className="text-xs leading-relaxed">{t.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
