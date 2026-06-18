import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SessionData } from '@/hooks/useSessionsData';
import { Users, Target, Calendar, XCircle, CheckCircle2, ClipboardList, Percent, DollarSign } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';

type CanonicalFormat = 'powercycle' | 'barre' | 'strength' | 'other';

const mapToCanonical = (s: SessionData): CanonicalFormat => {
  const t = (s.classType || s.cleanedClass || '').toLowerCase();
  if (/power|cycle/.test(t)) return 'powercycle';
  if (/barre/.test(t)) return 'barre';
  if (/strength/.test(t)) return 'strength';
  return 'other';
};

interface FormatComparisonSummaryCardsProps {
  data: SessionData[];
  onDrillDown?: (data: { format: string; metric: string; value: number }) => void;
}

export const FormatComparisonSummaryCards: React.FC<FormatComparisonSummaryCardsProps> = ({ data, onDrillDown }) => {
  const handleCardClick = (format: string, metric: string, value: number) => {
    if (onDrillDown) {
      onDrillDown({ format, metric, value });
    }
  };

  const stats = useMemo(() => {
    const groups: Record<CanonicalFormat, SessionData[]> = { powercycle: [], barre: [], strength: [], other: [] };
    data.forEach(s => groups[mapToCanonical(s)].push(s));

    const handleCardClick = (format: string, metric: string, value: number) => {
      if (onDrillDown) {
        onDrillDown({ format, metric, value });
      }
    };

    const calc = (arr: SessionData[]) => {
      const sessions = arr.length;
      const scheduled = arr.reduce((sum, s) => sum + ((s as any).classes || s.classes || 0), 0);
      const sessionsTaught = arr.filter(s => (s.checkedInCount || 0) > 0).length;
      const emptyClasses = arr.filter(s => (s.checkedInCount || 0) === 0).length;
      const checkIns = arr.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
      const capacity = arr.reduce((sum, s) => sum + (s.capacity || 0), 0);
      const lateCancelled = arr.reduce((sum, s) => sum + (s.lateCancelledCount || 0), 0);
      const booked = arr.reduce((sum, s) => sum + (s.bookedCount || 0), 0);
      const revenue = arr.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
      const fillRate = capacity > 0 ? (checkIns / capacity) * 100 : 0;
      const cancellationRate = booked > 0 ? (lateCancelled / booked) * 100 : 0;
      const classAvgWithEmpty = sessions > 0 ? checkIns / sessions : 0;
      const classAvgWithoutEmpty = sessionsTaught > 0 ? checkIns / sessionsTaught : 0;
      const utilisation = fillRate;
      return {
        sessions, scheduled, sessionsTaught, emptyClasses, checkIns, capacity,
        lateCancelled, booked, revenue, fillRate, cancellationRate,
        classAvgWithEmpty, classAvgWithoutEmpty, utilisation,
      };
    };

    return {
      powercycle: calc(groups.powercycle),
      barre: calc(groups.barre),
      strength: calc(groups.strength),
    };
  }, [data]);

  const cards = [
    { 
      key: 'powercycle', 
      title: 'PowerCycle', 
      gradient: 'from-blue-500 via-cyan-500 to-blue-600',
      iconBg: 'from-blue-600 to-cyan-700',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      fillBadgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200'
    },
    { 
      key: 'barre', 
      title: 'Barre', 
      gradient: 'from-pink-500 via-rose-500 to-pink-600',
      iconBg: 'from-pink-600 to-rose-700',
      badgeBg: 'bg-pink-50 text-pink-700 border-pink-200',
      fillBadgeBg: 'bg-rose-50 text-rose-700 border-rose-200'
    },
    { 
      key: 'strength', 
      title: 'Strength Lab', 
      gradient: 'from-emerald-500 via-green-500 to-emerald-600',
      iconBg: 'from-emerald-600 to-green-700',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      fillBadgeBg: 'bg-green-50 text-green-700 border-green-200'
    },
  ] as const;

  const metricRow = (
    label: string,
    value: React.ReactNode,
    Icon: React.ElementType,
  ) => (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2 text-slate-600">
        <Icon className="w-4 h-4 text-slate-500" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((c) => {
        const s = (stats as any)[c.key];
        return (
          <Card 
            key={c.key} 
            className={`relative overflow-hidden bg-white border-2 border-slate-100 shadow-lg rounded-3xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
            onClick={() => handleCardClick(c.title, 'overview', s.sessions)}
          >
            {/* Gradient accent background */}
            <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${c.gradient}`}></div>
            
            <CardHeader className="pb-4 pt-6">
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-3">
                <div className={`w-12 h-12 bg-gradient-to-br ${c.iconBg} rounded-2xl shadow-lg flex items-center justify-center`}>
                  <span className="text-white text-xl font-black">{c.title.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <div className="text-xl font-extrabold text-slate-900">{c.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className={`${c.badgeBg} border font-semibold`}>
                      {formatNumber(s.sessions)} sessions
                    </Badge>
                    <Badge variant="secondary" className={`${c.fillBadgeBg} border font-semibold`}>
                      {s.fillRate.toFixed(1)}% fill
                    </Badge>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Key Metrics Row */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200">
                  <div className="text-center">
                    <div className={`text-2xl font-black bg-gradient-to-r ${c.gradient} bg-clip-text text-transparent`}>
                      {formatNumber(s.checkIns)}
                    </div>
                    <div className="text-xs font-semibold text-slate-600 mt-1">Check-ins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-slate-900">
                      {formatNumber(s.revenue)}
                    </div>
                    <div className="text-xs font-semibold text-slate-600 mt-1">Revenue</div>
                  </div>
                </div>

                {/* Detailed Metrics */}
                <div className="space-y-2">
                  {metricRow('Sessions taught', formatNumber(s.sessionsTaught), CheckCircle2)}
                  {metricRow('Empty classes', formatNumber(s.emptyClasses), XCircle)}
                  {metricRow('Capacity', formatNumber(s.capacity), ClipboardList)}
                  {metricRow('Avg class (w/ empty)', s.classAvgWithEmpty.toFixed(1), Calendar)}
                  {metricRow('Avg class (no empty)', s.classAvgWithoutEmpty.toFixed(1), Calendar)}
                  {metricRow('Bookings', formatNumber(s.booked), ClipboardList)}
                  {metricRow('Cancellation rate', `${s.cancellationRate.toFixed(1)}%`, Percent)}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default FormatComparisonSummaryCards;
