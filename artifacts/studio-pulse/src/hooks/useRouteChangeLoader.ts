import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobalLoading } from './useGlobalLoading';

const ROUTE_CHANGE_LOADER_KEY = '__route_change_loader__';

/**
 * Hook that shows the global loader immediately when route changes
 * This prevents the old page from showing during navigation
 * Enforces a minimum display time for the loader
 *
 * NOTE: Only triggers on pathname changes. Search param updates (e.g. switching
 * studio tabs) must NOT trigger loading because setLoading(false) is only called
 * when data loading completes, which never re-fires if the data is already cached.
 */
export function useRouteChangeLoader() {
  const location = useLocation();
  const { setLoading } = useGlobalLoading();

  useEffect(() => {
    // Show loader only on actual page navigation (pathname changes),
    // NOT on search param updates like studio/date filter changes.
    setLoading(true, 'Loading page...');
  }, [location.pathname, setLoading]);

  // Store a reference in window to prevent pages from dismissing the loader too early
  useEffect(() => {
    (window as any)[ROUTE_CHANGE_LOADER_KEY] = true;

    return () => {
      delete (window as any)[ROUTE_CHANGE_LOADER_KEY];
    };
  }, [location.pathname]);
}
