import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { getClassFormat } from '@/utils/classTypeUtils';
import { ChevronDown, BarChart3, TrendingUp, Users, Clock, Percent, Activity, DollarSign, AlertTriangle } from 'lucide-react';

type Canonical = 'powercycle' | 'barre' | 'strength' | 'other';
type MetricType = 'sessions' | 'checkins' | 'revenue' | 'fillRate' | 'lateCancelled' | 'classAvg' | 'revPerSeat' | 'cancellationRate';
type DimensionType = 'format' | 'className' | 'classType' | 'trainer' | 'location' | 'dayOfWeek' | 'time';

const toCanonical = (s?: string) => {
  const t = (s || '').toLowerCase();
  if (/power|cycle/.test(t)) return 'powercycle' as const;
  if (/barre/.test(t)) return 'barre' as const;
  if (/strength/.test(t)) return 'strength' as const;
  return 'other' as const;
};

interface ClassFormatsMoMTableProps {
  sessions: SessionData[];
  checkins: any[];
  onDrillDown?: (data: { format: string; month: string; metric: string; value: number }) => void;
}

export const ClassFormatsMoMTable: React.FC<ClassFormatsMoMTableProps> = ({ sessions, checkins, onDrillDown }) => {
  const [metric, setMetric] = useState<MetricType>('sessions');
  const [dimension, setDimension] = useState<DimensionType>('format');
  const [showDimensionMenu, setShowDimensionMenu] = useState(false);

  // Use data as-is since page already applies location and date range filters
  // MoM table will use all months available in filtered data (ignores global date range, respects location)
  const filteredSessions = sessions;
  const filteredCheckins = checkins;

  const handleCellClick = (dimension: string, month: string, value: number) => {
    if (onDrillDown) {
      onDrillDown({
        format: dimension,
        month,
        metric,
        value
      });
    }
  };

  const toYYYYMM = (input?: string): string | null => {
    if (!input) return null;
    const s = String(input);
    if (s.includes('/')) {
      const parts = s.split('/');
      if (parts.length >= 3) {
        const dd = parseInt(parts[0]);
        const mm = parseInt(parts[1]);
        const yyyy = parseInt(parts[2]);
        if (!isNaN(yyyy) && !isNaN(mm) && !isNaN(dd)) {
          const d = new Date(yyyy, mm - 1, dd);
          if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            return `${y}-${m}`;
          }
        }
      }
    } else {
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
      }
      if (/^\d{4}-\d{2}/.test(s)) return s.slice(0,7);
    }
    return null;
  };

  const months = useMemo(() => {
    const set = new Set<string>();
    filteredSessions.forEach(s => {
      const ym = toYYYYMM(s.date);
      if (ym) set.add(ym);
    });
    filteredCheckins.forEach(c => {
      const d = c.dateIST || c['dateIST'] || c['Date (IST)'];
      const ym = toYYYYMM(typeof d === 'string' ? d : undefined);
      if (ym) set.add(ym);
    });
    const arr = Array.from(set);
    arr.sort();
    return arr.slice(-6);
  }, [filteredSessions, filteredCheckins]);

  const isTrueish = (val: any): boolean => {
    const s = String(val ?? '').trim().toLowerCase();
    return s === 'true' || s === 'yes' || s === '1';
  };

  // Get dimension values based on selected dimension
  const dimensionValues = useMemo(() => {
    const set = new Set<string>();
    filteredSessions.forEach(s => {
      let val: string | undefined;
      switch (dimension) {
        case 'format': val = getClassFormat(s.cleanedClass || s.classType); break;
        case 'className': val = s.cleanedClass || s.classType; break;
        case 'classType': val = s.classType; break;
        case 'trainer': val = s.trainerName; break;
        case 'location': val = s.location; break;
        case 'dayOfWeek': val = s.dayOfWeek; break;
        case 'time': val = s.time; break;
      }
      if (val) set.add(val);
    });
    return Array.from(set).sort();
  }, [filteredSessions, dimension]);

  // Build MoM matrix based on dimension
  const byMonth = useMemo(() => {
    const result: Record<string, Record<string, { sessions: number; checkins: number; capacity: number; revenue: number; late: number }>> = {};
    
    months.forEach(m => {
      result[m] = {};
      dimensionValues.forEach(val => {
        result[m][val] = { sessions: 0, checkins: 0, capacity: 0, revenue: 0, late: 0 };
      });
    });

    const sessionAgg: Record<string, Record<string, { checkins: number; revenue: number; late: number }>> = {};
    months.forEach(m => {
      sessionAgg[m] = {};
      dimensionValues.forEach(val => {
        sessionAgg[m][val] = { checkins: 0, revenue: 0, late: 0 };
      });
    });

    filteredSessions.forEach(s => {
      const m = toYYYYMM(s.date || undefined);
      if (!m || !result[m]) return;
      
      let dimVal: string | undefined;
      switch (dimension) {
        case 'format': dimVal = getClassFormat(s.cleanedClass || s.classType); break;
        case 'className': dimVal = s.cleanedClass || s.classType; break;
        case 'classType': dimVal = s.classType; break;
        case 'trainer': dimVal = s.trainerName; break;
        case 'location': dimVal = s.location; break;
        case 'dayOfWeek': dimVal = s.dayOfWeek; break;
        case 'time': dimVal = s.time; break;
      }
      
      if (!dimVal || !result[m][dimVal]) return;
      result[m][dimVal].sessions += 1;
      result[m][dimVal].capacity += s.capacity || 0;
      sessionAgg[m][dimVal].checkins += s.checkedInCount || 0;
      sessionAgg[m][dimVal].revenue += s.totalPaid || s.revenue || 0;
      sessionAgg[m][dimVal].late += s.lateCancelledCount || 0;
    });

    filteredCheckins.forEach(c => {
      const d = c.dateIST || c['dateIST'] || c['Date (IST)'];
      const m = typeof d === 'string' ? toYYYYMM(d) : null;
      if (!m || !result[m]) return;
      
      const checkedIn = isTrueish(c.checkedIn ?? c['Checked In'] ?? c['Checked in']);
      const late = isTrueish(c.isLateCancelled ?? c['Is Late Cancelled']);
      const paid = Number(c.paidAmount ?? c['Paid'] ?? 0) || 0;

      let dimVal: string | undefined;
      switch (dimension) {
        case 'format': dimVal = getClassFormat(c.cleanedClass || c['Cleaned Class']); break;
        case 'className': dimVal = c.cleanedClass || c['Cleaned Class']; break;
        case 'classType': dimVal = c['Class Type']; break;
        case 'trainer': dimVal = c['Trainer']; break;
        case 'location': dimVal = c['Location']; break;
        case 'dayOfWeek': dimVal = c['Day of Week']; break;
        case 'time': dimVal = c['Time']; break;
      }

      if (!dimVal || !result[m][dimVal]) return;
      if (checkedIn) result[m][dimVal].checkins += 1;
      if (late) result[m][dimVal].late += 1;
      result[m][dimVal].revenue += paid;
    });

    // Apply fallback
    months.forEach(m => {
      dimensionValues.forEach(val => {
        if (result[m][val].checkins === 0 && sessionAgg[m][val].checkins > 0) {
          result[m][val].checkins = sessionAgg[m][val].checkins;
        }
        if (result[m][val].revenue === 0 && sessionAgg[m][val].revenue > 0) {
          result[m][val].revenue = sessionAgg[m][val].revenue;
        }
        if (result[m][val].late === 0 && sessionAgg[m][val].late > 0) {
          result[m][val].late = sessionAgg[m][val].late;
        }
      });
    });

    return result;
  }, [filteredSessions, filteredCheckins, months, dimension, dimensionValues]);

  const headerMonths = months.map(m => {
    const [y, mo] = m.split('-');
    const d = new Date(Number(y), Number(mo)-1, 1);
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  });

  const renderValue = (m: string, val: string) => {
    const row = byMonth[m]?.[val];
    if (!row) return '-';
    switch (metric) {
      case 'sessions': return formatNumber(row.sessions);
      case 'checkins': return formatNumber(row.checkins);
      case 'revenue': return formatCurrency(row.revenue);
      case 'lateCancelled': return formatNumber(row.late);
      case 'classAvg': {
        if (row.sessions === 0) return '-';
        const avg = row.checkins / row.sessions;
        return avg.toFixed(1);
      }
      case 'revPerSeat': {
        if (row.capacity === 0) return '-';
        const rev = row.revenue / row.capacity;
        return formatCurrency(rev);
      }
      case 'cancellationRate': {
        if (row.sessions === 0) return '-';
        const rate = (row.late / row.sessions) * 100;
        return `${rate.toFixed(1)}%`;
      }
      case 'fillRate': {
        const pct = row.capacity > 0 ? (row.checkins / row.capacity) * 100 : 0;
        return `${pct.toFixed(1)}%`;
      }
    }
  };

  const valueForCalc = (m: string, val: string) => {
    const row = byMonth[m]?.[val];
    if (!row) return 0;
    switch (metric) {
      case 'sessions': return row.sessions;
      case 'checkins': return row.checkins;
      case 'revenue': return row.revenue;
      case 'lateCancelled': return row.late;
      case 'classAvg': return row.sessions === 0 ? 0 : row.checkins / row.sessions;
      case 'revPerSeat': return row.capacity === 0 ? 0 : row.revenue / row.capacity;
      case 'cancellationRate': return row.sessions === 0 ? 0 : (row.late / row.sessions) * 100;
      case 'fillRate': return row.capacity > 0 ? (row.checkins / row.capacity) * 100 : 0;
    }
  };

  const formatDelta = (delta: number, isPctPoints = false) => {
    const sign = delta > 0 ? '+' : delta < 0 ? '' : '';
    if (isPctPoints) return `${sign}${delta.toFixed(1)}pp`;
    return `${sign}${delta.toFixed(1)}%`;
  };

  const computeMoMDelta = (val: string) => {
    if (months.length < 2) return '-';
    const last = months[months.length - 1];
    const prev = months[months.length - 2];
    if (metric === 'fillRate' || metric === 'cancellationRate' || metric === 'classAvg') {
      const d = valueForCalc(last, val) - valueForCalc(prev, val);
      return formatDelta(d, true);
    } else {
      const vPrev = valueForCalc(prev, val);
      const vLast = valueForCalc(last, val);
      if (!vPrev) return '-';
      const change = ((vLast - vPrev) / vPrev) * 100;
      return formatDelta(change);
    }
  };

  // Totals per month across all dimensions
  const totalsByMonth = useMemo(() => {
    const totals: Record<string, { sessions: number; checkins: number; capacity: number; revenue: number; late: number }> = {};
    months.forEach(m => {
      const t = { sessions: 0, checkins: 0, capacity: 0, revenue: 0, late: 0 };
      dimensionValues.forEach(val => {
        const r = byMonth[m]?.[val];
        if (!r) return;
        t.sessions += r.sessions;
        t.checkins += r.checkins;
        t.capacity += r.capacity;
        t.revenue += r.revenue;
        t.late += r.late;
      });
      totals[m] = t;
    });
    return totals;
  }, [byMonth, months, dimensionValues]);

  const renderTotalValue = (m: string) => {
    const t = totalsByMonth[m];
    if (!t) return '-';
    switch (metric) {
      case 'sessions': return formatNumber(t.sessions);
      case 'checkins': return formatNumber(t.checkins);
      case 'revenue': return formatCurrency(t.revenue);
      case 'lateCancelled': return formatNumber(t.late);
      case 'classAvg': {
        if (t.sessions === 0) return '-';
        const avg = t.checkins / t.sessions;
        return avg.toFixed(1);
      }
      case 'revPerSeat': {
        if (t.capacity === 0) return '-';
        const rev = t.revenue / t.capacity;
        return formatCurrency(rev);
      }
      case 'cancellationRate': {
        if (t.sessions === 0) return '-';
        const rate = (t.late / t.sessions) * 100;
        return `${rate.toFixed(1)}%`;
      }
      case 'fillRate': {
        const pct = t.capacity > 0 ? (t.checkins / t.capacity) * 100 : 0;
        return `${pct.toFixed(1)}%`;
      }
    }
  };

  const dimensionLabel = {
    format: 'Format',
    className: 'Class Name',
    classType: 'Class Type',
    trainer: 'Trainer',
    location: 'Location',
    dayOfWeek: 'Day of Week',
    time: 'Time'
  };

  return (
    <div className="space-y-4">
      <style>{`
        @keyframes borderPulse {
          0%, 100% { border-color: rgb(220, 38, 38); opacity: 1; }
          50% { opacity: 0.5; }
        }

      `}</style>
      {/* Header with Title and Controls */}
      <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-slate-100 rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              Month-on-Month Analysis
            </h3>
            <p className="text-sm text-slate-600">Track performance trends across months with flexible dimension selection</p>
          </div>
          <div className="text-3xl opacity-10">📊</div>
        </div>

        {/* Dimension Selector */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4">
          <div className="relative inline-block w-full sm:w-auto">
            <button
              onClick={() => setShowDimensionMenu(!showDimensionMenu)}
              className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold text-sm flex items-center justify-between gap-2 hover:shadow-lg transition-all duration-200"
            >
              <BarChart3 className="w-4 h-4" />
              Dimension: {dimensionLabel[dimension]}
              <ChevronDown className={`w-4 h-4 transition-transform ${showDimensionMenu ? 'rotate-180' : ''}`} />
            </button>
            {showDimensionMenu && (
              <div className="absolute top-full left-0 mt-2 w-full sm:w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-10">
                {(Object.keys(dimensionLabel) as DimensionType[]).map(dim => (
                  <button
                    key={dim}
                    onClick={() => {
                      setDimension(dim);
                      setShowDimensionMenu(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                      dimension === dim
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {dimensionLabel[dim]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Metric Buttons */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'sessions' as MetricType, label: 'Sessions', icon: BarChart3 },
            { key: 'checkins' as MetricType, label: 'Check-ins', icon: Users },
            { key: 'revenue' as MetricType, label: 'Revenue', icon: TrendingUp },
            { key: 'fillRate' as MetricType, label: 'Fill Rate', icon: Percent },
            { key: 'classAvg' as MetricType, label: 'Class Avg', icon: Activity },
            { key: 'revPerSeat' as MetricType, label: 'Rev/Seat', icon: DollarSign },
            { key: 'cancellationRate' as MetricType, label: 'Cancel %', icon: AlertTriangle },
            { key: 'lateCancelled' as MetricType, label: 'Late Cancel', icon: Clock }
          ].map(btn => {
            const Icon = btn.icon;
            return (
              <Button
                key={btn.key}
                variant={metric === btn.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMetric(btn.key)}
                className={`h-9 px-3 text-xs font-semibold flex items-center gap-1.5 ${
                  metric === btn.key
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {btn.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <style>{`
        .table-border-animate {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes borderPulse {
          0%, 100% { borderColor: rgb(220, 38, 38); }
          50% { borderColor: rgb(239, 68, 68); }
        }
      `}</style>
      <Card className="bg-white shadow-sm border border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto" style={{ color: '#000' }}>
            <Table data-table="class-formats-mom" data-table-name="Class Formats Month-on-Month Analysis">
              <TableHeader>
                <TableRow className="bg-slate-100" style={{ borderBottom: '2px solid rgb(220, 38, 38)', animation: 'borderPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                  <TableHead className="font-bold text-black py-3" style={{ color: '#000' }}>{dimensionLabel[dimension]}</TableHead>
                  {headerMonths.map((hm, idx) => (
                    <TableHead key={idx} className="text-right font-bold text-black py-3" style={{ color: '#000' }}>{hm}</TableHead>
                  ))}
                  <TableHead className="text-right font-bold text-black py-3" style={{ color: '#000' }}>MoM Δ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dimensionValues.map((val, idx) => (
                  <TableRow key={val} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50 hover:bg-slate-100'}>
                    <TableCell className="font-semibold text-slate-900 py-3 capitalize">{val}</TableCell>
                    {months.map((m, midx) => {
                      const value = renderValue(m, val);
                      return (
                        <TableCell 
                          key={midx} 
                          className="text-right py-3 cursor-pointer hover:bg-blue-100 transition-colors font-medium text-slate-700"
                          onClick={() => handleCellClick(val, m, parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0)}
                        >
                          {value}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right py-3 font-semibold text-slate-900">{computeMoMDelta(val)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-slate-100 font-bold" style={{ borderTop: '2px solid rgb(220, 38, 38)', animation: 'borderPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                  <TableCell className="font-bold py-3" style={{ color: '#000' }}>Total</TableCell>
                  {months.map((m, idx) => (
                    <TableCell key={idx} className="text-right py-3 font-bold" style={{ color: '#000' }}>{renderTotalValue(m)}</TableCell>
                  ))}
                  <TableCell className="text-right py-3 font-bold" style={{ color: '#000' }}>—</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassFormatsMoMTable;
