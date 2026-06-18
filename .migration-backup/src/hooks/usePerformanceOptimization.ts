import { useEffect } from 'react';

export const usePerformanceOptimization = () => {
  useEffect(() => {
    const disableLongTaskLogs = (import.meta as any)?.env?.VITE_DISABLE_LONGTASK_LOGS === 'true';
    const LONG_TASK_THRESHOLD = 200; // ms (raised from 100ms to reduce noise)
    // Warm up critical page bundles for faster navigation by dynamically importing
    // the page modules instead of prefetching route URLs.
    const preloadPages = () => {
      const imports: Array<() => Promise<any>> = [
        () => import('../pages/ExecutiveSummary'),
        () => import('../pages/SalesAnalytics'),
        () => import('../pages/FunnelLeads'),
        () => import('../pages/ClientRetention'),
        () => import('../pages/TrainerPerformance'),
      ];

      // Skip speculative preloading on constrained connections.
      const connection = (navigator as any)?.connection;
      const isConstrainedConnection = Boolean(
        connection?.saveData ||
        connection?.effectiveType === 'slow-2g' ||
        connection?.effectiveType === '2g'
      );
      if (isConstrainedConnection) return;

      const warmChunk = (fn: () => Promise<any>) => {
        try {
          fn().catch(() => {
            // Ignore warmup failures; route navigation remains source of truth.
          });
        } catch {
          // Ignore synchronous errors from dynamic imports.
        }
      };

      // Prioritize the most frequently visited analytics routes first.
      imports.slice(0, 3).forEach(warmChunk);
      // Defer lower-priority warmups to keep the main thread responsive.
      setTimeout(() => imports.slice(3).forEach(warmChunk), 800);
    };

    // Preload critical resources on idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadPages);
    } else {
      setTimeout(preloadPages, 100);
    }

    // Enable performance observer for monitoring
    let performanceObserver: PerformanceObserver | null = null;
    const intersectionObservers: IntersectionObserver[] = [];
    
    if ('PerformanceObserver' in window && !disableLongTaskLogs) {
      performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          // Log long tasks for debugging (reduced threshold for better detection)
          if (entry.entryType === 'longtask' && entry.duration > LONG_TASK_THRESHOLD) {
            // Long task detected - could add reporting here if needed
          }
        });
      });

      try {
        performanceObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Fallback for browsers that don't support longtask
      }
    }

    // Optimize images loading
    const optimizeImages = () => {
      const images = document.querySelectorAll('img[loading="lazy"]');
      images.forEach((img) => {
        if ('IntersectionObserver' in window) {
          const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const image = entry.target as HTMLImageElement;
                if (image.dataset.src) {
                  image.src = image.dataset.src;
                  image.removeAttribute('data-src');
                  imageObserver.unobserve(image);
                }
              }
            });
          });
          imageObserver.observe(img);
          intersectionObservers.push(imageObserver);
        }
      });
    };

    // Run image optimization
    optimizeImages();

    // Cleanup function
    return () => {
      // Clean up performance observer
      if (performanceObserver) {
        performanceObserver.disconnect();
      }
      
      // Clean up intersection observers
      intersectionObservers.forEach(observer => {
        observer.disconnect();
      });
    };
  }, []);
};
