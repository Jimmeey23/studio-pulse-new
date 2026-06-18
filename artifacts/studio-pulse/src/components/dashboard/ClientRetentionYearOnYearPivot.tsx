import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import { NewClientData } from '@/types/dashboard';
import { parseDate } from '@/utils/dateUtils';
import { formatCurrency, formatNumber } from '@/utils/formatters';

type MetricKey =
  | 'trials'
  | 'newMembers'
  | 'converted'
  | 'retained'
  | 'retentionRate'
  | 'conversionRate'
  | 'avgLTV'
  | 'totalLTV';

const METRIC_LABELS: Record<MetricKey, string> = {
  trials: 'Trials',
  newMembers: 'New Members',
  converted: 'Converted',
  retained: 'Retained',
  retentionRate: 'Retention %',
  conversionRate: 'Conversion %',
  avgLTV: 'Avg LTV',
  totalLTV: 'Total LTV',
};

interface Props {
  data: NewClientData[];
}

export const ClientRetentionYearOnYearPivot: React.FC<Props> = ({ data }) => {
  const [metric, setMetric] = useState<MetricKey>('trials');
  const now = new Date();
  const currentYear = now.getFullYear();
  const previousYear = currentYear - 1;

  const months = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const monthsArr: { key: string; display: string; year: number; month: number }[] = [];
    
    // Generate months from Jan to current month, with 2024 and 2025 entries
    for (let monthNum = 1; monthNum <= 12; monthNum++) {
      // Only include months up to current month in current year
      if (monthNum > currentMonth && currentYear === now.getFullYear()) {
        continue;
      }
      
      const monthName = new Date(2024, monthNum - 1, 1).toLocaleDateString('en-US', { month: 'short' });
      
      // Add 2024 entry
      monthsArr.push({
        key: `2024-${String(monthNum).padStart(2, '0')}`,
        display: `${monthName} 2024`,
        year: 2024,
        month: monthNum
      });
      
      // Add 2025 entry if month has occurred
      if (monthNum <= currentMonth) {
        monthsArr.push({
          key: `${currentYear}-${String(monthNum).padStart(2, '0')}`,
          display: `${monthName} ${currentYear}`,
          year: currentYear,
          month: monthNum
        });
      }
    }
    return monthsArr;
  }, [currentYear]);

  const pivot = useMemo(() => {
    const initCell = () => ({ trials: 0, newMembers: 0, converted: 0, retained: 0, totalLTV: 0, clients: [] as NewClientData[] });
    const map: Record<string, any> = {};
    
    // Initialize all months
    months.forEach(m => { 
      map[m.key] = initCell();
    });
    
    // Populate data
    data.forEach(c => {
      const d = parseDate(c.firstVisitDate || '');
      if (!d) return;
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, '0')}`;
      
      const bucket = map[key];
      if (!bucket) return;
      
      bucket.trials += 1;
      if ((c.isNew || '').toLowerCase().includes('new')) bucket.newMembers += 1;
      if (c.conversionStatus === 'Converted') bucket.converted += 1;
      if (c.retentionStatus === 'Retained') bucket.retained += 1;
      bucket.totalLTV += c.ltv || 0;
      bucket.clients.push(c);
    });
    
    // Calculate derived metrics
    Object.values(map).forEach((bucket: any) => {
      bucket.avgLTV = bucket.trials > 0 ? bucket.totalLTV / bucket.trials : 0;
      bucket.conversionRate = bucket.newMembers > 0 ? (bucket.converted / bucket.newMembers) * 100 : 0;
      bucket.retentionRate = bucket.newMembers > 0 ? (bucket.retained / bucket.newMembers) * 100 : 0;
    });
    
    return map;
  }, [data, months]);

  const renderValue = (key: string) => {
    const b = pivot[key] || {};
    switch (metric) {
      case 'trials': return formatNumber(b.trials || 0);
      case 'newMembers': return formatNumber(b.newMembers || 0);
      case 'converted': return formatNumber(b.converted || 0);
      case 'retained': return formatNumber(b.retained || 0);
      case 'conversionRate': return `${(b.conversionRate || 0).toFixed(1)}%`;
      case 'retentionRate': return `${(b.retentionRate || 0).toFixed(1)}%`;
      case 'avgLTV': return formatCurrency(b.avgLTV || 0);
      case 'totalLTV': return formatCurrency(b.totalLTV || 0);
    }
  };

  return (
    <Card className="bg-white shadow-xl border-0 overflow-hidden">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-green-800 via-green-900 to-green-800 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Year-on-Year Pivot
            <Badge variant="secondary" className="bg-white/20 text-white">{previousYear} vs {currentYear}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {(Object.keys(METRIC_LABELS) as MetricKey[]).map(k => (
              <button
                key={k}
                onClick={() => setMetric(k)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${metric === k ? 'bg-gradient-to-r from-green-700 to-green-800 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                title={METRIC_LABELS[k]}
              >
                {METRIC_LABELS[k]}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full unified-table">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-green-800 via-green-900 to-green-800 text-white" style={{ maxHeight: '35px' }}>
                <th className="px-4 py-3 text-left sticky left-0 z-20 bg-green-900 font-bold text-xs uppercase tracking-wide border-r border-white/20" style={{ width: '300px', minWidth: '300px', maxHeight: '35px' }}>Metric</th>
                {months.map((m, index) => {
                  const prevMonth = index > 0 ? months[index - 1] : null;
                  const nextMonth = index < months.length - 1 ? months[index + 1] : null;
                  
                  const isFirstOfGroup = !prevMonth || prevMonth.month !== m.month;
                  const isLastOfGroup = !nextMonth || nextMonth.month !== m.month;
                  
                  return (
                    <th 
                      key={m.key} 
                      className={`px-3 py-3 text-center font-bold text-xs uppercase tracking-wider min-w-[90px] ${
                        isFirstOfGroup ? 'border-l-2 border-green-400' : ''
                      } ${
                        isLastOfGroup ? 'border-r-2 border-green-400' : ''
                      }`}
                      style={{ maxHeight: '35px' }}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold whitespace-nowrap leading-tight">{m.display.split(' ')[0]}</span>
                        <span className="text-green-300 text-xs leading-tight">{m.display.split(' ')[1]}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 hover:bg-slate-50" style={{ maxHeight: '35px' }}>
                <td className="px-4 py-2 text-sm font-semibold text-slate-800 sticky left-0 bg-white z-10 border-r" style={{ maxHeight: '35px' }}>{METRIC_LABELS[metric]}</td>
                {months.map((m, index) => {
                  const prevMonth = index > 0 ? months[index - 1] : null;
                  const nextMonth = index < months.length - 1 ? months[index + 1] : null;
                  
                  const isFirstOfGroup = !prevMonth || prevMonth.month !== m.month;
                  const isLastOfGroup = !nextMonth || nextMonth.month !== m.month;
                  
                  return (
                    <td 
                      key={m.key} 
                      className={`px-2 py-2 text-center text-sm font-mono text-slate-800 ${
                        isFirstOfGroup ? 'border-l-2 border-slate-300' : 'border-l'
                      } ${
                        isLastOfGroup ? 'border-r-2 border-slate-300' : ''
                      }`}
                      style={{ maxHeight: '35px' }}
                    >
                      {renderValue(m.key)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientRetentionYearOnYearPivot;
