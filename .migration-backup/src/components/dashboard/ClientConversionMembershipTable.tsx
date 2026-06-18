
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';
import { ModernDataTable } from '@/components/ui/ModernDataTable';

interface ClientConversionMembershipTableProps {
  data: NewClientData[];
}

export const ClientConversionMembershipTable: React.FC<ClientConversionMembershipTableProps> = ({ data }) => {
  const [sortField, setSortField] = React.useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const membershipData = React.useMemo(() => {
    const membershipStats = data.reduce((acc, client) => {
      const membership = client.membershipUsed || 'No Membership';
      if (!acc[membership]) {
        acc[membership] = {
          membershipType: membership,
          totalMembers: 0,
          newMembers: 0,
          converted: 0,
          retained: 0,
          totalLTV: 0,
          totalVisits: 0,
          conversionSpans: []
        };
      }
      
      acc[membership].totalMembers++;
      
      // Count new members - when isNew contains "new" (case-insensitive)
      if ((client.isNew || '').toLowerCase().includes('new')) {
        acc[membership].newMembers++;
      }
      
      // Strict equality per business rule
      if (client.conversionStatus === 'Converted') acc[membership].converted++;
      if (client.retentionStatus === 'Retained') acc[membership].retained++;
      acc[membership].totalLTV += client.ltv || 0;
      acc[membership].totalVisits += client.visitsPostTrial || 0;
      if (client.conversionSpan && client.conversionSpan > 0) {
        acc[membership].conversionSpans.push(client.conversionSpan);
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(membershipStats)
      .map((stat: any) => ({
        ...stat,
        conversionRate: stat.newMembers > 0 ? (stat.converted / stat.newMembers) * 100 : 0,
  // Standardize retention rate: retained / newMembers
  retentionRate: stat.newMembers > 0 ? (stat.retained / stat.newMembers) * 100 : 0,
        avgLTV: stat.totalMembers > 0 ? stat.totalLTV / stat.totalMembers : 0,
        avgVisits: stat.totalMembers > 0 ? stat.totalVisits / stat.totalMembers : 0,
        avgConversionSpan: stat.conversionSpans.length > 0 
          ? stat.conversionSpans.reduce((a: number, b: number) => a + b, 0) / stat.conversionSpans.length 
          : 0
      }))
      .filter((stat: any) => stat.totalMembers > 0)
      .sort((a: any, b: any) => b.totalMembers - a.totalMembers);
  }, [data]);

  const columns = [
    {
      key: 'membershipType' as const,
      header: 'Membership Type',
      className: 'font-medium text-xs min-w-[240px]',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm font-medium text-slate-700 truncate" title={value}>{value}</span>
      )
    },
    {
      key: 'totalMembers' as const,
      header: 'Trials',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => <span className="text-sm font-medium text-slate-700">{formatNumber(value)}</span>
    },
    {
      key: 'newMembers' as const,
      header: 'New Members',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => <span className="text-sm font-medium text-slate-700">{formatNumber(value)}</span>
    },
    {
      key: 'retained' as const,
      header: 'Retained',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => <span className="text-sm font-medium text-slate-700">{formatNumber(value)}</span>
    },
    {
      key: 'retentionRate' as const,
      header: 'Retention %',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => <span className="text-sm font-medium text-slate-700">{value.toFixed(1)}%</span>
    },
    {
      key: 'converted' as const,
      header: 'Converted',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => <span className="text-sm font-medium text-slate-700">{formatNumber(value)}</span>
    },
    {
      key: 'conversionRate' as const,
      header: 'Conversion %',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => <span className="text-sm font-medium text-slate-700">{value.toFixed(1)}%</span>
    },
    {
      key: 'avgLTV' as const,
      header: 'Avg LTV',
      align: 'right' as const,
      sortable: true,
      render: (value: number) => <span className="text-sm font-medium text-slate-700">{formatCurrency(value)}</span>
    },
    {
      key: 'totalLTV' as const,
      header: 'Total LTV',
      align: 'right' as const,
      sortable: true,
      render: (value: number) => <span className="text-sm font-medium text-slate-700">{formatCurrency(value)}</span>
    }
  ];

  // Calculate totals with consistent calculation
  const totals = {
    membershipType: 'TOTAL',
    totalMembers: membershipData.reduce((sum, row) => sum + row.totalMembers, 0),
    newMembers: membershipData.reduce((sum, row) => sum + row.newMembers, 0),
    converted: membershipData.reduce((sum, row) => sum + row.converted, 0),
    conversionRate: 0,
    retained: membershipData.reduce((sum, row) => sum + row.retained, 0),
    retentionRate: 0,
    totalLTV: membershipData.reduce((sum, row) => sum + row.totalLTV, 0),
    avgLTV: membershipData.reduce((sum, row) => sum + row.totalLTV, 0) / Math.max(membershipData.reduce((sum, row) => sum + row.totalMembers, 0), 1)
  };
  totals.conversionRate = totals.newMembers > 0 ? (totals.converted / totals.newMembers) * 100 : 0;
  totals.retentionRate = totals.newMembers > 0 ? (totals.retained / totals.newMembers) * 100 : 0;

  const displayedData = React.useMemo(() => {
    if (!sortField) return membershipData;
    const arr = [...membershipData];
    return arr.sort((a: any, b: any) => {
      const av = a[sortField as any];
      const bv = b[sortField as any];
      const dir = sortDirection === 'asc' ? 1 : -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });
  }, [membershipData, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDirection('desc'); }
  };

  return (
    <Card className="bg-white shadow-lg border-0">
  <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white">
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          Membership Type Performance Analysis
          <Badge variant="secondary" className="bg-white/20 text-white">
            {membershipData.length} Types
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ModernDataTable
          data={displayedData}
          columns={columns}
          headerGradient="from-slate-800 via-slate-900 to-slate-800"
          showFooter={true}
          footerData={totals}
          maxHeight="500px"
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
          tableId="Membership Type Performance Analysis"
        />
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
            <li>Top membership by trials: {(() => {
              if (membershipData.length === 0) return 'N/A';
              const top = [...membershipData].sort((a,b) => b.totalMembers - a.totalMembers)[0];
              return `${top.membershipType} (${formatNumber(top.totalMembers)})`;
            })()}</li>
            <li>Best conversion: {(() => {
              const withNew = membershipData.filter(r => r.newMembers > 0);
              if (withNew.length === 0) return 'N/A';
              const top = [...withNew].sort((a,b) => b.conversionRate - a.conversionRate)[0];
              return `${top.membershipType} at ${top.conversionRate.toFixed(1)}%`;
            })()}</li>
            <li>Best retention: {(() => {
              const withNew = membershipData.filter(r => r.newMembers > 0);
              if (withNew.length === 0) return 'N/A';
              const top = [...withNew].sort((a,b) => b.retentionRate - a.retentionRate)[0];
              return `${top.membershipType} at ${top.retentionRate.toFixed(1)}%`;
            })()}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
