import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { parseDate } from '@/utils/dateUtils';
import { isConvertedInCohort, isInNewClientCohort, isRetainedInCohort } from '@/utils/clientRetention';
import { NewClientData } from '@/types/dashboard';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { motion } from 'framer-motion';

interface ClientHostedClassesTableProps {
  data: NewClientData[];
  onRowClick?: (classData: any) => void;
}

export const ClientHostedClassesTable: React.FC<ClientHostedClassesTableProps> = ({ data, onRowClick }) => {
  const [sortField, setSortField] = React.useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const safeData = data ?? [];

  const hostedClassData = React.useMemo(() => {
    // Filter data to only include hosted classes based on class name
    const filteredData = safeData.filter(client => {
      if (!client || !client.firstVisitEntityName) return false;
      
      const className = client.firstVisitEntityName.toLowerCase();
      // Hosted classes contain any of: host, hosted, p57, birthday, rugby, lrs
      const tokens = ['host', 'hosted', 'p57', 'birthday', 'rugby', 'lrs'];
      return tokens.some(t => className.includes(t));
    });

    const classStats = filteredData.reduce((acc, client) => {
      // Safety checks for client data
      if (!client) return acc;
      
      const className = client.firstVisitEntityName || 'Unknown Class';
      
      // Parse date properly from "01/01/2020, 17:30:00" format
      const visitDate = parseDate(client.firstVisitDate || '');
      const month = visitDate
        ? visitDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : 'Unknown';
      
      const key = `${month}-${className}`;
      
      if (!acc[key]) {
        acc[key] = {
          month,
          className,
          totalMembers: 0,
          newMembers: 0,
          converted: 0,
          retained: 0,
          totalLTV: 0,
          conversionIntervals: [],
          clients: []
        };
      }
      
      acc[key].totalMembers++;
      acc[key].clients.push(client);
      
      // Count new members - when isNew contains "new" (case insensitive)
      if (isInNewClientCohort(client)) {
        acc[key].newMembers++;
      }
      
      // Count converted within the new-client cohort
      if (isConvertedInCohort(client)) {
        acc[key].converted++;
      }
      
      // Count retained within the converted new-client cohort
      if (isRetainedInCohort(client)) {
        acc[key].retained++;
      }
      
      acc[key].totalLTV += client.ltv || 0;
      
      // Calculate conversion interval with safety checks
      if (client.firstPurchase && client.firstVisitDate) {
        const firstVisitDate = parseDate(client.firstVisitDate || '');
        const firstPurchaseDate = parseDate(client.firstPurchase || '');

        if (firstVisitDate && firstPurchaseDate) {
          const intervalDays = Math.ceil((firstPurchaseDate.getTime() - firstVisitDate.getTime()) / (1000 * 60 * 60 * 24));
          if (intervalDays >= 0) {
            acc[key].conversionIntervals.push(intervalDays);
          }
        }
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(classStats)
      .map((stat: any) => ({
        ...stat,
        conversionRate: stat.newMembers > 0 ? (stat.converted / stat.newMembers) * 100 : 0,
  // Standardize retention rate: retained / newMembers
  retentionRate: stat.newMembers > 0 ? (stat.retained / stat.newMembers) * 100 : 0,
        avgLTV: stat.totalMembers > 0 ? stat.totalLTV / stat.totalMembers : 0,
        avgConversionInterval: stat.conversionIntervals.length > 0 
          ? stat.conversionIntervals.reduce((a: number, b: number) => a + b, 0) / stat.conversionIntervals.length 
          : 0
      }))
      .sort((a, b) => b.totalMembers - a.totalMembers);
  }, [safeData]);

  const columns = [
    {
      key: 'month',
      header: 'Month',
      className: 'font-semibold min-w-[120px]',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">{value}</span>
      )
    },
    {
      key: 'className',
      header: 'Class Name',
      className: 'font-medium min-w-[360px] max-w-none h-auto whitespace-normal',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm font-medium text-slate-700 whitespace-normal break-words" title={value}>{value}</span>
      )
    },
    {
      key: 'totalMembers',
      header: 'Trials',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => (
        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">{formatNumber(value)}</span>
      )
    },
    {
      key: 'newMembers',
      header: 'New Members',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => (
        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">{formatNumber(value)}</span>
      )
    },
    {
      key: 'retained',
      header: 'Retained',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => (
        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">{formatNumber(value)}</span>
      )
    },
    {
      key: 'retentionRate',
      header: 'Retention %',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => {
        const safeValue = value ?? 0;
        return <span className="text-sm font-medium text-slate-700">{safeValue.toFixed(1)}%</span>;
      }
    },
    {
      key: 'converted',
      header: 'Converted',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => (
        <span className="text-sm font-medium text-slate-700">{formatNumber(value)}</span>
      )
    },
    {
      key: 'conversionRate',
      header: 'Conversion %',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => {
        const safeValue = value ?? 0;
        return <span className="text-sm font-medium text-slate-700">{safeValue.toFixed(1)}%</span>;
      }
    },
    {
      key: 'avgLTV',
      header: 'Avg LTV',
      align: 'right' as const,
      sortable: true,
      render: (value: number) => (
        <span className="text-sm font-medium text-slate-700">{formatCurrency(value)}</span>
      )
    },
    {
      key: 'avgConversionInterval',
      header: 'Avg Conv Days',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => {
        const safeValue = value ?? 0;
        return <span className="text-sm font-medium text-slate-700">{Math.round(safeValue)} days</span>;
      }
    }
  ];

  // Calculate totals
  const totals = {
    month: 'TOTAL',
    className: `${hostedClassData.length} Classes`,
    totalMembers: hostedClassData.reduce((sum, row) => sum + row.totalMembers, 0),
    newMembers: hostedClassData.reduce((sum, row) => sum + row.newMembers, 0),
    converted: hostedClassData.reduce((sum, row) => sum + row.converted, 0),
    conversionRate: 0,
    retained: hostedClassData.reduce((sum, row) => sum + row.retained, 0),
    retentionRate: 0,
    avgLTV: hostedClassData.reduce((sum, row) => sum + row.totalLTV, 0) / Math.max(hostedClassData.reduce((sum, row) => sum + row.totalMembers, 0), 1),
    avgConversionInterval: hostedClassData.reduce((sum, row) => sum + (row.avgConversionInterval * row.totalMembers), 0) / Math.max(hostedClassData.reduce((sum, row) => sum + row.totalMembers, 0), 1)
  };
  totals.conversionRate = totals.newMembers > 0 ? (totals.converted / totals.newMembers) * 100 : 0;
  totals.retentionRate = totals.newMembers > 0 ? (totals.retained / totals.newMembers) * 100 : 0;
  const allHostedClients = hostedClassData.flatMap(row => row.clients || []);

  // Sorting logic
  const displayedData = React.useMemo(() => {
    const arr = [...hostedClassData];
    if (!sortField) return arr;
    return arr.sort((a: any, b: any) => {
      const av = a[sortField];
      const bv = b[sortField];
      const dir = sortDirection === 'asc' ? 1 : -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });
  }, [hostedClassData, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const aiNotes = React.useMemo(() => {
    if (!hostedClassData || hostedClassData.length === 0) return [] as string[];
    const topTrials = [...hostedClassData].sort((a,b) => b.totalMembers - a.totalMembers)[0];
    const bestConv = [...hostedClassData.filter(r => r.newMembers > 0)].sort((a,b) => b.conversionRate - a.conversionRate)[0];
    const bestRet = [...hostedClassData.filter(r => r.newMembers > 0)].sort((a,b) => b.retentionRate - a.retentionRate)[0];
    const notes: string[] = [];
    if (topTrials) notes.push(`${topTrials.className} (${topTrials.month}) drove the most trials (${formatNumber(topTrials.totalMembers)}).`);
    if (bestConv) notes.push(`${bestConv.className} (${bestConv.month}) has the best conversion ${bestConv.conversionRate.toFixed(1)}% (${bestConv.converted}/${bestConv.newMembers}).`);
    if (bestRet) notes.push(`${bestRet.className} (${bestRet.month}) leads retention ${bestRet.retentionRate.toFixed(1)}% (${bestRet.retained}/${bestRet.newMembers}).`);
    return notes;
  }, [hostedClassData]);

  if (safeData.length === 0) {
    return (
      <Card className="bg-white shadow-xl border-0 overflow-hidden">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white">
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            Hosted Classes Performance Analysis
            <Badge variant="secondary" className="bg-white/20 text-white">
              0 Classes
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center">No class data available for analysis.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-white shadow-xl border-0 overflow-hidden hover:shadow-2xl transition-all duration-300">
  <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white">
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            Hosted Classes Performance Analysis
            <Badge variant="secondary" className="bg-white/20 text-white">
              {hostedClassData.length} Classes
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ModernDataTable
            data={displayedData}
            columns={columns}
            headerGradient="from-slate-950 via-slate-900 to-slate-800"
            showFooter={true}
            footerData={totals}
            footerRowClassName="border-t-4 border-indigo-950 bg-indigo-950 text-slate-50 hover:bg-indigo-900"
            footerStickyCellClassName="bg-indigo-950 border-indigo-900"
            footerCellClassName="bg-indigo-950 border-indigo-900 text-slate-50"
            footerSectionStyle={{ ['--unified-totals-bg' as string]: '#3730a3', ['--unified-totals-text' as string]: '#ffffff', ['--unified-totals-border' as string]: 'rgba(255, 255, 255, 0.16)', backgroundColor: '#3730a3', color: '#ffffff', borderTopColor: '#4338ca' }}
            footerRowStyle={{ ['--unified-totals-bg' as string]: '#3730a3', ['--unified-totals-text' as string]: '#ffffff', ['--unified-totals-border' as string]: 'rgba(255, 255, 255, 0.16)', backgroundColor: '#3730a3', color: '#ffffff', borderTopColor: '#4338ca' }}
            footerStickyCellStyle={{ ['--unified-totals-bg' as string]: '#3730a3', ['--unified-totals-text' as string]: '#ffffff', ['--unified-totals-border' as string]: 'rgba(255, 255, 255, 0.16)', backgroundColor: '#3730a3', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.16)', borderTopColor: '#4338ca' }}
            footerCellStyle={{ ['--unified-totals-bg' as string]: '#3730a3', ['--unified-totals-text' as string]: '#ffffff', ['--unified-totals-border' as string]: 'rgba(255, 255, 255, 0.16)', backgroundColor: '#3730a3', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.16)', borderTopColor: '#4338ca' }}
            maxHeight="600px"
            onRowClick={onRowClick}
            onSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
            onFooterClick={() => onRowClick?.({
              month: 'All Months',
              className: 'All Hosted Classes',
              clients: allHostedClients,
              ...totals
            })}
            tableId="Hosted Classes Performance Analysis"
            />
          <div className="border-t border-slate-200 p-4 bg-slate-50">
            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
              {aiNotes.map((insight, index) => (
                <li key={index}>{insight}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};