import { QueryClient } from '@tanstack/react-query';

// Create query client with optimized defaults (no persistence)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale-while-revalidate strategy
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh
      gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache
      
      // Performance optimizations
      refetchOnWindowFocus: false, // Don't refetch on tab focus to save API calls
      refetchOnReconnect: true, // Refetch when internet reconnects
      retry: 3, // Retry failed requests 3 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      
      // Network optimizations
      networkMode: 'online', // Only run queries when online
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

// Note: Persistence removed for production app that runs across multiple devices
// In-memory cache with optimized stale-time provides excellent performance
// For server-side persistence, consider implementing with your backend API
