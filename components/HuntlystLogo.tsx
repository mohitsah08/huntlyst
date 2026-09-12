'use client';

import React from 'react';

interface HuntlystLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
}

export default function HuntlystLogo({
  size = 'md',
  showWordmark = true,
  className = '',
  wordmarkClassName = '',
}: HuntlystLogoProps) {
  const iconDimensions = {
    sm: { w: 26, h: 26 },
    md: { w: 34, h: 34 },
    lg: { w: 42, h: 42 },
    xl: { w: 54, h: 54 },
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Hand-drawn editorial compass/crosshair emblem */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={iconDimensions.w}
          height={iconDimensions.h}
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-200 hover:rotate-6"
        >
          {/* Subtle paper shadow */}
          <ellipse cx="23" cy="24" rx="18" ry="18" fill="#2C2724" opacity="0.9" />

          {/* Main compass disc (cream paper) */}
          <ellipse
            cx="21.5"
            cy="21.5"
            rx="18"
            ry="18"
            fill="#FFFDF9"
            stroke="#2C2724"
            strokeWidth="2"
            strokeDasharray="200"
          />

          {/* Inner measurement ring */}
          <circle
            cx="21.5"
            cy="21.5"
            r="13"
            stroke="#F0EAD8"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* Hand-drawn crosshairs */}
          <line
            x1="21.5"
            y1="5"
            x2="21.5"
            y2="38"
            stroke="#2C2724"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <line
            x1="5"
            y1="21.5"
            x2="38"
            y2="21.5"
            stroke="#2C2724"
            strokeWidth="1.6"
            strokeLinecap="round"
          />

          {/* Primary Hunt Needle / Target (Orange) */}
          <path
            d="M21.5 8 L25.5 21.5 L21.5 25.5 L17.5 21.5 Z"
            fill="#FF6B35"
            stroke="#2C2724"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M21.5 35 L24 23 L21.5 25.5 L19 23 Z"
            fill="#FFE7DC"
            stroke="#2C2724"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Center reticle focal point */}
          <circle cx="21.5" cy="21.5" r="3.2" fill="#FFFDF9" stroke="#2C2724" strokeWidth="1.6" />
          <circle cx="21.5" cy="21.5" r="1.4" fill="#FF6B35" />

          {/* Discovery spark mark top-right */}
          <path
            d="M32 9 L34 11 M36 8 L33.5 12"
            stroke="#FF6B35"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Wordmark */}
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline gap-0.5">
            <span
              className={`font-display font-extrabold tracking-tight text-[#1E1B18] ${
                size === 'sm'
                  ? 'text-xl'
                  : size === 'md'
                  ? 'text-2xl sm:text-3xl'
                  : size === 'lg'
                  ? 'text-3xl sm:text-4xl'
                  : 'text-4xl sm:text-5xl'
              } ${wordmarkClassName}`}
            >
              Huntlyst
            </span>
            <span className="text-[#FF6B35] font-black text-sm select-none">.</span>
          </div>
        </div>
      )}
    </div>
  );
}
