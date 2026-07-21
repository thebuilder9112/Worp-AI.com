import React, { useId, useState } from 'react';
import { cn } from '@/lib/utils';

export const Logo = ({ 
  className, 
  imageSrc, 
  darkImageSrc, 
  lightImageSrc,
  isDarkMode,
  isSprite = false,
  spriteDirection = 'vertical'
}: { 
  className?: string; 
  imageSrc?: string;
  darkImageSrc?: string;
  lightImageSrc?: string;
  isDarkMode?: boolean;
  isSprite?: boolean;
  spriteDirection?: 'vertical' | 'horizontal';
}) => {
  const [imgError, setImgError] = useState(false);
  const finalSrc = isDarkMode ? (darkImageSrc || imageSrc) : (lightImageSrc || imageSrc);
  const diskMaskId = useId();
  const sphereMaskId = useId();

  if (finalSrc && !imgError) {
    if (isSprite) {
      return (
        <div className={cn("overflow-hidden relative", className)}>
          <img 
            src={finalSrc} 
            alt="Logo"   
            className={cn(
              "absolute max-w-none transition-all duration-500 ease-in-out",
              spriteDirection === 'vertical' ? "w-full h-[200%]" : "h-full w-[200%]"
            )}
            style={{ 
              objectFit: 'cover',
              top: spriteDirection === 'vertical' ? (isDarkMode ? '-100%' : '0') : '0',
              left: spriteDirection === 'horizontal' ? (isDarkMode ? '-100%' : '0') : '0'
            }}
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
          />
        </div>
      );
    }
    return (
      <img 
        src={finalSrc} 
        alt="Logo"   
        className={cn("object-cover rounded-md shadow-sm", className)}
        onError={() => setImgError(true)}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <svg 
      viewBox="0 0 128 128" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={cn("w-full h-full", className)}
    >
      <defs>
        <mask id={diskMaskId}>
          <rect x="-100" y="-100" width="200" height="200" fill="white" />
          <circle r="40" fill="black" />
        </mask>
        <mask id={sphereMaskId}>
          <rect x="-100" y="-100" width="200" height="200" fill="white" />
          <circle r="22" fill="black" />
        </mask>
      </defs>
      <g transform="translate(64 64) rotate(-32)">
        {/* Tilted Accretion Disk - Faithful to the Interstellar-style logo */}
        <path 
          d="M-75 14C-100 -5 -40 -50 40 -38C110 -26 140 10 75 25C10 40 -45 32 -75 14ZM-46 0C-46 10 46 10 46 0C46 -10 -46 -10 -46 0Z" 
          fill="currentColor"
          fillRule="evenodd"
          mask={`url(#${diskMaskId})`}
        />
        {/* The central sphere */}
        <circle r="34" fill="currentColor" mask={`url(#${sphereMaskId})`} />
      </g>
    </svg>
  );
};
