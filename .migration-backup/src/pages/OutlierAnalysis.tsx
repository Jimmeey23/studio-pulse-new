import React, { useEffect, useMemo } from 'react';
import { Footer } from '@/components/ui/footer';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useCheckinsData } from '@/hooks/useCheckinsData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useNewClientData } from '@/hooks/useNewClientData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { formatNumber } from '@/utils/formatters';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { GlobalFiltersProvider } from '@/contexts/GlobalFiltersContext';
import { DataLabWorkspace } from '@/components/dashboard/DataLabWorkspace';

const DataLabPageContent = () => {
  const { data: salesData, loading: salesLoading, error: salesError, refetch } = useGoogleSheets();
  const { data: sessionsData, loading: sessionsLoading } = useSessionsData();
  const { data: checkinsData, loading: checkinsLoading } = useCheckinsData();
  const { data: leadsData, loading: leadsLoading } = useLeadsData();
  const { data: newClientData, loading: newClientLoading } = useNewClientData();
  const { data: payrollData, isLoading: payrollLoading } = usePayrollData();
  const { setLoading } = useGlobalLoading();

  const loading =
    salesLoading || sessionsLoading || checkinsLoading || leadsLoading || newClientLoading || payrollLoading;

  useEffect(() => {
    setLoading(loading, 'Loading custom Data Lab sources...');
  }, [loading, setLoading]);

  const heroMetrics = useMemo(() => {
    return [
      {
        location: 'Sales',
        label: 'Rows',
        value: formatNumber((salesData || []).length),
      },
      {
        location: 'Sessions',
        label: 'Rows',
        value: formatNumber((sessionsData || []).length),
      },
      {
        location: 'Leads',
        label: 'Rows',
        value: formatNumber((leadsData || []).length),
      },
      {
        location: 'Payroll',
        label: 'Rows',
        value: formatNumber((payrollData || []).length),
      },
    ];
  }, [salesData, sessionsData, leadsData, payrollData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full floating-animation stagger-1"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full floating-animation stagger-3"></div>
          <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-full morph-shape stagger-2"></div>
        </div>

        <div className="relative z-10 container mx-auto px-6 py-10">
          <LoadingSkeleton type="full-page" />
        </div>
      </div>
    );
  }

  if (salesError) {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full floating-animation stagger-1"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full floating-animation stagger-3"></div>
        </div>

        <div className="relative z-10 container mx-auto px-6 py-10">
          <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl shadow-sm">
            <div className="font-semibold text-lg mb-1">Failed to load Data Lab sources</div>
            <div className="text-sm opacity-90 mb-4">{String(salesError)}</div>
            <button
              onClick={refetch}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dataSources = {
    Sales: salesData || [],
    Sessions: sessionsData || [],
    Checkins: checkinsData || [],
    Leads: leadsData || [],
    NewClients: newClientData || [],
    Payroll: payrollData || [],
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full floating-animation stagger-1"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full floating-animation stagger-3"></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-full morph-shape stagger-2"></div>
      </div>

      <div className="relative z-10">
        <div className="bg-white text-slate-800 slide-in-from-left">
          <DashboardMotionHero
            title="Custom Data Lab"
            subtitle="Build advanced pivot tables and chart models across any source, define source relationships, style outputs, and auto-save views."
            metrics={heroMetrics}
            onExportClick={() => {}}
          />

          <div className="container mx-auto px-6 py-8">
            <DataLabWorkspace dataSources={dataSources} />
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

const OutlierAnalysis = () => {
  return (
    <GlobalFiltersProvider>
      <DataLabPageContent />
    </GlobalFiltersProvider>
  );
};

export default OutlierAnalysis;
