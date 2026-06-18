import React from 'react';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';

interface RouteLoadingWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper that prevents page content from being visible while the global loader is showing
 * Uses visibility instead of removing from DOM to maintain component state
 */
export const RouteLoadingWrapper: React.FC<RouteLoadingWrapperProps> = ({ children }) => {
  const { isLoading } = useGlobalLoading();

  return (
    <div
      style={{
        visibility: isLoading ? 'hidden' : 'visible',
        pointerEvents: isLoading ? 'none' : 'auto',
      }}
    >
      {children}
    </div>
  );
};
