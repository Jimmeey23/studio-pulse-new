import React, { useMemo } from 'react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { SessionData } from '@/hooks/useSessionsData';
import { getAllFormats, getClassFormat } from '@/utils/classTypeUtils';
import { TrendingUp, Users, Clock, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

interface OverviewMetricsCardProps {
  data: SessionData[];
}

const OverviewMetricsCard: React.FC<OverviewMetricsCardProps> = ({ data }) => {
  const sessions = Array.isArray(data) ? data : [];

  const formatMetrics = useMemo(() => {
    const formats = getAllFormats();
    
    return formats.map(format => {
      const rows = sessions.filter(s => getClassFormat(s.cleanedClass || s.classType) === format);
      
      if (rows.length === 0) {
        return {
          format,
          totalSessions: 0,
          totalRevenue: 0,
          emptyClasses: 0,
          nonEmptyClasses: 0,
          classAvgExcludingEmpty: 0,
          topTrainer: 'N/A',
          topClass: 'N/A',
          topTiming: 'N/A',
          revenueLostCancellations: 0,
          lateCancelledCount: 0,
          avgCapacity: 0,
          avgFillRate: 0,
        };
      }

      // Group by uniqueId1 to count classes
      const classMap = new Map<string, SessionData[]>();
      rows.forEach(row => {
        const classId = row.uniqueId1 || 'unknown';
        if (!classMap.has(classId)) classMap.set(classId, []);
        classMap.get(classId)!.push(row);
      });

      // Count empty vs non-empty classes
      let emptyClasses = 0;
      let nonEmptyClasses = 0;
      classMap.forEach((classSessions, classId) => {
        const hasCheckins = classSessions.some(s => s.checkedInCount > 0);
        if (hasCheckins) {
          nonEmptyClasses++;
        } else {
          emptyClasses++;
        }
      });

      // Calculate average attendance per non-empty class occurrence
      const totalCheckins = rows.reduce((sum, r) => sum + (r.checkedInCount || 0), 0);
      const classAvgExcludingEmpty = nonEmptyClasses > 0 ? totalCheckins / nonEmptyClasses : 0;

      // Find top trainer by revenue
      const trainerMap = new Map<string, number>();
      rows.forEach(r => {
        const trainer = r.trainerName || 'Unknown';
        trainerMap.set(trainer, (trainerMap.get(trainer) || 0) + (r.totalPaid || 0));
      });
      let topTrainer = 'N/A';
      let maxTrainerRev = 0;
      trainerMap.forEach((rev, trainer) => {
        if (rev > maxTrainerRev) {
          maxTrainerRev = rev;
          topTrainer = trainer;
        }
      });

      // Find top class by revenue
      const classNameMap = new Map<string, number>();
      rows.forEach(r => {
        const className = r.cleanedClass || r.classType || 'Unknown';
        classNameMap.set(className, (classNameMap.get(className) || 0) + (r.totalPaid || 0));
      });
      let topClass = 'N/A';
      let maxClassRev = 0;
      classNameMap.forEach((rev, cls) => {
        if (rev > maxClassRev) {
          maxClassRev = rev;
          topClass = cls;
        }
      });

      // Find top timing by revenue
      const timeMap = new Map<string, number>();
      rows.forEach(r => {
        const time = r.time || 'Unknown';
        timeMap.set(time, (timeMap.get(time) || 0) + (r.totalPaid || 0));
      });
      let topTiming = 'N/A';
      let maxTimeRev = 0;
      timeMap.forEach((rev, time) => {
        if (rev > maxTimeRev) {
          maxTimeRev = rev;
          topTiming = time;
        }
      });

      // Revenue lost from cancellations
      const totalBooked = rows.reduce((sum, r) => sum + (r.bookedCount || 0), 0);
      const revenueLostCancellations = 0; // Will be calculated from cancellation metrics

      // Late cancelled count
      const lateCancelledCount = rows.reduce((sum, r) => sum + (r.lateCancelledCount || 0), 0);

      // Total capacity and fill rate
      const totalCapacity = rows.reduce((sum, r) => sum + (r.capacity || 0), 0);
      const avgCapacity = rows.length > 0 ? Math.round(totalCapacity / rows.length) : 0;
      const avgFillRate = totalCapacity > 0 ? (totalCheckins / totalCapacity) * 100 : 0;

      return {
        format,
        totalSessions: rows.length,
        totalRevenue: rows.reduce((sum, r) => sum + (r.totalPaid || 0), 0),
        emptyClasses,
        nonEmptyClasses,
        classAvgExcludingEmpty: Math.round(classAvgExcludingEmpty * 10) / 10,
        topTrainer,
        topClass,
        topTiming,
        revenueLostCancellations,
        lateCancelledCount,
        avgCapacity,
        avgFillRate,
      };
    });
  }, [sessions]);

  return (
    <div className="space-y-6">
      {/* Format Cards Grid - Tall Gradient Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {formatMetrics.map(m => (
          <div
            key={m.format}
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-br border border-slate-200 hover:border-slate-300 transition-all duration-300 shadow-md hover:shadow-xl p-6 min-h-96 flex flex-col"
            style={{
              backgroundImage: m.format === 'PowerCycle'
                ? 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'
                : m.format === 'Strength Lab'
                ? 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
                : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
            }}
          >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-20" />

            <div className="relative z-10">
              {/* Header */}
              <div className="mb-6">
                <div className="text-white/80 text-sm font-medium mb-2">Class Format</div>
                <h2 className="text-3xl font-bold text-white mb-1">{m.format}</h2>
                <div
                  className="h-1 w-12 rounded-full"
                  style={{
                    background:
                      m.format === 'PowerCycle'
                        ? '#fbbf24'
                        : m.format === 'Strength Lab'
                        ? '#f472b6'
                        : '#c084fc'
                  }}
                />
              </div>

              {m.totalSessions === 0 ? (
                <div className="flex-grow flex items-center justify-center text-white/60 text-sm">
                  No sessions data
                </div>
              ) : (
                <>
                  {/* Primary Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20">
                      <div className="text-white/70 text-xs font-medium mb-1">Total Sessions</div>
                      <div className="text-2xl font-bold text-white">{formatNumber(m.totalSessions)}</div>
                    </div>
                    <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20">
                      <div className="text-white/70 text-xs font-medium mb-1">Revenue</div>
                      <div className="text-2xl font-bold text-white">{formatCurrency(m.totalRevenue)}</div>
                    </div>
                    <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20">
                      <div className="text-white/70 text-xs font-medium mb-1">Avg Capacity</div>
                      <div className="text-2xl font-bold text-white">{m.avgCapacity}</div>
                    </div>
                    <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20">
                      <div className="text-white/70 text-xs font-medium mb-1">Fill Rate</div>
                      <div className="text-2xl font-bold text-white">{m.avgFillRate.toFixed(1)}%</div>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="space-y-3 flex-grow mb-4">
                    <div className="flex items-center justify-between px-3 py-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                      <span className="text-white/80 text-sm">Non-Empty Classes</span>
                      <span className="text-lg font-bold text-white">{m.nonEmptyClasses}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                      <span className="text-white/80 text-sm">Empty Classes</span>
                      <span className="text-lg font-bold text-white">{m.emptyClasses}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                      <span className="text-white/80 text-sm">Class Avg</span>
                      <span className="text-lg font-bold text-white">{m.classAvgExcludingEmpty}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                      <span className="text-white/80 text-sm">Late Cancelled</span>
                      <span className={`text-lg font-bold ${
                        m.lateCancelledCount <= 5 ? 'text-green-300' : m.lateCancelledCount <= 10 ? 'text-yellow-300' : 'text-red-300'
                      }`}>
                        {m.lateCancelledCount}
                      </span>
                    </div>
                  </div>

                  {/* Top Performers Section */}
                  <div className="pt-4 border-t border-white/20">
                    <div className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-3">Top Performers</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-white/70">Trainer:</span>
                        <span className="font-semibold text-white truncate text-right ml-2">{m.topTrainer}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/70">Class:</span>
                        <span className="font-semibold text-white truncate text-right ml-2">{m.topClass}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/70">Timing:</span>
                        <span className="font-semibold text-white">{m.topTiming}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverviewMetricsCard;
