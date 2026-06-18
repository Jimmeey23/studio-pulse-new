/**
 * Advanced Performance Optimizations
 * Implements multiple strategies to improve app loading and runtime performance
 */

import { useEffect, useRef, useCallback } from 'react';

// ==================== MEMOIZATION & CACHING ====================

/**
 * Enhanced memoization with size limits and TTL
 */
export function createMemoCache<T = any>(maxSize = 100, ttl = 5 * 60 * 1000) {
  const cache = new Map<string, { value: T; timestamp: number }>();
  
  return {
    get(key: string): T | undefined {
      const entry = cache.get(key);
      if (!entry) return undefined;
      
      // Check if expired
      if (Date.now() - entry.timestamp > ttl) {
        cache.delete(key);
        return undefined;
      }
      
      return entry.value;
    },
    
    set(key: string, value: T): void {
      // Implement LRU-style eviction
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      cache.set(key, { value, timestamp: Date.now() });
    },
    
    clear(): void {
      cache.clear();
    },
    
    size(): number {
      return cache.size;
    }
  };
}

// ==================== VIRTUAL SCROLLING ====================

/**
 * Hook for virtual scrolling large lists
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan = 3
) {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
    startIndex,
    endIndex
  };
}

// ==================== DEBOUNCE & THROTTLE ====================

/**
 * Optimized debounce hook
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Throttle hook for high-frequency events
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = React.useState(value);
  const lastRan = useRef(Date.now());
  
  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);
  
  return throttledValue;
}

// ==================== IMAGE OPTIMIZATION ====================

/**
 * Lazy load images with IntersectionObserver
 */
export function useLazyImage(src: string, options?: IntersectionObserverInit) {
  const [imageSrc, setImageSrc] = React.useState<string | undefined>(undefined);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    if (!imgRef.current) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setImageSrc(src);
        observer.disconnect();
      }
    }, options);
    
    observer.observe(imgRef.current);
    
    return () => observer.disconnect();
  }, [src, options]);
  
  return { imgRef, imageSrc, isLoaded, setIsLoaded };
}

// ==================== DATA PROCESSING ====================

/**
 * Process large datasets in chunks to avoid blocking
 */
export async function processDataInChunks<T, R>(
  data: T[],
  processor: (item: T) => R,
  chunkSize = 100
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    
    // Process chunk
    const chunkResults = chunk.map(processor);
    results.push(...chunkResults);
    
    // Yield to browser between chunks
    if (i + chunkSize < data.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return results;
}

/**
 * Web Worker for heavy computations
 */
export function useWebWorker<T, R>(
  workerFunction: (data: T) => R
): [(data: T) => Promise<R>, boolean] {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const workerRef = useRef<Worker | null>(null);
  
  const process = useCallback((data: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      setIsProcessing(true);
      
      // Create worker blob
      const blob = new Blob([`
        self.onmessage = function(e) {
          const result = (${workerFunction.toString()})(e.data);
          self.postMessage(result);
        };
      `], { type: 'application/javascript' });
      
      const worker = new Worker(URL.createObjectURL(blob));
      workerRef.current = worker;
      
      worker.onmessage = (e) => {
        setIsProcessing(false);
        resolve(e.data);
        worker.terminate();
      };
      
      worker.onerror = (error) => {
        setIsProcessing(false);
        reject(error);
        worker.terminate();
      };
      
      worker.postMessage(data);
    });
  }, [workerFunction]);
  
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);
  
  return [process, isProcessing];
}

// ==================== REQUEST OPTIMIZATION ====================

/**
 * Request deduplication - prevents duplicate requests
 */
class RequestCache {
  private pending = new Map<string, Promise<any>>();
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl: number;
  
  constructor(ttl = 60000) {
    this.ttl = ttl;
  }
  
  async fetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Return cached if valid
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    
    // Return pending request if exists
    if (this.pending.has(key)) {
      return this.pending.get(key);
    }
    
    // Create new request
    const promise = fetcher().then(data => {
      this.cache.set(key, { data, timestamp: Date.now() });
      this.pending.delete(key);
      return data;
    }).catch(error => {
      this.pending.delete(key);
      throw error;
    });
    
    this.pending.set(key, promise);
    return promise;
  }
  
  clear() {
    this.pending.clear();
    this.cache.clear();
  }
}

export const requestCache = new RequestCache();

// ==================== DOM OPTIMIZATION ====================

/**
 * Batch DOM reads/writes to avoid layout thrashing
 */
export class DOMScheduler {
  private readQueue: (() => void)[] = [];
  private writeQueue: (() => void)[] = [];
  private scheduled = false;
  
  scheduleRead(fn: () => void) {
    this.readQueue.push(fn);
    this.schedule();
  }
  
  scheduleWrite(fn: () => void) {
    this.writeQueue.push(fn);
    this.schedule();
  }
  
  private schedule() {
    if (this.scheduled) return;
    this.scheduled = true;
    
    requestAnimationFrame(() => {
      // Execute all reads
      const reads = [...this.readQueue];
      this.readQueue = [];
      reads.forEach(fn => fn());
      
      // Execute all writes
      const writes = [...this.writeQueue];
      this.writeQueue = [];
      writes.forEach(fn => fn());
      
      this.scheduled = false;
    });
  }
}

export const domScheduler = new DOMScheduler();

// ==================== COMPONENT OPTIMIZATION ====================

/**
 * Detect if component should skip render
 */
export function useSkipRender<T extends Record<string, any>>(
  props: T,
  compareFn?: (prev: T, next: T) => boolean
): boolean {
  const prevProps = useRef<T>(props);
  const shouldSkip = useRef(false);
  
  useEffect(() => {
    if (compareFn) {
      shouldSkip.current = compareFn(prevProps.current, props);
    } else {
      shouldSkip.current = Object.keys(props).every(
        key => prevProps.current[key] === props[key]
      );
    }
    
    prevProps.current = props;
  });
  
  return shouldSkip.current;
}

/**
 * Intersection Observer hook for lazy rendering
 */
export function useInView(options?: IntersectionObserverInit) {
  const [inView, setInView] = React.useState(false);
  const [hasBeenInView, setHasBeenInView] = React.useState(false);
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (!ref.current) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (entry.isIntersecting) {
        setHasBeenInView(true);
      }
    }, options);
    
    observer.observe(ref.current);
    
    return () => observer.disconnect();
  }, [options]);
  
  return { ref, inView, hasBeenInView };
}

// Fix React import
import * as React from 'react';
