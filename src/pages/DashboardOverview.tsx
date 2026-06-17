import React from 'react';
import { Footer } from '@/components/ui/footer';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExecutiveFilterSection } from '@/components/dashboard/ExecutiveFilterSection';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { useSalesData } from '@/hooks/useSalesData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useNewClientData } from '@/hooks/useNewClientData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useLateCancellationsData } from '@/hooks/useLateCancellationsData';
import { useExpirationsData } from '@/hooks/useExpirationsData';
import { useCheckinsData } from '@/hooks/useCheckinsData';
import { cn } from '@/lib/utils';
import { getDashboardDefaultDateRange } from '@/utils/dateUtils';
import { filterByOverviewFilters, getOverviewLocationLabel, OVERVIEW_LOCATION_OPTIONS } from '@/components/dashboard/overview/filtering';
import { OverviewPDFExportButton } from '@/components/dashboard/overview/OverviewPDFExportButton';
import { overviewModules, overviewModulesById } from '@/components/dashboard/overview/registry';
import type { OverviewDataBundle, OverviewFiltersShape, OverviewModuleId } from '@/components/dashboard/overview/types';

const OVERVIEW_DEFAULT_FILTERS: OverviewFiltersShape = {
  dateRange: getDashboardDefaultDateRange(),
  location: ['Kwality House'],
};

const DashboardOverview = () => {
  const [activeModuleId, setActiveModuleId] = React.useState<OverviewModuleId>('sales-analytics');
  const { filters, updateFilters } = useGlobalFilters();
  const { setLoading } = useGlobalLoading();

  const { data: salesData = [], loading: salesLoading } = useSalesData();
  const { data: leadsData = [], loading: leadsLoading } = useLeadsData();
  const { data: newClientsData = [], loading: newClientsLoading } = useNewClientData();
  const { data: payrollData = [], isLoading: payrollLoading } = usePayrollData();
  const { data: sessionsData = [], loading: sessionsLoading } = useSessionsData();
  const { data: lateCancellationsData = [], loading: lateCancellationsLoading } = useLateCancellationsData();
  const { data: expirationsData = [], loading: expirationsLoading } = useExpirationsData();
  const { data: checkinsData = [], loading: checkinsLoading } = useCheckinsData();

  const isLoading =
    salesLoading ||
    leadsLoading ||
    newClientsLoading ||
    payrollLoading ||
    sessionsLoading ||
    lateCancellationsLoading ||
    expirationsLoading ||
    checkinsLoading;

  React.useEffect(() => {
    setLoading(isLoading, 'Loading dashboard overview module...');
  }, [isLoading, setLoading]);

  const overviewData = React.useMemo<OverviewDataBundle>(
    () => ({
      sales: salesData,
      leads: leadsData,
      newClients: newClientsData,
      payroll: payrollData,
      sessions: sessionsData,
      lateCancellations: lateCancellationsData,
      expirations: expirationsData,
      checkins: checkinsData,
      filters: {
        dateRange: filters.dateRange,
        location: filters.location,
      },
    }),
    [
      salesData,
      leadsData,
      newClientsData,
      payrollData,
      sessionsData,
      lateCancellationsData,
      expirationsData,
      checkinsData,
      filters,
    ]
  );

  const filteredData = React.useMemo<OverviewDataBundle>(
    () => ({
      sales: filterByOverviewFilters(salesData, filters, {
        getDate: (item) => item.paymentDate,
        getLocation: (item) => item.calculatedLocation,
      }),
      leads: filterByOverviewFilters(leadsData, filters, {
        getDate: (item) => item.createdAt || item.period,
        getLocation: (item) => item.center,
      }),
      newClients: filterByOverviewFilters(newClientsData, filters, {
        getDate: (item) => item.firstVisitDate || item.monthYear,
        getLocation: (item) => item.homeLocation || item.firstVisitLocation,
      }),
      payroll: filterByOverviewFilters(payrollData, filters, {
        getDate: (item) => item.monthYear,
        getLocation: (item) => item.location,
      }),
      sessions: filterByOverviewFilters(sessionsData, filters, {
        getDate: (item) => item.date,
        getLocation: (item) => item.location,
      }),
      lateCancellations: filterByOverviewFilters(lateCancellationsData, filters, {
        getDate: (item) => item.dateIST,
        getLocation: (item) => item.location,
      }),
      expirations: filterByOverviewFilters(expirationsData, filters, {
        getDate: (item) => item.endDate || item.orderAt,
        getLocation: (item) => item.homeLocation,
      }),
      checkins: filterByOverviewFilters(checkinsData, filters, {
        getDate: (item) => item.dateIST,
        getLocation: (item) => item.location,
      }),
      filters: {
        dateRange: filters.dateRange,
        location: filters.location,
      },
    }),
    [
      salesData,
      leadsData,
      newClientsData,
      payrollData,
      sessionsData,
      lateCancellationsData,
      expirationsData,
      checkinsData,
      filters,
    ]
  );

  const handleModuleSelect = React.useCallback(
    (moduleId: OverviewModuleId) => {
      if (moduleId === activeModuleId) return;
      setActiveModuleId(moduleId);
    },
    [activeModuleId]
  );

  const handleClearFilters = React.useCallback(() => {
    updateFilters(OVERVIEW_DEFAULT_FILTERS);
  }, [updateFilters]);

  const activeModule = overviewModulesById[activeModuleId];
  const ActiveAdapter = activeModule.adapter;
  const dateLabel = filters.dateRange.start || filters.dateRange.end ? `${filters.dateRange.start || 'Start'} to ${filters.dateRange.end || 'Now'}` : 'All dates';
  const locationLabel = getOverviewLocationLabel(filters.location);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <DashboardMotionHero
        title="Dashboard Overview"
        subtitle="Switch across the core analytics modules while keeping one global filter state, one visual structure, and one comparison canvas."
        metrics={[
          { label: 'Source Modules', value: String(overviewModules.length) },
          { label: 'Active View', value: activeModule.label },
          { label: 'Date Window', value: dateLabel },
          { label: 'Location', value: locationLabel },
        ]}
      />

      <div className="container mx-auto px-6 py-8">
        <main className="space-y-8">
          <ExecutiveFilterSection
            availableLocations={OVERVIEW_LOCATION_OPTIONS}
            showExportButton={false}
            headerActions={<OverviewPDFExportButton data={overviewData} filters={overviewData.filters} />}
            onClearFilters={handleClearFilters}
          />

          <Card className="border border-slate-200 bg-white/95 shadow-sm">
            <CardContent className="p-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                {overviewModules.map((module) => {
                  const Icon = module.icon;
                  const isActive = module.id === activeModuleId;

                  return (
                    <Button
                      key={module.id}
                      type="button"
                      variant="ghost"
                      onClick={() => handleModuleSelect(module.id)}
                      className={cn(
                        'h-auto flex-col items-start gap-2 rounded-2xl border px-4 py-4 text-left transition-all duration-200',
                        isActive
                          ? 'border-slate-900 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <div className="flex w-full items-center gap-3">
                        <div className={cn('rounded-xl p-2', isActive ? 'bg-white/15' : 'bg-slate-100')}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{module.label}</p>
                          <p className={cn('text-xs', isActive ? 'text-slate-300' : 'text-slate-500')}>{module.description}</p>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <React.Suspense
            fallback={
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardContent className="flex min-h-[420px] items-center justify-center p-8 text-sm text-slate-500">
                  Loading overview module...
                </CardContent>
              </Card>
            }
          >
            <ActiveAdapter data={filteredData} />
          </React.Suspense>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default DashboardOverview;
