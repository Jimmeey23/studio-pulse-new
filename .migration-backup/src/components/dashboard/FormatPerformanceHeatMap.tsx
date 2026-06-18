import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SessionData } from '@/hooks/useSessionsData';
import { formatNumber, formatPercentage, formatCurrency } from '@/utils/formatters';
import { TrendingUp, Users, DollarSign, Calendar, Target } from 'lucide-react';

interface Props {
  data: SessionData[];
  selectedFormat?: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00'
];

type MetricType = 'fillRate' | 'revenue' | 'attendance' | 'sessions' | 'classAverage';

export const FormatPerformanceHeatMap: React.FC<Props> = ({ data, selectedFormat }) => {
  const [metric, setMetric] = useState<MetricType>('fillRate');

  const heatMapData = useMemo(() => {
    const normalizeDay = (d: string | undefined) => {
      if (!d) return '';
      const s = String(d).trim().toLowerCase();
      if (s.length === 0) return '';
      // map common short/long forms to full Day name
      if (s.startsWith('mon')) return 'Monday';
      if (s.startsWith('tue')) return 'Tuesday';
      if (s.startsWith('wed')) return 'Wednesday';
      if (s.startsWith('thu')) return 'Thursday';
      if (s.startsWith('fri')) return 'Friday';
      if (s.startsWith('sat')) return 'Saturday';
      if (s.startsWith('sun')) return 'Sunday';
      // fallback capitalize
      return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const normalizeTime = (t: string | undefined) => {
      if (!t) return '';
      const s = String(t).trim();
      // Prefer HH:MM 24-hour; try to parse a Date then format
      // If already in HH:MM or H:MM, try to extract
      const hhmmMatch = s.match(/(\d{1,2}):(\d{2})/);
      if (hhmmMatch) {
        const hh = parseInt(hhmmMatch[1], 10);
        const mm = parseInt(hhmmMatch[2], 10);
        if (!isNaN(hh) && !isNaN(mm)) return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      }
      // Try parsing with Date
      const dt = new Date(s);
      if (!isNaN(dt.getTime())) {
        const hh = String(dt.getHours()).padStart(2, '0');
        const mm = String(dt.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      }
      return s.slice(0,5);
    };

    const filteredData = selectedFormat 
      ? data.filter(s => (s.classType === selectedFormat || s.cleanedClass === selectedFormat))
      : data;

    const grid: Record<string, Record<string, {
      sessions: number;
      totalCapacity: number;
      totalCheckins: number;
      totalRevenue: number;
      fillRate: number;
      classAverage: number;
    }>> = {};

    // Initialize grid
    DAYS.forEach(day => {
      grid[day] = {};
      TIME_SLOTS.forEach(time => {
        grid[day][time] = {
          sessions: 0,
          totalCapacity: 0,
          totalCheckins: 0,
          totalRevenue: 0,
          fillRate: 0,
          classAverage: 0
        };
      });
    });

    // Populate grid (normalize incoming day/time values)
    filteredData.forEach(session => {
      const day = normalizeDay(session.dayOfWeek);
      const time = normalizeTime(session.time);

      if (day && time && grid[day]?.[time]) {
        grid[day][time].sessions += 1;
        grid[day][time].totalCapacity += session.capacity || 0;
        grid[day][time].totalCheckins += session.checkedInCount || 0;
        grid[day][time].totalRevenue += session.totalPaid || session.revenue || 0;
      }
    });

    // Calculate fill rates and class averages
    Object.keys(grid).forEach(day => {
      Object.keys(grid[day]).forEach(time => {
        const cell = grid[day][time];
        if (cell.totalCapacity > 0) {
          cell.fillRate = (cell.totalCheckins / cell.totalCapacity) * 100;
        }
        if (cell.sessions > 0) {
          cell.classAverage = cell.totalCheckins / cell.sessions;
        }
      });
    });

    return grid;
  }, [data, selectedFormat]);

  const getMetricValue = (day: string, time: string): number => {
    const cell = heatMapData[day]?.[time];
    if (!cell) return 0;

    switch (metric) {
      case 'fillRate': return cell.fillRate;
      case 'revenue': return cell.totalRevenue;
      case 'attendance': return cell.totalCheckins;
      case 'sessions': return cell.sessions;
      case 'classAverage': return cell.classAverage;
      default: return 0;
    }
  };

  const getMaxValue = (): number => {
    let max = 0;
    DAYS.forEach(day => {
      TIME_SLOTS.forEach(time => {
        const value = getMetricValue(day, time);
        if (value > max) max = value;
      });
    });
    return max;
  };

  const maxValue = getMaxValue();

  const getColor = (value: number): string => {
    if (value === 0) return 'bg-gray-100';
    const intensity = maxValue > 0 ? value / maxValue : 0;
    
    if (intensity >= 0.8) return 'bg-emerald-600 text-white';
    if (intensity >= 0.6) return 'bg-emerald-500 text-white';
    if (intensity >= 0.4) return 'bg-emerald-400';
    if (intensity >= 0.2) return 'bg-emerald-300';
    return 'bg-emerald-200';
  };

  const formatValue = (value: number): string => {
    switch (metric) {
      case 'fillRate': return value > 0 ? `${value.toFixed(0)}%` : '-';
      case 'revenue': return value > 0 ? formatCurrency(value) : '-';
      case 'attendance': return value > 0 ? formatNumber(value) : '-';
      case 'sessions': return value > 0 ? formatNumber(value) : '-';
      case 'classAverage': return value > 0 ? value.toFixed(1) : '-';
      default: return '-';
    }
  };

  const metricConfig = {
    fillRate: { icon: Users, label: 'Fill Rate', color: 'emerald' },
    revenue: { icon: DollarSign, label: 'Revenue', color: 'blue' },
    attendance: { icon: TrendingUp, label: 'Attendance', color: 'purple' },
    sessions: { icon: Calendar, label: 'Session Count', color: 'orange' },
    classAverage: { icon: Target, label: 'Class Average', color: 'cyan' }
  };

  // Check if there's any data
  const hasData = data && data.length > 0;
  const totalSessions = Object.values(heatMapData).reduce((sum, dayData) => 
    sum + Object.values(dayData).reduce((daySum, cell) => daySum + cell.sessions, 0), 0
  );

  return (
    <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Performance Heat Map by Time & Day
            {selectedFormat && (
              <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700">
                {selectedFormat}
              </Badge>
            )}
            {hasData && totalSessions > 0 && (
              <Badge variant="outline" className="ml-2 text-xs">
                {totalSessions} sessions
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(metricConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <Button
                  key={key}
                  size="sm"
                  variant={metric === key ? 'default' : 'outline'}
                  className={metric === key ? `bg-${config.color}-600 hover:bg-${config.color}-700` : ''}
                  onClick={() => setMetric(key as MetricType)}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {config.label}
                </Button>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData || totalSessions === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-lg">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Session Data</h3>
            <p className="text-slate-600">
              {selectedFormat 
                ? `No ${selectedFormat} sessions found for the selected filters.`
                : 'No sessions found for the selected filters.'
              }
            </p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-slate-200 bg-slate-100 p-2 text-xs font-semibold text-slate-700 sticky left-0 z-10">
                  Time / Day
                </th>
                {DAYS.map(day => (
                  <th key={day} className="border border-slate-200 bg-slate-100 p-2 text-xs font-semibold text-slate-700 min-w-[80px]">
                    {day.substring(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map(time => (
                <tr key={time}>
                  <td className="border border-slate-200 bg-slate-50 p-2 text-xs font-medium text-slate-700 sticky left-0 z-10">
                    {time}
                  </td>
                  {DAYS.map(day => {
                    const value = getMetricValue(day, time);
                    const cell = heatMapData[day]?.[time];
                    return (
                      <td
                        key={`${day}-${time}`}
                        className={`border border-slate-200 p-2 text-center transition-all hover:scale-105 cursor-pointer ${getColor(value)}`}
                        title={`${day} ${time}\nSessions: ${cell?.sessions || 0}\nFill Rate: ${cell?.fillRate.toFixed(1)}%\nClass Average: ${cell?.classAverage.toFixed(1)}\nRevenue: ${formatCurrency(cell?.totalRevenue || 0)}\nAttendance: ${cell?.totalCheckins || 0}`}
                      >
                        <div className="text-xs font-semibold">
                          {formatValue(value)}
                        </div>
                        {cell && cell.sessions > 0 && (
                          <div className="text-[10px] opacity-75 mt-0.5">
                            {cell.sessions} class{cell.sessions !== 1 ? 'es' : ''}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {/* Legend - Only show when there's data */}
        {hasData && totalSessions > 0 && (
        <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Low</span>
            <div className="flex gap-1">
              <div className="w-6 h-4 bg-emerald-200 border border-slate-300"></div>
              <div className="w-6 h-4 bg-emerald-300 border border-slate-300"></div>
              <div className="w-6 h-4 bg-emerald-400 border border-slate-300"></div>
              <div className="w-6 h-4 bg-emerald-500 border border-slate-300"></div>
              <div className="w-6 h-4 bg-emerald-600 border border-slate-300"></div>
            </div>
            <span>High</span>
          </div>
          <div className="text-slate-500">
            Hover over cells for detailed information
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  );
};
