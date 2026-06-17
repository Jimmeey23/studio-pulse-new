import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-6 overflow-hidden font-sans bg-[linear-gradient(180deg,#030309,rgba(10,11,13,0.95))] text-slate-300 h-14">
      {/* Subtle textured backdrop */}
      <div className="absolute inset-0 opacity-6" style={{ backgroundImage: 'radial-gradient(circle at 0% 50%, rgba(148,163,184,0.02), transparent 25%)' }} />

      {/* Thin top accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-[linear-gradient(90deg,transparent,#0f172a22,transparent)]" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Left: logo + title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-sm bg-transparent border border-slate-800/40 overflow-hidden transition-transform duration-200 hover:scale-[1.04]">
            <img src="/images/Logo.png" alt="Physique 57 logo" className="w-7 h-7 object-contain logo-animated" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold text-slate-200 tracking-wide">PHYSIQUE 57, INDIA</span>
            <span className="text-[11px] text-slate-500">Advanced Business Analytics</span>
          </div>
        </div>

        {/* Center: condensed descriptor */}
        <div className="hidden md:block text-center">
          <span className="text-[11px] text-slate-500">Real-time Insights · 14 Analytics Modules · Precision & Data Accuracy</span>
        </div>

        {/* Right: meta */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[11px] text-slate-500">v1.0.0</span>
            <span className="text-[11px] text-slate-500">2025</span>
          </div>

          <div className="live-badge flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-900/30 to-emerald-900/20 border border-emerald-800/40 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-300 tracking-wider">LIVE</span>
          </div>
        </div>
      </div>

      {/* Bottom hairline */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[linear-gradient(90deg,transparent,#0f172a22,transparent)]" />

      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width:768px){ footer{height:56px} }
        footer{backdrop-filter: blur(6px);}

        /* Live badge entrance + subtle hover */
        @keyframes live-enter { 0% {transform:translateY(6px) scale(.98); opacity:0} 60% {transform:translateY(-2px) scale(1.02); opacity:1} 100% {transform:none; opacity:1} }
        .live-badge { animation: live-enter 600ms cubic-bezier(.2,.9,.3,1) both; transition: transform .18s ease, box-shadow .18s ease; }
        .live-badge:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 24px rgba(14,165,233,0.06); }

        /* Logo hue animation */
        @keyframes logo-hue { 0% { filter: hue-rotate(0deg) } 50% { filter: hue-rotate(180deg) } 100% { filter: hue-rotate(360deg) } }
        .logo-animated { animation: logo-hue 8s linear infinite; transition: transform 160ms ease, filter 300ms ease; will-change: filter, transform; }
        .logo-animated:hover { transform: translateY(-2px) scale(1.04); filter: brightness(1.05) saturate(1.1); animation-play-state: paused; }

        /* Improve contrast on small screens */
        @media (max-width:640px){ .live-badge { padding-left:.6rem; padding-right:.6rem } }
      `}} />
    </footer>
  );
};
