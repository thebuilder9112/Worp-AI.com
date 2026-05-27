import React from 'react';

interface TerminalEffectsProps {
  isDarkMode?: boolean;
}

export const TerminalEffects: React.FC<TerminalEffectsProps> = ({ isDarkMode }) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {/* Scanlines */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
          backgroundSize: '100% 4px, 3px 100%',
        }}
      />
      
      {/* Subtle Screen Flicker - White strobe in light mode, subtle black dimming in dark mode */}
      <div className={`absolute inset-0 animate-flicker pointer-events-none opacity-[0.015] ${isDarkMode ? 'bg-black' : 'bg-white'}`} />
      
      {/* Static/Noise overlay */}
      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      
      <style>{`
        @keyframes flicker {
          0% { opacity: 0.015; }
          5% { opacity: 0.02; }
          10% { opacity: 0.015; }
          15% { opacity: 0.025; }
          30% { opacity: 0.015; }
          50% { opacity: 0.02; }
          80% { opacity: 0.015; }
          90% { opacity: 0.03; }
          100% { opacity: 0.015; }
        }
        .animate-flicker {
          animation: flicker 0.15s infinite;
        }
      `}</style>
    </div>
  );
};
