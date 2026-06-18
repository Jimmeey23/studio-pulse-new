import { useEffect, useRef, useCallback } from 'react';
import { useGlobalLoading } from './useGlobalLoading';

/**
 * Hook that provides a setLoading function with enforced minimum display time
 * When transitioning from loading to not loading, it ensures the loader stays visible
 * for at least the specified duration
 */
export function useMinimumLoadingTime(minTimeMs: number = 600) {
  const { setLoading: originalSetLoading, isLoading } = useGlobalLoading();
  const loaderStartTimeRef = useRef<number | null>(null);
  const pendingHideRef = useRef<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // When component mounts (on route change), reset the timer
  useEffect(() => {
    if (isLoading) {
      loaderStartTimeRef.current = Date.now();
      pendingHideRef.current = false;
    }
  }, [isLoading]);

  const setLoading = useCallback((loading: boolean, message?: string) => {
    if (loading) {
      // Always show loader immediately when loading
      loaderStartTimeRef.current = Date.now();
      pendingHideRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      originalSetLoading(true, message || 'Loading...');
    } else {
      // When trying to hide the loader, check if minimum time has passed
      pendingHideRef.current = true;
      
      if (loaderStartTimeRef.current) {
        const elapsedTime = Date.now() - loaderStartTimeRef.current;
        const remainingTime = Math.max(0, minTimeMs - elapsedTime);

        if (remainingTime > 0) {
          // Delay hiding the loader
          timerRef.current = setTimeout(() => {
            if (pendingHideRef.current) {
              originalSetLoading(false, message || 'Done');
            }
          }, remainingTime);
        } else {
          // Enough time has passed, hide immediately
          originalSetLoading(false, message || 'Done');
        }
      } else {
        // No start time, hide immediately
        originalSetLoading(false, message || 'Done');
      }
    }
  }, [originalSetLoading, minTimeMs]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return setLoading;
}
