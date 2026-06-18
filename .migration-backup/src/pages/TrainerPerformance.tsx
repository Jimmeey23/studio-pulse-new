import React, { useEffect, useMemo, useState } from 'react';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { EnhancedTrainerPerformanceSection } from '@/components/dashboard/EnhancedTrainerPerformanceSection';
import { Footer } from '@/components/ui/footer';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { usePayrollData } from '@/hooks/usePayrollData';
import { formatCurrency } from '@/utils/formatters';
import { DisplayedTablesExportButton } from '@/components/ui/DisplayedTablesExportButton';

const TrainerPerformance = () => {
  const { data: payrollData, isLoading } = usePayrollData();
  const { isLoading: globalLoading, setLoading } = useGlobalLoading();
  const [isContentReady, setIsContentReady] = useState(false);

  useEffect(() => {
    // Keep loading active until both data is loaded and content is ready
    const shouldLoad = isLoading || !isContentReady;
    setLoading(shouldLoad, 'Analyzing trainer performance metrics and insights...');
  }, [isLoading, isContentReady, setLoading]);

  useEffect(() => {
    // Mark content as ready once data is available
    if (!isLoading && payrollData && payrollData.length > 0) {
      const timer = setTimeout(() => {
        setIsContentReady(true);
      }, 150);
      return () => clearTimeout(timer);
    } else if (!isLoading && (!payrollData || payrollData.length === 0)) {
      setIsContentReady(true);
    }
  }, [isLoading, payrollData]);

  const heroMetrics = useMemo(() => {
    if (!payrollData || payrollData.length === 0) return [];

    const locations = [
      { key: 'Kwality House, Kemps Corner', name: 'Kwality' },
      { key: 'Supreme HQ, Bandra', name: 'Supreme' },
      { key: 'Kenkere House', name: 'Kenkere' }
    ];

    return locations.map(location => {
      const locationData = payrollData.filter(item => 
        location.key === 'Kenkere House' 
          ? item.location?.includes('Kenkere') || item.location === 'Kenkere House'
          : item.location === location.key
      );
      
      const totalTrainers = new Set(locationData.map(item => item.teacherName)).size;
      const totalSessions = locationData.reduce((sum, item) => sum + (item.totalSessions || 0), 0);
      const totalRevenue = locationData.reduce((sum, item) => sum + (item.totalPaid || 0), 0);
      const avgRevenuePerTrainer = totalTrainers > 0 ? totalRevenue / totalTrainers : 0;
      
      return {
        location: location.name,
        label: `${totalTrainers} Trainers`,
        value: formatCurrency(avgRevenuePerTrainer),
        subtitle: `Avg ₹${(avgRevenuePerTrainer/1000).toFixed(0)}K/trainer`
      };
    });
  }, [payrollData]);

  const exportButton = useMemo(() => (
    <DisplayedTablesExportButton
      analyticsName="Trainer Performance Analytics"
      defaultFileName="trainer-performance"
      buttonLabel="Export Trainer Tables"
      buttonVariant="default"
      buttonSize="sm"
      buttonClassName="rounded-xl border border-blue-800/70 bg-gradient-to-r from-slate-950 via-blue-950 to-blue-900 text-white shadow-lg shadow-blue-950/20 hover:border-blue-700/80 hover:from-slate-900 hover:via-blue-900 hover:to-blue-800"
      tabOptions={[
        { key: 'month-on-month', label: 'Month-on-Month tab', matchers: ['month-on-month', 'month on month'] },
        { key: 'year-on-year', label: 'Year-on-Year tab', matchers: ['year-on-year', 'year on year'] },
        { key: 'efficiency-analysis', label: 'Efficiency tab', matchers: ['efficiency-analysis', 'efficiency'] },
        { key: 'performance-detail', label: 'Performance Detail tab', matchers: ['performance-detail', 'performance'] },
      ]}
    />
  ), []);

  if (globalLoading) {
    return null; // Global loader will handle this
  }

  return (
    <div className="trainer-performance-unified min-h-screen bg-white relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full floating-animation stagger-1"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full floating-animation stagger-3"></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-full morph-shape stagger-2"></div>
      </div>
      
      <div className="relative z-10">
        <div className="bg-white text-slate-800 slide-in-from-left">
          <DashboardMotionHero 
            title="Trainer Performance Analytics"
            subtitle="Comprehensive trainer performance metrics, insights, and development opportunities"
            metrics={heroMetrics}
            extra={exportButton}
          />
        </div>

        <div className="container mx-auto px-6 py-8 bg-white min-h-screen">
          <main className="space-y-8 slide-in-from-right stagger-1">
            <EnhancedTrainerPerformanceSection />
          </main>
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

export default TrainerPerformance;
