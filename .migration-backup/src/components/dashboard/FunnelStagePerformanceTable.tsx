import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { LeadsData } from '@/types/leads';
import { formatNumber, formatCurrency, formatPercentage } from '@/utils/formatters';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FunnelStagePerformanceTableProps {
  data: LeadsData[];
}

export const FunnelStagePerformanceTable: React.FC<FunnelStagePerformanceTableProps> = ({ data }) => {
  const stageData = useMemo(() => {
    if (!data.length) return [];

    const stageStats = data.reduce((acc, lead) => {
      const stage = lead.stage || 'Unknown';
      if (!acc[stage]) {
        acc[stage] = {
          stage,
          count: 0,
          converted: 0,
          lost: 0,
          totalLTV: 0,
          totalVisits: 0
        };
      }
      
      acc[stage].count += 1;
      if (lead.conversionStatus === 'Converted') acc[stage].converted += 1;
      if (lead.status === 'Lost') acc[stage].lost += 1;
      acc[stage].totalLTV += lead.ltv || 0;
      acc[stage].totalVisits += lead.visits || 0;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(stageStats)
      .map((stage: any) => ({
        ...stage,
        conversionRate: stage.count > 0 ? (stage.converted / stage.count) * 100 : 0,
        lossRate: stage.count > 0 ? (stage.lost / stage.count) * 100 : 0,
        avgLTV: stage.count > 0 ? stage.totalLTV / stage.count : 0,
        avgVisits: stage.count > 0 ? stage.totalVisits / stage.count : 0,
        percentage: (stage.count / data.length) * 100
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const totals = useMemo(() => {
    return {
      stage: 'TOTALS',
      count: data.length,
      converted: data.filter(l => l.conversionStatus === 'Converted').length,
      lost: data.filter(l => l.status === 'Lost').length,
      conversionRate: data.length > 0 ? (data.filter(l => l.conversionStatus === 'Converted').length / data.length) * 100 : 0,
      lossRate: data.length > 0 ? (data.filter(l => l.status === 'Lost').length / data.length) * 100 : 0,
      avgLTV: data.length > 0 ? data.reduce((sum, l) => sum + (l.ltv || 0), 0) / data.length : 0,
      avgVisits: data.length > 0 ? data.reduce((sum, l) => sum + (l.visits || 0), 0) / data.length : 0,
      percentage: 100
    };
  }, [data]);

  const columns = [
    {
      key: 'stage',
      header: 'Stage',
      render: (value: string) => (
        <div className="font-semibold text-slate-800 min-w-[150px] text-left">
          {value}
        </div>
      ),
      align: 'left' as const
    },
    {
      key: 'count',
      header: 'Lead Count',
      render: (value: number) => (
        <div className="text-center font-bold text-blue-600">
          {formatNumber(value)}
        </div>
      ),
      align: 'center' as const
    },
    {
      key: 'percentage',
      header: '% of Total',
      render: (value: number) => (
        <div className="text-center">
          <Badge variant="outline" className="w-16 justify-center text-slate-600 border-slate-300">
            {value.toFixed(1)}%
          </Badge>
        </div>
      ),
      align: 'center' as const
    },
    {
      key: 'conversionRate',
      header: 'Conversion Rate',
      render: (value: number) => {
        const isHigh = value >= 70;
        const isMedium = value >= 40;
        return (
          <div className="text-center">
            <Badge 
              className={cn(
                "w-20 justify-center font-bold",
                isHigh ? "bg-green-600 text-white hover:bg-green-700" 
                      : isMedium ? "bg-yellow-500 text-white hover:bg-yellow-600" 
                      : "bg-red-600 text-white hover:bg-red-700"
              )}
            >
              {value.toFixed(1)}%
            </Badge>
          </div>
        );
      },
      align: 'center' as const
    },
    {
      key: 'lossRate',
      header: 'Loss Rate',
      render: (value: number) => (
        <div className="text-center">
          <Badge 
            className={cn(
              "w-20 justify-center font-bold",
              value > 20 ? "bg-red-600 text-white hover:bg-red-700" : "bg-slate-500 text-white hover:bg-slate-600"
            )}
          >
            {value.toFixed(1)}%
          </Badge>
        </div>
      ),
      align: 'center' as const
    },
    {
      key: 'avgLTV',
      header: 'Avg LTV',
      render: (value: number) => (
        <div className="text-center font-medium text-green-600">
          ₹{value.toFixed(0)}
        </div>
      ),
      align: 'center' as const
    },
    {
      key: 'avgVisits',
      header: 'Avg Visits',
      render: (value: number) => (
        <div className="text-center font-medium">
          {value.toFixed(1)}
        </div>
      ),
      align: 'center' as const
    }
  ];

  return (
    <Card className="w-full bg-white border-2 border-purple-400 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-b border-slate-700">
        <CardTitle className="flex items-center gap-2 text-white">
          <Activity className="w-6 h-6 text-purple-400 animate-pulse" />
          Stage Performance Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[600px] overflow-auto">
          <ModernDataTable
            data={stageData}
            columns={columns}
            loading={false}
            stickyHeader={true}
            showFooter={true}
            footerData={totals}
            maxHeight="500px"
            className="rounded-none"
            headerGradient="from-slate-900 via-blue-950 to-slate-900"
          />
        </div>

        {/* Performance Insights */}
        <div className="p-6 bg-slate-50 border-t">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-slate-800">Stage Insights</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="font-semibold text-green-800">Best Performing Stage</div>
              <div className="text-green-600">
                {stageData.length > 0 
                  ? stageData.reduce((best, stage) => stage.conversionRate > best.conversionRate ? stage : best).stage
                  : 'N/A'
                }
              </div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="font-semibold text-yellow-800">Highest Volume</div>
              <div className="text-yellow-600">
                {stageData[0]?.stage || 'N/A'}
              </div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="font-semibold text-red-800">Needs Attention</div>
              <div className="text-red-600">
                {stageData.length > 0 
                  ? stageData.filter(s => s.lossRate > 30)[0]?.stage || 'None'
                  : 'N/A'
                }
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
