'use client';

import React, { useState, useEffect, useRef } from 'react';

interface RealEstateLoaderProps {
  statusText?: string;
  isSuccess?: boolean;
  role?: string | null;
  mode?: 'titlecase' | 'uppercase';
}

export default function RealEstateLoader({
  statusText = 'Verifying property credentials...',
  isSuccess = false,
  role = null,
  mode = 'titlecase',
}: RealEstateLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isFull, setIsFull] = useState(false);
  const animRef = useRef<number | null>(null);

  // Smooth realistic fluid rise animation
  useEffect(() => {
    let currentProgress = 0;
    const startTime = Date.now();

    const updateFluid = () => {
      const now = Date.now();
      const elapsed = now - startTime;

      if (isSuccess) {
        // When authenticated, water swiftly surges to 100%
        currentProgress = Math.min(100, currentProgress + 2.2);
        setProgress(Math.round(currentProgress));

        if (currentProgress >= 100) {
          setIsFull(true);
          return;
        }
      } else {
        // Naturally rises from 0% up to ~88% while authenticating
        const targetProgress = Math.min(88, Math.floor((1 - Math.exp(-elapsed / 1000)) * 92));
        if (currentProgress < targetProgress) {
          currentProgress += (targetProgress - currentProgress) * 0.14 + 0.45;
          setProgress(Math.min(88, Math.round(currentProgress)));
        }
      }

      animRef.current = requestAnimationFrame(updateFluid);
    };

    animRef.current = requestAnimationFrame(updateFluid);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isSuccess]);

  // Water level Y calculation in viewBox 0 0 1000 300:
  // At 0% fill: Y = 265 (below letters)
  // At 100% fill: Y = 25 (above letters)
  // Range = 240px
  const waterLevelY = 265 - (progress / 100) * 240;

  const displayText = mode === 'uppercase' ? 'SYLVIA' : 'Sylvia';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 p-6 sm:p-12 select-none overflow-hidden animate-in fade-in duration-300">
      
      {/* Ambient Fluid Aquatic Lighting Orbs */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/15 rounded-full blur-[160px] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[170px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] bg-sky-500/10 rounded-full blur-[180px] pointer-events-none" />

      {/* Ripple Rings Expanding on 100% Saturation */}
      {isFull && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 rounded-full border border-cyan-400/50 animate-ping" style={{ animationDuration: '1.8s' }} />
          <div className="absolute w-96 h-96 rounded-full border border-sky-400/30 animate-ping" style={{ animationDuration: '2.4s', animationDelay: '0.2s' }} />
        </div>
      )}

      {/* ================================================================= */}
      {/* MASSIVE "SYLVIA" LIQUID WATER TYPOGRAPHY */}
      {/* ================================================================= */}
      <div className="relative z-10 w-full max-w-5xl xl:max-w-6xl flex items-center justify-center">
        <svg
          viewBox="0 0 1000 300"
          className={`w-full h-auto relative z-10 transition-all duration-700 ${
            isFull ? 'animate-water-glow' : ''
          }`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* CLIP PATH: Giant "Sylvia" text mask */}
            <clipPath id="sylviaTextClip">
              <text
                x="50%"
                y="52%"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={mode === 'uppercase' ? '210' : '225'}
                fontWeight="900"
                letterSpacing={mode === 'uppercase' ? '8px' : '2px'}
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              >
                {displayText}
              </text>
            </clipPath>

            {/* Front Wave Liquid Gradient */}
            <linearGradient id="frontWaterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.95" />
              <stop offset="20%" stopColor="#38bdf8" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#0284c7" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="1" />
            </linearGradient>

            {/* Back Wave Liquid Gradient */}
            <linearGradient id="backWaterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.75" />
              <stop offset="40%" stopColor="#0369a1" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
            </linearGradient>

            {/* Wave Crest Specular Highlights */}
            <linearGradient id="crestShineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
            </linearGradient>

            {/* Crystal Glass Edge Gradient */}
            <linearGradient id="crystalBorderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
            </linearGradient>

            {/* Soft Water Bloom Filter */}
            <filter id="waterGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ============================================================= */}
          {/* LAYER 1: BASE HOLLOW GLASS VESSEL (Empty State) */}
          {/* ============================================================= */}
          <text
            x="50%"
            y="52%"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={mode === 'uppercase' ? '210' : '225'}
            fontWeight="900"
            letterSpacing={mode === 'uppercase' ? '8px' : '2px'}
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fill="#070d1e"
            stroke="#1e293b"
            strokeWidth="5"
            opacity="0.95"
          >
            {displayText}
          </text>

          {/* Delicate inner cyan bevel of the hollow letters */}
          <text
            x="50%"
            y="52%"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={mode === 'uppercase' ? '210' : '225'}
            fontWeight="900"
            letterSpacing={mode === 'uppercase' ? '8px' : '2px'}
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fill="none"
            stroke="url(#crystalBorderGradient)"
            strokeWidth="2.2"
            opacity="0.4"
          >
            {displayText}
          </text>

          {/* ============================================================= */}
          {/* LAYER 2: THE FLOWING & RISING WATER (Clipped Inside Letters) */}
          {/* ============================================================= */}
          <g clipPath="url(#sylviaTextClip)">
            
            {/* The Rising Water Body */}
            <g 
              style={{
                transform: `translateY(${waterLevelY}px)`,
                transition: 'transform 0.15s ease-out',
              }}
            >
              {/* --- BACK WATER WAVE (Counter-current flow) --- */}
              <path
                className="animate-wave-back"
                d="
                  M 0 0 
                  Q 125 20, 250 0 T 500 0 T 750 0 T 1000 0 T 1250 0 T 1500 0 T 1750 0 T 2000 0 
                  L 2000 450 L 0 450 Z
                "
                fill="url(#backWaterGradient)"
                opacity="0.85"
              />

              {/* --- FRONT WATER WAVE (Primary undulating current) --- */}
              <path
                className="animate-wave-front"
                d="
                  M 0 0 
                  Q 125 -22, 250 0 T 500 0 T 750 0 T 1000 0 T 1250 0 T 1500 0 T 1750 0 T 2000 0 
                  L 2000 450 L 0 450 Z
                "
                fill="url(#frontWaterGradient)"
                filter="url(#waterGlowFilter)"
              />

              {/* --- WAVE CREST SPECULAR HIGHLIGHT (Foam / Light Edge) --- */}
              <path
                className="animate-wave-front"
                d="
                  M 0 0 
                  Q 125 -22, 250 0 T 500 0 T 750 0 T 1000 0 T 1250 0 T 1500 0 T 1750 0 T 2000 0
                "
                fill="none"
                stroke="url(#crestShineGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.9"
              />

              {/* --- RISING AIR BUBBLES INSIDE WATER STREAM --- */}
              {/* S letter bubbles */}
              <circle cx="210" cy="70" r="5" fill="#ffffff" opacity="0.6" style={{ animation: 'bubbleFloat 2.3s ease-in infinite' }} />
              <circle cx="250" cy="110" r="7" fill="#a5f3fc" opacity="0.5" style={{ animation: 'bubbleFloat 2.8s ease-in infinite', animationDelay: '0.4s' }} />

              {/* y letter bubbles */}
              <circle cx="340" cy="90" r="4.5" fill="#ffffff" opacity="0.7" style={{ animation: 'bubbleFloat 2.1s ease-in infinite', animationDelay: '0.9s' }} />
              <circle cx="380" cy="130" r="6" fill="#bae6fd" opacity="0.6" style={{ animation: 'bubbleFloat 2.6s ease-in infinite', animationDelay: '1.3s' }} />

              {/* l letter bubbles */}
              <circle cx="460" cy="80" r="5" fill="#ffffff" opacity="0.65" style={{ animation: 'bubbleFloat 2.4s ease-in infinite', animationDelay: '0.2s' }} />

              {/* v letter bubbles */}
              <circle cx="540" cy="100" r="4" fill="#67e8f9" opacity="0.7" style={{ animation: 'bubbleFloat 3s ease-in infinite', animationDelay: '1.5s' }} />
              <circle cx="580" cy="70" r="6" fill="#ffffff" opacity="0.55" style={{ animation: 'bubbleFloat 2.5s ease-in infinite', animationDelay: '0.7s' }} />

              {/* i letter bubbles */}
              <circle cx="670" cy="90" r="4.5" fill="#ffffff" opacity="0.65" style={{ animation: 'bubbleFloat 2.2s ease-in infinite', animationDelay: '1.1s' }} />

              {/* a letter bubbles */}
              <circle cx="760" cy="110" r="5.5" fill="#a5f3fc" opacity="0.6" style={{ animation: 'bubbleFloat 2.7s ease-in infinite', animationDelay: '0.5s' }} />
              <circle cx="810" cy="80" r="4" fill="#ffffff" opacity="0.7" style={{ animation: 'bubbleFloat 2.4s ease-in infinite', animationDelay: '1.4s' }} />

              {/* Caustic diagonal light beam */}
              <rect 
                x="0" 
                y="30" 
                width="1000" 
                height="16" 
                fill="url(#crestShineGradient)" 
                opacity="0.25" 
                transform="skewX(-25)" 
              />
            </g>

            {/* Radiant Shimmer Glow across the letters when full */}
            {isFull && (
              <rect
                x="0"
                y="0"
                width="1000"
                height="300"
                fill="url(#crestShineGradient)"
                opacity="0.35"
                style={{
                  animation: 'shimmerGlow 1.6s ease-in-out infinite',
                }}
              />
            )}
          </g>

          {/* ============================================================= */}
          {/* LAYER 3: FOREGROUND CRYSTAL HIGHLIGHT OUTLINE */}
          {/* ============================================================= */}
          <text
            x="50%"
            y="52%"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={mode === 'uppercase' ? '210' : '225'}
            fontWeight="900"
            letterSpacing={mode === 'uppercase' ? '8px' : '2px'}
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fill="none"
            stroke="url(#crystalBorderGradient)"
            strokeWidth={isFull ? "3" : "2"}
            className="transition-all duration-500"
            opacity={isFull ? 0.95 : 0.55}
          >
            {displayText}
          </text>
        </svg>
      </div>

      {/* Minimalist Status Micro-Label */}
      <div className="relative z-10 mt-6 sm:mt-8 text-center">
        <p className="text-xs sm:text-sm font-medium tracking-widest uppercase text-slate-400/90 transition-opacity duration-300">
          {isFull ? (role ? `Welcome to ${role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Property Management' : 'Resident'} Portal` : 'Access Granted') : statusText}
        </p>
      </div>

    </div>
  );
}
