import React from 'react';
import { ExecutiveSummarySection } from '@/components/dashboard/ExecutiveSummarySection';
import { Footer } from '@/components/ui/footer';
import { GlobalFiltersProvider } from '@/contexts/GlobalFiltersContext';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { AdvancedExportButton } from '@/components/ui/AdvancedExportButton';
import { FileText, Download, Home, Play, Pause } from 'lucide-react';
import { useSalesData } from '@/hooks/useSalesData';
import { useSessionsData } from '@/hooks/useSessionsData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useNewClientData } from '@/hooks/useNewClientData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useDiscountAnalysis } from '@/hooks/useDiscountAnalysis';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { useDynamicHeroMetrics } from '@/hooks/useDynamicHeroMetrics';
import InfoPopover from '@/components/ui/InfoSidebar';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';

// Inner component that has access to GlobalFilters context
const ExecutiveSummaryContent = () => {
  const { data: salesData = [], loading: salesLoading } = useSalesData();
  const { data: sessionsData = [], loading: sessionsLoading } = useSessionsData();
  const { data: payrollData = [], isLoading: payrollLoading } = usePayrollData();
  const { data: newClientData = [], loading: clientsLoading } = useNewClientData();
  const { data: leadsData = [], loading: leadsLoading } = useLeadsData();
  const { data: discountData = [] } = useDiscountAnalysis();
  const { setLoading } = useGlobalLoading();
  const exportRef = React.useRef<{ open: () => void }>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Track loading state
  React.useEffect(() => {
    const isLoading = salesLoading || sessionsLoading || payrollLoading || clientsLoading || leadsLoading;
    setLoading(isLoading, 'Loading executive dashboard data...');
  }, [salesLoading, sessionsLoading, payrollLoading, clientsLoading, leadsLoading, setLoading]);

  // Get dynamic hero metrics that update with location filter
  const heroMetrics = useDynamicHeroMetrics({
    salesData,
    sessionsData,
    leadsData,
    newClientsData: newClientData
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20">
      <DashboardMotionHero
        title="Executive Overview"
        subtitle="A concise, high-level view of revenue, attendance, and growth trends across all locations."
        metrics={heroMetrics}
        extra={
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setIsPlaying(p => !p)}
              className="rounded-xl border border-white/30 bg-transparent text-white hover:border-white/50 px-4 py-2 text-sm font-semibold"
              variant="ghost"
            >
              {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button 
              onClick={() => exportRef.current?.open()}
              className="rounded-xl border border-white/30 bg-transparent text-white hover:border-white/50 px-4 py-2 text-sm font-semibold"
              variant="ghost"
            >
              <Download className="w-4 h-4 mr-2" />
              Export All Data
            </Button>
            <Button
              onClick={() => document.getElementById('exec-pdf-trigger')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}
              className="rounded-xl border border-white/30 bg-transparent text-white hover:border-white/50 px-4 py-2 text-sm font-semibold"
              variant="ghost"
            >
              <FileText className="w-4 h-4 mr-2" />
              Download PDF Reports
            </Button>
            <Button 
              onClick={() => window.location.href = '/'}
              className="rounded-xl border border-white/30 bg-transparent text-white hover:border-white/50 px-4 py-2 text-sm font-semibold"
              variant="ghost"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Main Dashboard
            </Button>
          </div>
        }
      />

      {/* InfoPopover triggers for sales overview - explicitly load kwality and supreme popovers */}
      <div className="flex justify-end max-w-5xl mx-auto mt-4 space-x-2">
        <InfoPopover context="sales-overview" locationId="kwality" iframeSrc="/popovers/sales-overview/kwality.html" startAsSidebar={true} />
        <InfoPopover context="sales-overview" locationId="supreme" iframeSrc="/popovers/sales-overview/supreme.html" startAsSidebar={true} />
      </div>
      
      <div className="container mx-auto px-6 py-8">
        <ExecutiveSummarySection />
      </div>

      {/* Hidden export dialog wired for programmatic open */}
      <div className="hidden">
        <AdvancedExportButton 
          renderTrigger={false}
          openRef={exportRef as any}
          salesData={salesData}
          sessionsData={sessionsData as any}
          newClientData={newClientData}
          payrollData={payrollData}
          lateCancellationsData={[]}
          discountData={discountData as any}
          defaultFileName="executive-dashboard-export"
        />
      </div>
      <Footer />
    </div>
  );
};

// Outer wrapper component
const ExecutiveSummary = () => {
  return (
    <GlobalFiltersProvider>
      <ExecutiveSummaryContent />
    </GlobalFiltersProvider>
  );
};

export default ExecutiveSummary;
