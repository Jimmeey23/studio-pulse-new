import React, { useState } from 'react';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

interface BrandSpinnerProps {
  size?: SpinnerSize;
  className?: string;
  /** If true, only shows the ring without the logo image (useful for very tight spaces) */
  ringOnly?: boolean;
  /** Optional accessible label for screen readers */
  ariaLabel?: string;
  /** Tailwind classes to customize the ring border color/opacity */
  ringClassName?: string;
  /** One or more image sources to attempt (in order) for the center logo */
  srcs?: string[];
}

const sizeMap: Record<SpinnerSize, { box: string; img: string; ring: string; border: string }> = {
  xs: { box: 'w-4 h-4', img: 'w-2.5 h-2.5', ring: 'w-4 h-4', border: 'border-[1.5px]' },
  sm: { box: 'w-5 h-5', img: 'w-3.5 h-3.5', ring: 'w-5 h-5', border: 'border-2' },
  md: { box: 'w-8 h-8', img: 'w-5 h-5', ring: 'w-8 h-8', border: 'border-2' },
  lg: { box: 'w-12 h-12', img: 'w-8 h-8', ring: 'w-12 h-12', border: 'border-[3px]' },
};

export const BrandSpinner: React.FC<BrandSpinnerProps> = ({
  size = 'md',
  className = '',
  ringOnly = false,
  ariaLabel = 'Loading',
  ringClassName = 'border-blue-500/50',
  srcs = ['/physique57-logo.png', '/placeholder.svg'],
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [srcIndex, setSrcIndex] = useState(0);
  const sz = sizeMap[size];

  return (
    <div className={`relative inline-flex items-center justify-center ${sz.box} ${className}`} role="status" aria-label={ariaLabel}>
      {!ringOnly && !imgFailed && (
        <img
          src={srcs[srcIndex]}
          alt="Physique 57"
          className={`${sz.img} object-contain animate-pulse`}
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
        <div className={`${sz.img} rounded-sm bg-slate-300 animate-pulse`} />
      )}

      {/* Rotating ring */}
      <div
        className={`absolute ${sz.ring} rounded-full ${sz.border} border-t-transparent border-l-transparent ${ringClassName} animate-spin`}
      />
    </div>
  );
};

export default BrandSpinner;
