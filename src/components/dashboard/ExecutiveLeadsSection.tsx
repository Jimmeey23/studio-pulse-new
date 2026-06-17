import React, { useMemo, useState } from 'react';
import { TrendingUp, Users, CheckCircle, Zap } from 'lucide-react';
import { ExecutiveSectionCard } from './ExecutiveSectionCard';
import { ExecutiveDrillDownModal } from './ExecutiveDrillDownModal';
import { StandardizedMetricCard } from './StandardizedMetricCard';
import { StandardizedTable } from './StandardizedTable';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { parseDate } from '@/utils/dateUtils';
import { countConvertedLeads, calculateConversionRate, isLeadConverted } from '@/utils/leadConversions';

interface ExecutiveLeadsSectionProps {
  onMetricClick?: (metricData: any) => void;
}

export const ExecutiveLeadsSection: React.FC<ExecutiveLeadsSectionProps> = ({
  onMetricClick,
}) => {
  const { data: leadsData, loading: leadsLoading } = useLeadsData();
  const { filters } = useGlobalFilters();
  const [drillDownOpen, setDrillDownOpen] = useState(false);

  // Filter leads by date range and location
  const filteredLeads = useMemo(() => {
    if (!leadsData) return [];

    return leadsData.filter(lead => {
      // Apply date range filter
      if (filters.dateRange?.start && filters.dateRange?.end) {
        const leadDate = parseDate(lead.createdAt);
        const filterStart = new Date(filters.dateRange.start);
        const filterEnd = new Date(filters.dateRange.end);
        filterEnd.setHours(23, 59, 59, 999);

        if (!leadDate || leadDate < filterStart || leadDate > filterEnd) {
          return false;
        }
      }

      // Apply location filter
      if (filters.location && filters.location.length > 0) {
        const locations = Array.isArray(filters.location) ? filters.location : [filters.location];
        if (!locations.includes('all') && !locations.some(loc => lead.center?.includes(loc))) {
          return false;
        }
      }

      return true;
    });
  }, [leadsData, filters.dateRange, filters.location]);

  // Transform leads data into source-based summary
  const leadSummary = useMemo(() => {
    if (!filteredLeads || filteredLeads.length === 0) return null;

    const sources = new Map<string, { count: number; converted: number; contacted: number }>();

    filteredLeads.forEach((lead: any) => {
      const source = lead.source || 'Direct';
      if (!sources.has(source)) {
        sources.set(source, { count: 0, converted: 0, contacted: 0 });
      }

      const data = sources.get(source)!;
      data.count += 1;
      if (isLeadConverted(lead)) {
        data.converted += 1;
      }
      if (lead.stage === 'qualified' || lead.stage === 'Qualified') {
        data.contacted += 1;
      }
    });

    return Array.from(sources.entries()).map(([source, data]) => ({
      source,
      ...data,
      conversionRate: (data.converted / data.count) * 100,
      contactRate: (data.contacted / data.count) * 100,
    }));
  }, [filteredLeads]);

  if (leadsLoading) {
    return (
      <ExecutiveSectionCard
        title="Lead Conversion & Funnel"
        icon={TrendingUp}
        borderColor="pink"
        description="Conversion rates, lead sources, and funnel analytics"
      >
        <div className="flex items-center justify-center py-12">
          <BrandSpinner />
        </div>
      </ExecutiveSectionCard>
    );
  }

  return (
    <>
      <ExecutiveSectionCard
        title="Lead Conversion & Funnel"
        icon={TrendingUp}
        borderColor="pink"
        description="Conversion rates, lead sources, and funnel analytics"
        contentClassName="space-y-6"
      >
        {/* Metric Cards */}
        <div
          className="cursor-pointer"
          onClick={() => setDrillDownOpen(true)}
        >
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Key Metrics</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StandardizedMetricCard
              title="Total Leads"
              value={filteredLeads.length}
              icon={Users}
              color="pink"
            />
            <StandardizedMetricCard
              title="Converted"
              value={filteredLeads.filter(l => l.convertedToCustomerAt).length}
              icon={CheckCircle}
              color="emerald"
              change={filteredLeads.length > 0 ? (filteredLeads.filter(l => l.convertedToCustomerAt).length / filteredLeads.length) * 100 : 0}
            />
            <StandardizedMetricCard
              title="Qualified"
              value={filteredLeads.filter(l => l.stage === 'qualified' || l.stage === 'Qualified').length}
              icon={TrendingUp}
              color="blue"
              change={filteredLeads.length > 0 ? (filteredLeads.filter(l => l.stage === 'qualified' || l.stage === 'Qualified').length / filteredLeads.length) * 100 : 0}
            />
            <StandardizedMetricCard
              title="Conversion Rate"
              value={filteredLeads.length > 0 ? calculateConversionRate(filteredLeads).toFixed(1) : '0'}
              subtitle="%"
              icon={Zap}
              color="amber"
            />
          </div>
        </div>

        {/* Lead Sources Table */}
        {leadSummary && leadSummary.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 mb-4">Leads by Source</h4>
            <StandardizedTable
              data={leadSummary}
              columns={[
                { key: 'source', header: 'Source', align: 'left' },
                { key: 'count', header: 'Total', align: 'center', render: (val) => formatNumber(val) },
                { key: 'contacted', header: 'Contacted', align: 'center', render: (val) => formatNumber(val) },
                { key: 'converted', header: 'Converted', align: 'center', render: (val) => formatNumber(val) },
                { key: 'conversionRate', header: 'Conv. Rate', align: 'center', render: (val) => formatPercentage(val) },
              ]}
              headerColor="slate"
              footerData={{
                source: 'TOTAL',
                count: filteredLeads?.length || 0,
                contacted: leadSummary.reduce((sum, s) => sum + s.contacted, 0),
                converted: leadSummary.reduce((sum, s) => sum + s.converted, 0),
                conversionRate: filteredLeads && filteredLeads.length > 0
                  ? (leadSummary.reduce((sum, s) => sum + s.converted, 0) / filteredLeads.length) * 100
                  : 0,
              }}
              striped
            />
          </div>
        )}
      </ExecutiveSectionCard>

      {/* Drill-Down Modal */}
      <ExecutiveDrillDownModal
        open={drillDownOpen}
        onOpenChange={setDrillDownOpen}
        title="Lead Conversion & Funnel Analysis"
        metric="Total Leads"
        currentValue={formatNumber(filteredLeads?.length || 0)}
        description="Detailed breakdown of lead generation, conversion, and funnel metrics"
        borderColor="pink"
        breakdownData={
          leadSummary
            ?.slice(0, 5)
            .map((source) => ({
              label: source.source,
              value: formatNumber(source.converted),
              percentage: (source.converted / (leadSummary?.reduce((sum) => sum + 1, 0) || 1)) * 100,
              color: 'bg-pink-500',
            })) || []
        }
        analyticsText="Lead metrics track generation sources, conversion rates, and funnel efficiency to optimize marketing ROI and sales pipeline."
        rawData={
          filteredLeads?.slice(0, 20).map((lead: any, idx: number) => ({
            source: lead.source || 'Direct',
            name: lead.name || lead.leadName || `Lead ${idx}`,
            status: lead.status || lead.conversionStatus || 'Pending',
            contacted: lead.contacted ? 'Yes' : 'No',
          })) || []
        }
        rawDataColumns={[
          { key: 'source', label: 'Source', format: 'text' },
          { key: 'name', label: 'Lead', format: 'text' },
          { key: 'status', label: 'Status', format: 'text' },
          { key: 'contacted', label: 'Contacted', format: 'text' },
        ]}
      />
    </>
  );
};

export default ExecutiveLeadsSection;
