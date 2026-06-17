import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '@/components/ui/footer';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { designTokens } from '@/utils/designTokens';
import { motion } from 'framer-motion';
import { OPEN_CONSOLIDATED_REPORT_EVENT } from '@/components/ui/consolidatedReportEvents';

// Error boundary wrapper for critical sections
const SafeWrapper = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('SafeWrapper caught error:', error);
    return fallback || <div>Loading...</div>;
  }
};


const Index = memo(() => {
  const navigate = useNavigate();
  const { setLoading } = useGlobalLoading();
  const { data, loading, error, refetch } = useGoogleSheets();

  const memoizedData = useMemo(() => data, [data]);
  const totalRecords = memoizedData.length;

  const totalRevenue = useMemo(
    () => memoizedData.reduce((sum, d) => sum + (d.grossRevenue || 0), 0),
    [memoizedData]
  );
  const uniqueMembers = useMemo(
    () => new Set(memoizedData.map(d => d.memberId).filter(Boolean)).size,
    [memoizedData]
  );

  const formatRevenue = (val: number): string => {
    if (val >= 1e7) return `₹${(val / 1e7).toFixed(1)}Cr`;
    if (val >= 1e5) return `₹${(val / 1e5).toFixed(1)}L`;
    if (val > 0) return `₹${val.toLocaleString('en-IN')}`;
    return '—';
  };

  useEffect(() => {
    setLoading(loading, 'Loading dashboard overview...');
  }, [loading, setLoading]);
  
  const handleSectionClick = useCallback((sectionId: string) => {
    if (sectionId === 'class-performance-series') {
      window.open('https://class-performance-series-001.vercel.app/', '_blank');
    } else if (sectionId === 'executive-report') {
      navigate('/location-report');
    } else if (sectionId === 'late-cancellations') {
      navigate('/late-cancellations');
    } else {
      navigate(`/${sectionId}`);
    }
  }, [navigate]);
  
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  if (loading) {
    return null; // Global loader will handle this
  }
  if (error) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex items-center justify-center p-4">
        <Card className={`p-12 ${designTokens.card.background} backdrop-blur-sm ${designTokens.card.shadow} ${designTokens.card.border} rounded-2xl max-w-lg`}>
          <CardContent className="text-center space-y-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <div>
              <p className="text-xl font-semibold text-slate-800">Connection Error</p>
              <p className="text-sm text-slate-600 mt-2">{error}</p>
            </div>
            <Button onClick={handleRetry} className="gap-2 bg-slate-800 hover:bg-slate-900 text-white">
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Premium Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50/40 to-white"></div>
        
        {/* Subtle Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-purple-50/20 backdrop-blur-[2px]"></div>
        
        {/* Metric Floating Discs */}
        <div className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/8 rounded-full floating-animation stagger-1 backdrop-blur-md border border-blue-200/40 shadow-lg"></div>
        <div className="absolute top-60 right-20 w-96 h-96 bg-gradient-to-br from-purple-400/8 to-pink-400/10 rounded-full floating-animation stagger-3 backdrop-blur-md border border-purple-200/40 shadow-lg"></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-gradient-to-br from-blue-400/8 to-cyan-400/8 rounded-full floating-animation stagger-5 backdrop-blur-md border border-cyan-200/40 shadow-lg"></div>
        
        {/* Additional Floating Discs */}
        <div className="absolute top-1/4 right-1/2 w-64 h-64 bg-gradient-to-br from-emerald-400/8 to-teal-400/10 rounded-full floating-animation stagger-2 backdrop-blur-md border border-emerald-200/40 shadow-lg"></div>
        <div className="absolute bottom-1/2 right-10 w-56 h-56 bg-gradient-to-br from-rose-400/8 to-pink-400/10 rounded-full floating-animation stagger-4 backdrop-blur-md border border-rose-200/40 shadow-lg"></div>
        <div className="absolute top-3/4 left-1/4 w-48 h-48 bg-gradient-to-br from-violet-400/8 to-purple-400/10 rounded-full floating-animation stagger-6 backdrop-blur-md border border-violet-200/40 shadow-lg"></div>
        <div className="absolute bottom-10 right-1/3 w-40 h-40 bg-gradient-to-br from-amber-400/8 to-orange-400/10 rounded-full floating-animation stagger-1 backdrop-blur-md border border-amber-200/40 shadow-lg"></div>
        <div className="absolute top-1/2 left-16 w-52 h-52 bg-gradient-to-br from-indigo-400/8 to-blue-400/10 rounded-full floating-animation stagger-3 backdrop-blur-md border border-indigo-200/40 shadow-lg"></div>
        
        {/* Premium Floating Orbs - Subtle Accents */}
        <div className="absolute top-32 right-1/4 w-28 h-28 bg-gradient-to-br from-blue-300/12 to-purple-300/10 rounded-full float-gentle stagger-2 backdrop-blur-md border border-slate-200/40 shadow-md"></div>
        <div className="absolute bottom-40 right-16 w-36 h-36 bg-gradient-to-br from-purple-300/10 to-pink-300/12 rounded-full float-gentle stagger-4 backdrop-blur-md border border-slate-200/40 shadow-md"></div>
        <div className="absolute top-3/4 left-20 w-24 h-24 bg-gradient-to-br from-cyan-300/10 to-blue-300/8 rounded-full float-gentle stagger-6 backdrop-blur-md border border-slate-200/40 shadow-md"></div>
        
        {/* Subtle Pulsing Elements */}
        <div className="absolute top-1/4 left-3/4 w-16 h-16 bg-gradient-to-r from-blue-300/20 to-purple-300/20 rounded-full pulse-gentle stagger-1"></div>
        <div className="absolute bottom-1/4 left-1/4 w-12 h-12 bg-gradient-to-r from-purple-300/20 to-pink-300/20 rounded-full pulse-gentle stagger-3"></div>
        <div className="absolute top-1/2 right-1/3 w-14 h-14 bg-gradient-to-r from-blue-300/15 to-purple-300/15 rounded-full pulse-gentle stagger-5"></div>
        
        {/* Morphing Shapes */}
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-200/5 to-purple-200/5 morph-shape stagger-2"></div>
        <div className="absolute bottom-1/3 left-1/4 w-56 h-56 bg-gradient-to-r from-purple-200/5 to-pink-200/5 morph-shape stagger-4"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-6 py-8">
          {/* Premium Header Section */}
          <motion.header
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="dashboard-hero-header mb-6 text-center slide-in-from-left"
          >
            <div className="dashboard-hero-graphics" aria-hidden="true">
              <span className="dashboard-hero-orb dashboard-hero-orb-left floating-animation stagger-1" />
              <span className="dashboard-hero-orb dashboard-hero-orb-right floating-animation stagger-3" />
              <span className="dashboard-hero-orb dashboard-hero-orb-mid pulse-gentle stagger-2" />
              <span className="dashboard-hero-ring dashboard-hero-ring-left" />
              <span className="dashboard-hero-ring dashboard-hero-ring-right" />
            </div>

            <div className="relative z-10">
              <div className="dashboard-title-frame mb-4 mx-auto max-w-full">
                <h1 className="dashboard-main-title">
                  BUSINESS INTELLIGENCE DASHBOARD
                </h1>
                <p className="dashboard-title-subtitle">
                  PHYSIQUE 57 INDIA
                </p>
              </div>

              <div className="w-32 h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 mx-auto shimmer-color-effect rounded-full"></div>
            </div>
          </motion.header>

          {/* Premium Dashboard Grid */}
          <motion.main
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-full mx-auto px-4 slide-in-from-right stagger-2"
          >
            <div className="w-full bg-white border border-slate-200/60 glow-pulse rounded-3xl p-10 shadow-xl shadow-slate-200/40 backdrop-blur-sm">
              {/* Enhanced Controls Section */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200/40">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-slate-700">Live Data</span>
                  </div>
                  <div className="text-sm text-slate-500">
                    {totalRecords.toLocaleString()} records • {uniqueMembers.toLocaleString()} members
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.dispatchEvent(new Event(OPEN_CONSOLIDATED_REPORT_EVENT))}
                    className="gap-2 hover:bg-slate-50 border-slate-300"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Consolidated Report
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRetry}
                    className="gap-2 hover:bg-slate-50 border-slate-300"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                  
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-medium text-slate-600">Auto-sync enabled</span>
                  </div>
                </div>
              </div>
              
              <SafeWrapper fallback={
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-6"></div>
                  <p className="text-slate-700 font-medium text-lg">Loading dashboard...</p>
                  <p className="text-slate-500 text-sm mt-2">Fetching latest analytics data</p>
                </div>
              }>
                <DashboardGrid onButtonClick={handleSectionClick} />
              </SafeWrapper>
            </div>
          </motion.main>
        </div>
      </div>
      
      <Footer />
    </div>;
});

export default Index;
