
import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LazyGlobalCommandPalette } from "@/components/lazy/LazyGlobalCommandPalette";
import { PageTransition } from "@/components/ui/PageTransition";
import { usePerformanceOptimization } from "@/hooks/usePerformanceOptimization";
import { useRouteChangeLoader } from "@/hooks/useRouteChangeLoader";
import { GlobalFiltersProvider } from "@/contexts/GlobalFiltersContext";
import { MetricsTablesRegistryProvider } from '@/contexts/MetricsTablesRegistryContext';
import { SectionNavigationProvider } from "@/contexts/SectionNavigationContext";
import { SessionsFiltersProvider } from "@/contexts/SessionsFiltersContext";
import { RouteLoadingWrapper } from "@/components/RouteLoadingWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";
import { UniversalTableCopyAssist } from "@/components/ui/UniversalTableCopyAssist";
import { UniversalElementCopyAssist } from "@/components/ui/UniversalElementCopyAssist";
import { LazyConsolidatedReportExporterDialog } from "@/components/lazy/LazyConsolidatedReportExporterDialog";
import { DataSourceProvider, useDataSource } from '@/contexts/DataSourceContext';
import { OfflineAccessManager } from '@/components/ui/OfflineAccessManager';
import StudioPulse from "./pages/StudioPulse";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes (increased for better caching)
      gcTime: 60 * 60 * 1000,    // 60 minutes (increased cache retention)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
      networkMode: 'online',
      refetchInterval: false,
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

// Inner component that uses the route change loader hook
const StudioPulseRoute = () => {
  return <StudioPulse />;
};

const AppRoutes = () => {
  useRouteChangeLoader();
  
  return (
    <>

      <LazyGlobalCommandPalette />
      <UniversalTableCopyAssist />
      <UniversalElementCopyAssist />
      <LazyConsolidatedReportExporterDialog />
      <RouteLoadingWrapper>
        <React.Suspense fallback={<div className="fixed inset-0 z-[9999] bg-white" />}>
          <PageTransition>
            <Routes>
              <Route path="/" element={<Navigate to="/studio-pulse" replace />} />
              <Route path="/studio-pulse" element={<StudioPulseRoute />} />
              <Route path="*" element={<Navigate to="/studio-pulse" replace />} />
            </Routes>
          </PageTransition>
        </React.Suspense>
      </RouteLoadingWrapper>
    </>
  );
};

const AppContent = () => {
  usePerformanceOptimization();
  const { mode, isOnline } = useDataSource();
  const intercomAppId = import.meta.env.VITE_INTERCOM_APP_ID || 'm7p28m4u';

  React.useEffect(() => {
    if (!import.meta.env.PROD || mode === 'offline' || !isOnline || !intercomAppId) {
      return;
    }

    let cancelled = false;

    import('@intercom/messenger-js-sdk').then(({ default: Intercom }) => {
      if (!cancelled) {
        Intercom({
          app_id: intercomAppId,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [intercomAppId, mode, isOnline]);

  return (
    <>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <GlobalFiltersProvider>
          <SessionsFiltersProvider>
            <MetricsTablesRegistryProvider>
              <SectionNavigationProvider>
                <AppRoutes />
                <OfflineAccessManager />
              </SectionNavigationProvider>
            </MetricsTablesRegistryProvider>
          </SessionsFiltersProvider>
        </GlobalFiltersProvider>
      </BrowserRouter>
    </>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <DataSourceProvider>
            <AppContent />
          </DataSourceProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
