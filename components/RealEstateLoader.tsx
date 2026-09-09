'use client';

import React from 'react';
import { Building2, KeyRound, CheckCircle2, ShieldCheck } from 'lucide-react';

interface RealEstateLoaderProps {
  statusText?: string;
  isSuccess?: boolean;
  role?: string | null;
}

export default function RealEstateLoader({
  statusText = 'Authenticating property access...',
  isSuccess = false,
  role = null,
}: RealEstateLoaderProps) {
  const getRoleLabel = () => {
    if (role === 'super_admin') return 'Super Admin Portal';
    if (role === 'admin') return 'Property Manager Portal';
    if (role === 'tenant') return 'Resident Portal';
    return 'Sylvia Portal';
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 p-4 sm:p-8 select-none overflow-hidden animate-in fade-in duration-300">
      
      {/* Full Screen Architectural Blueprint Grid Backdrop */}
      <div 
        className="absolute inset-0 opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(56, 189, 248, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
        }}
      />

      {/* Large Ambient Lighting Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Sylvia Branding Header on Loading Screen */}
      <div className="relative z-10 text-center mb-5 sm:mb-7 animate-in slide-in-from-top-4 duration-500">
        <div className="inline-flex items-center justify-center mb-2.5">
          <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-xl shadow-blue-600/30 ring-4 ring-blue-400/20">
            <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-white stroke-[2.2]" />
            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-amber-400 rounded-full flex items-center justify-center shadow-md border-2 border-slate-950">
              <KeyRound className="h-3 w-3 text-slate-950" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Sylvia
          </h1>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-blue-900/60 text-blue-300 border border-blue-500/30">
            PropTech Access
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
          {isSuccess ? 'Access Granted • Opening Residence Doors' : 'Verifying property credentials & preparing your portal'}
        </p>
      </div>

      {/* Main Architectural Real Estate Scene Card */}
      <div className="relative z-10 w-full max-w-md sm:max-w-lg md:max-w-xl aspect-[16/10.5] rounded-3xl overflow-hidden shadow-2xl shadow-blue-950/60 border border-slate-700/70 bg-gradient-to-b from-slate-950 via-[#0a122e] to-slate-900">
        
        {/* Interior Blueprint Accent */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(56, 189, 248, 0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(56, 189, 248, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Real Estate SVG Scene */}
        <svg
          viewBox="0 0 380 240"
          className="w-full h-full relative z-10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Window Glow Filter */}
            <filter id="fullWindowGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Golden Key Gradient */}
            <linearGradient id="fullGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            {/* Building Gradients */}
            <linearGradient id="fullTowerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="fullWingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            <linearGradient id="fullDoorLightBeam" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </linearGradient>
            
            <linearGradient id="fullScanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Night Sky Stars & Constellation */}
          <circle cx="35" cy="30" r="1" fill="#94a3b8" opacity="0.6" />
          <circle cx="75" cy="45" r="1.3" fill="#e2e8f0" opacity="0.8" />
          <circle cx="120" cy="22" r="1.5" fill="#e2e8f0" opacity="0.9" />
          <circle cx="280" cy="25" r="1" fill="#94a3b8" opacity="0.5" />
          <circle cx="340" cy="48" r="1.4" fill="#cbd5e1" opacity="0.7" />
          <circle cx="360" cy="20" r="1.2" fill="#94a3b8" opacity="0.6" />

          {/* Architectural Crest Orb in Sky */}
          <circle cx="330" cy="36" r="16" fill="#3b82f6" opacity="0.12" />
          <circle cx="330" cy="36" r="11" fill="#60a5fa" opacity="0.22" />

          {/* ======================================================== */}
          {/* ARCHITECTURAL STRUCTURES */}
          {/* ======================================================== */}

          {/* FOUNDATION / STREET LEVEL */}
          <rect x="20" y="218" width="340" height="4" rx="2" fill="#334155" opacity="0.85" />
          <line x1="25" y1="222" x2="355" y2="222" stroke="#0ea5e9" strokeWidth="1.2" strokeDasharray="5 5" opacity="0.4" />

          {/* LEFT WING: Contemporary Residential Terrace (3-Storey) */}
          <g id="fullLeftWing">
            {/* Slanted Penthouse Roof */}
            <polygon points="45,116 125,94 125,116" fill="#0f172a" />
            <line x1="45" y1="116" x2="125" y2="94" stroke="#38bdf8" strokeWidth="1.5" opacity="0.7" />
            
            {/* Wing Structure */}
            <rect x="45" y="116" width="80" height="102" rx="2" fill="url(#fullWingGradient)" stroke="#475569" strokeWidth="1.2" />
            
            {/* Rooftop Greenery/Garden Silhouette */}
            <path d="M55 115 Q60 108 65 115 Q70 106 75 115 Q80 109 85 115" stroke="#10b981" strokeWidth="2.5" fill="none" opacity="0.8" />

            {/* Left Wing Windows (6 Units) */}
            <rect x="58" y="128" width="14" height="18" rx="2" className="window-glow" style={{ animation: 'windowGlow 1.8s ease-in-out infinite alternate', animationDelay: '0.1s' }} />
            <rect x="88" y="128" width="14" height="18" rx="2" className="window-glow" style={{ animation: 'windowGlow 1.8s ease-in-out infinite alternate', animationDelay: '0.6s' }} />
            <rect x="58" y="158" width="14" height="18" rx="2" className="window-glow" style={{ animation: 'windowGlow 1.8s ease-in-out infinite alternate', animationDelay: '0.3s' }} />
            <rect x="88" y="158" width="14" height="18" rx="2" className="window-glow" style={{ animation: 'windowGlow 1.8s ease-in-out infinite alternate', animationDelay: '0.9s' }} />
            <rect x="58" y="188" width="14" height="16" rx="2" className="window-glow" style={{ animation: 'windowGlow 1.8s ease-in-out infinite alternate', animationDelay: '0.45s' }} />
            <rect x="88" y="188" width="14" height="16" rx="2" className="window-glow" style={{ animation: 'windowGlow 1.8s ease-in-out infinite alternate', animationDelay: '1.2s' }} />
          </g>

          {/* RIGHT WING: Contemporary Amenity Deck & Club Lounge */}
          <g id="fullRightWing">
            {/* Pergola / Canopy on Deck */}
            <line x1="255" y1="132" x2="335" y2="132" stroke="#38bdf8" strokeWidth="2" opacity="0.8" />
            <line x1="265" y1="132" x2="265" y2="124" stroke="#64748b" strokeWidth="1.5" />
            <line x1="288" y1="132" x2="288" y2="124" stroke="#64748b" strokeWidth="1.5" />
            <line x1="312" y1="132" x2="312" y2="124" stroke="#64748b" strokeWidth="1.5" />
            <line x1="330" y1="132" x2="330" y2="124" stroke="#64748b" strokeWidth="1.5" />

            {/* Wing Base */}
            <rect x="255" y="132" width="80" height="86" rx="2" fill="url(#fullWingGradient)" stroke="#475569" strokeWidth="1.2" />

            {/* Right Wing Panoramic Windows */}
            <rect x="268" y="145" width="26" height="16" rx="2" className="window-glow" style={{ animation: 'windowGlow 1.8s ease-in-out infinite alternate', animationDelay: '0.2s' }} />
            <rect x="302" y="145" width="26" height="16" rx="2" className="window-glow" style={{ animation: 'windowGlow 1.8s ease-in-out infinite alternate', animationDelay: '0.75s' }} />
            <rect x="268" y="177" width="26" height="16" rx="2" className="window-glow" style={{ animation: 'windowGlow 1.8s ease-in-out infinite alternate', animationDelay: '0.5s' }} />
            <rect x="302" y="177" width="26" height="16" rx="2" className="window-glow" style={{ animation: 'windowGlow 1.8s ease-in-out infinite alternate', animationDelay: '1.1s' }} />
          </g>

          {/* ======================================================== */}
          {/* CENTER TOWER: Sylvia Luxury High-Rise (5 Storeys) */}
          {/* ======================================================== */}
          <g id="fullCenterTower">
            {/* Rooftop Antenna & Beacon */}
            <line x1="190" y1="48" x2="190" y2="24" stroke="#64748b" strokeWidth="2.5" />
            <circle cx="190" cy="22" r="3.5" fill="#ef4444" style={{ animation: 'antennaBeacon 1.2s ease-in-out infinite' }} />
            <circle cx="190" cy="22" r="9" fill="#ef4444" opacity="0.3" style={{ animation: 'antennaBeacon 1.2s ease-in-out infinite' }} />

            {/* Rooftop Crown Structure */}
            <polygon points="135,48 245,48 232,38 148,38" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.8" />
            
            {/* Main Tower Body */}
            <rect x="125" y="48" width="130" height="170" rx="3" fill="url(#fullTowerGradient)" stroke="#38bdf8" strokeWidth="1.5" />

            {/* Vertical Elevator Shaft (Glass Core) */}
            <rect x="180" y="52" width="20" height="135" rx="2" fill="#0f172a" stroke="#0284c7" strokeWidth="1" opacity="0.9" />
            <line x1="190" y1="52" x2="190" y2="187" stroke="#0ea5e9" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.5" />

            {/* Animated Elevator Cabin (Ascending & descending) */}
            <g style={{ animation: 'elevatorGlide 3s ease-in-out infinite' }}>
              <rect x="182" y="158" width="16" height="20" rx="2" fill="#0284c7" opacity="0.9" filter="url(#fullWindowGlow)" />
              <rect x="184" y="161" width="12" height="14" rx="1" fill="#e0f2fe" opacity="0.95" />
            </g>

            {/* Tower Windows Grid (Floor by floor illumination) */}
            {/* Floor 5 - Penthouse Units */}
            <rect x="140" y="58" width="26" height="18" rx="2" className="window-glow" style={{ animation: 'windowGlow 2s ease-in-out infinite alternate', animationDelay: '0.15s' }} />
            <rect x="214" y="58" width="26" height="18" rx="2" className="window-glow" style={{ animation: 'windowGlow 2s ease-in-out infinite alternate', animationDelay: '0.8s' }} />

            {/* Floor 4 */}
            <rect x="140" y="86" width="26" height="18" rx="2" className="window-glow" style={{ animation: 'windowGlow 2s ease-in-out infinite alternate', animationDelay: '0.35s' }} />
            <rect x="214" y="86" width="26" height="18" rx="2" className="window-glow" style={{ animation: 'windowGlow 2s ease-in-out infinite alternate', animationDelay: '1.05s' }} />

            {/* Floor 3 */}
            <rect x="140" y="114" width="26" height="18" rx="2" className="window-glow" style={{ animation: 'windowGlow 2s ease-in-out infinite alternate', animationDelay: '0.55s' }} />
            <rect x="214" y="114" width="26" height="18" rx="2" className="window-glow" style={{ animation: 'windowGlow 2s ease-in-out infinite alternate', animationDelay: '1.25s' }} />

            {/* Floor 2 */}
            <rect x="140" y="142" width="26" height="18" rx="2" className="window-glow" style={{ animation: 'windowGlow 2s ease-in-out infinite alternate', animationDelay: '0.25s' }} />
            <rect x="214" y="142" width="26" height="18" rx="2" className="window-glow" style={{ animation: 'windowGlow 2s ease-in-out infinite alternate', animationDelay: '0.95s' }} />

            {/* Floor 1 - Entrance Level */}
            <rect x="140" y="170" width="26" height="18" rx="2" className="window-glow" style={{ animation: 'windowGlow 2s ease-in-out infinite alternate', animationDelay: '0.4s' }} />
            <rect x="214" y="170" width="26" height="18" rx="2" className="window-glow" style={{ animation: 'windowGlow 2s ease-in-out infinite alternate', animationDelay: '1.15s' }} />

            {/* Sylvia Portico Canopy */}
            <polygon points="166,194 214,194 218,199 162,199" fill="#3b82f6" opacity="0.95" />
            <text x="190" y="193" textAnchor="middle" fill="#93c5fd" fontSize="5.5" fontWeight="bold" letterSpacing="1">SYLVIA</text>

            {/* Welcoming Door Light Beam */}
            <polygon points="175,200 205,200 224,222 156,222" fill="url(#fullDoorLightBeam)" opacity={isSuccess ? '0.95' : '0.5'} />

            {/* Entrance Double Doors */}
            <rect x="175" y="200" width="14" height="18" fill="#1e293b" stroke="#60a5fa" strokeWidth="1" />
            <rect x="191" y="200" width="14" height="18" fill="#1e293b" stroke="#60a5fa" strokeWidth="1" />
            {/* Door handles */}
            <circle cx="186" cy="209" r="1.2" fill="#fbbf24" />
            <circle cx="196" cy="209" r="1.2" fill="#fbbf24" />

            {/* Entrance Unlock Ripple Waves */}
            <circle cx="190" cy="209" fill="none" stroke="#fbbf24" style={{ animation: 'doorRipple 1.8s ease-out infinite' }} />
            <circle cx="190" cy="209" fill="none" stroke="#38bdf8" style={{ animation: 'doorRipple 1.8s ease-out infinite', animationDelay: '0.9s' }} />
          </g>

          {/* ======================================================== */}
          {/* THE GOLDEN MASTER KEY & UNLOCK ANIMATION */}
          {/* ======================================================== */}
          <g 
            id="fullMasterKey"
            transform="translate(190, 180)"
            style={{ 
              animation: isSuccess ? 'none' : 'keyUnlockMotion 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
              transformOrigin: '0 0'
            }}
          >
            {/* Ambient Aura */}
            <circle cx="0" cy="0" r="16" fill="#f59e0b" opacity="0.25" filter="url(#fullWindowGlow)" />
            
            {/* Key Head */}
            <circle cx="-14" cy="0" r="8" fill="none" stroke="url(#fullGoldGradient)" strokeWidth="3" />
            <circle cx="-14" cy="0" r="4" fill="none" stroke="url(#fullGoldGradient)" strokeWidth="1.2" opacity="0.6" />
            
            {/* Key Shaft */}
            <line x1="-6" y1="0" x2="16" y2="0" stroke="url(#fullGoldGradient)" strokeWidth="3" strokeLinecap="round" />
            
            {/* Key Teeth */}
            <line x1="9" y1="0" x2="9" y2="6" stroke="url(#fullGoldGradient)" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="14" y1="0" x2="14" y2="8" stroke="url(#fullGoldGradient)" strokeWidth="2.4" strokeLinecap="round" />
          </g>

          {/* Blueprint Laser Scan Line */}
          <rect
            x="35"
            y="20"
            width="310"
            height="3"
            fill="url(#fullScanGradient)"
            style={{ animation: 'scanLine 3s ease-in-out infinite' }}
            pointerEvents="none"
          />

          {/* Success Checkmark & Access Granted Overlay */}
          {isSuccess && (
            <g transform="translate(190, 120)">
              <circle cx="0" cy="0" r="30" fill="#10b981" opacity="0.95" filter="url(#fullWindowGlow)" />
              <path d="M-11 -1 L-3 9 L14 -8" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
          )}
        </svg>

        {/* Real Estate Industry Badges Overlay */}
        <div className="absolute top-3.5 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md z-20">
          <Building2 className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-slate-200 tracking-wide">
            Sylvia Residence Security
          </span>
        </div>

        <div className="absolute top-3.5 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md z-20">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSuccess ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isSuccess ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className="text-[11px] font-medium text-slate-300">
            {isSuccess ? 'Doors Unlocked' : 'Master Key Active'}
          </span>
        </div>
      </div>

      {/* Progress & Micro-Copy Section */}
      <div className="relative z-10 w-full max-w-md sm:max-w-lg md:max-w-xl mt-5 sm:mt-6 space-y-3">
        {/* Status Text with Dynamic Icon */}
        <div className="flex items-center justify-center gap-2.5 text-center">
          {isSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />
          ) : (
            <KeyRound className="w-5 h-5 text-sky-400 animate-spin" style={{ animationDuration: '3s' }} />
          )}
          <p className="text-sm sm:text-base font-semibold text-white tracking-wide transition-all duration-300">
            {isSuccess ? `Access Granted • Welcome to ${getRoleLabel()}` : statusText}
          </p>
        </div>

        {/* Animated Architectural Progress Bar */}
        <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/80">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isSuccess 
                ? 'w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400' 
                : 'w-3/4 bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-600 animate-pulse'
            }`}
          />
        </div>

        {/* PropTech Step Indicators */}
        <div className="flex justify-between text-xs text-slate-400 pt-1 px-1 font-medium">
          <span className="flex items-center gap-1.5 text-sky-400">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
            Verify Resident
          </span>
          <span className={`flex items-center gap-1.5 ${isSuccess ? 'text-sky-400' : 'text-amber-400 font-semibold'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isSuccess ? 'bg-sky-400' : 'bg-amber-400 animate-ping'}`}></span>
            Turn Master Key
          </span>
          <span className={`flex items-center gap-1.5 ${isSuccess ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isSuccess ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
            Open Portal
          </span>
        </div>
      </div>

      {/* Footer Security Note */}
      <div className="relative z-10 mt-6 sm:mt-8 text-center">
        <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          End-to-End Encrypted Property Access • Sylvia PropTech
        </p>
      </div>
    </div>
  );
}
