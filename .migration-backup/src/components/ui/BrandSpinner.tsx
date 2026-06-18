import React, { useState } from 'react';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface BrandSpinnerProps {
  size?: SpinnerSize;
  className?: string;
  ringOnly?: boolean;
  ariaLabel?: string;
  srcs?: string[];
}

const sizeMap: Record<SpinnerSize, { box: string; img: string; outer: string; inner: string; glow: string }> = {
  xs: { box: 'w-5 h-5',   img: 'w-2.5 h-2.5', outer: 'w-5 h-5 border-[1.5px]', inner: 'w-3.5 h-3.5 border-[1px]', glow: '4px' },
  sm: { box: 'w-7 h-7',   img: 'w-3.5 h-3.5', outer: 'w-7 h-7 border-2',       inner: 'w-5 h-5 border-[1.5px]',   glow: '6px' },
  md: { box: 'w-10 h-10', img: 'w-5 h-5',     outer: 'w-10 h-10 border-2',     inner: 'w-7 h-7 border-[1.5px]',   glow: '8px' },
  lg: { box: 'w-14 h-14', img: 'w-8 h-8',     outer: 'w-14 h-14 border-[3px]', inner: 'w-10 h-10 border-2',       glow: '12px' },
  xl: { box: 'w-20 h-20', img: 'w-11 h-11',   outer: 'w-20 h-20 border-[3px]', inner: 'w-14 h-14 border-2',       glow: '16px' },
};

export const BrandSpinner: React.FC<BrandSpinnerProps> = ({
  size = 'md',
  className = '',
  ringOnly = false,
  ariaLabel = 'Loading',
  srcs = ['/physique57-logo.png', '/placeholder.svg'],
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [srcIndex, setSrcIndex] = useState(0);
  const sz = sizeMap[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center ${sz.box} ${className}`}
      role="status"
      aria-label={ariaLabel}
    >
      {/* Outer ring – slow clockwise, violet→indigo gradient */}
      <div
        className={`absolute ${sz.outer} animate-spin rounded-full`}
        style={{
          border: '0',
          background: 'transparent',
          boxShadow: `0 0 ${sz.glow} rgba(139,92,246,0.35)`,
          borderTop: '2px solid rgba(139,92,246,0.8)',
          borderRight: '2px solid rgba(99,102,241,0.4)',
          borderBottom: '2px solid rgba(139,92,246,0.15)',
          borderLeft: '2px solid rgba(99,102,241,0.15)',
          borderRadius: '9999px',
          animationDuration: '1.2s',
        }}
      />
      {/* Inner ring – faster counter-clockwise, purple→sky */}
      <div
        className={`absolute ${sz.inner} rounded-full`}
        style={{
          border: '0',
          background: 'transparent',
          borderTop: '1.5px solid rgba(59,130,246,0.15)',
          borderRight: '1.5px solid rgba(168,85,247,0.7)',
          borderBottom: '1.5px solid rgba(59,130,246,0.5)',
          borderLeft: '1.5px solid rgba(168,85,247,0.15)',
          borderRadius: '9999px',
          animation: 'spin 0.75s linear infinite reverse',
        }}
      />

      {/* Center logo or fallback */}
      {!ringOnly && !imgFailed && (
        <img
          src={srcs[srcIndex]}
          alt="Physique 57"
          className={`${sz.img} object-contain`}
          style={{ animation: 'pulse 2s ease-in-out infinite' }}
          onError={() => {
            if (srcIndex < srcs.length - 1) {
              setSrcIndex(srcIndex + 1);
            } else {
              setImgFailed(true);
            }
          }}
        />
      )}
      {!ringOnly && imgFailed && (
        <div
          className={`${sz.img} rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-[8px]`}
          style={{ animation: 'pulse 2s ease-in-out infinite' }}
        >
          P57
        </div>
      )}
    </div>
  );
};

export default BrandSpinner;
