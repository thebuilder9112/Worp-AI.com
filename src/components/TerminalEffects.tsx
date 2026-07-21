import React from 'react';
import { useTheme } from '../lib/ThemeContext';

export const TerminalEffects: React.FC = () => {
  const { isDarkMode } = useTheme();

  if (!isDarkMode) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {/* Scanlines */}
      <div 
        className="absolute inset-0 opacity-[0.025]"
        style={{
          background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.2) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.04), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.04))',
          backgroundSize: '100% 4px, 3px 100%',
        }}
      />
      
      {/* Subtle Screen Flicker */}
      <div className="absolute inset-0 animate-flicker pointer-events-none opacity-[0.01] bg-white" />
      
      {/* Static/Noise overlay */}
      <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* Futuristic Holographic HUD Corners & Brackets */}
      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-theme-accent/25 rounded-tl-md animate-pulse" style={{ animationDuration: '3s' }} />
      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-theme-accent/25 rounded-tr-md animate-pulse" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-theme-accent/25 rounded-bl-md animate-pulse" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-theme-accent/25 rounded-br-md animate-pulse" style={{ animationDuration: '3s' }} />

      {/* Subtle Warp Engine Energy Rails on Left & Right Margins */}
      <div className="absolute top-[10%] bottom-[10%] left-1 w-[1px] bg-gradient-to-b from-transparent via-theme-accent/30 to-transparent shadow-[0_0_8px_rgba(var(--accent-color),0.4)]" />
      <div className="absolute top-[10%] bottom-[10%] right-1 w-[1px] bg-gradient-to-b from-transparent via-theme-accent/30 to-transparent shadow-[0_0_8px_rgba(var(--accent-color),0.4)]" />

      <style>{`
        @keyframes flicker {
          0% { opacity: 0.01; }
          5% { opacity: 0.015; }
          10% { opacity: 0.01; }
          15% { opacity: 0.02; }
          30% { opacity: 0.01; }
          50% { opacity: 0.015; }
          80% { opacity: 0.01; }
          90% { opacity: 0.025; }
          100% { opacity: 0.01; }
        }
        .animate-flicker {
          animation: flicker 0.2s infinite;
        }
      `}</style>
    </div>
  );
};
