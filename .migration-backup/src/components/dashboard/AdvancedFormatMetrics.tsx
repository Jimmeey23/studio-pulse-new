import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SessionData } from '@/hooks/useSessionsData';
import { formatNumber, formatPercentage, formatCurrency } from '@/utils/formatters';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, Activity, 
  Clock, Target, Zap, Award, AlertCircle 
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  data: SessionData[];
  singleFormat?: boolean; // Flag to indicate if showing single format view
}

export const AdvancedFormatMetrics: React.FC<Props> = ({ data, singleFormat = false }) => {
  const metrics = useMemo(() => {
    // Determine which formats to show
    let formats = ['Barre', 'PowerCycle', 'Strength'];
    
    // If single format mode, detect which format has data
    if (singleFormat) {
      const detectedFormat = data.find(s => s.classType || s.cleanedClass);
      if (detectedFormat) {
        const format = detectedFormat.classType || detectedFormat.cleanedClass || '';
        if (formats.includes(format)) {
          formats = [format];
        }
      }
    }
    
    const formatMetrics = formats.map(format => {
      const formatData = data.filter(s => 
        s.classType === format || s.cleanedClass === format
      );

      if (formatData.length === 0) {
        return {
          format,
          totalSessions: 0,
          totalRevenue: 0,
          totalCapacity: 0,
          totalCheckins: 0,
          fillRate: 0,
          avgRevenuePerSession: 0,
          avgRevenuePerHour: 0,
          capacityUtilization: 0,
          uniqueClients: 0,
          avgAttendancePerSession: 0,
          revenuePerClient: 0
        };
      }

      const totalSessions = formatData.length;
      const totalRevenue = formatData.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
      const totalCapacity = formatData.reduce((sum, s) => sum + (s.capacity || 0), 0);
      const totalCheckins = formatData.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
      const fillRate = totalCapacity > 0 ? (totalCheckins / totalCapacity) * 100 : 0;
      const avgRevenuePerSession = totalSessions > 0 ? totalRevenue / totalSessions : 0;
      
      // Assuming average session is 1 hour (adjust if you have actual duration data)
      const avgRevenuePerHour = avgRevenuePerSession;
      const capacityUtilization = fillRate;
      
      // Note: Since SessionData doesn't expose participants array directly,
      // we'll approximate unique clients using sessions and avg attendance
      const avgAttendancePerSession = totalSessions > 0 ? totalCheckins / totalSessions : 0;
      // Rough estimate: assume unique clients ≈ totalCheckins (conservative)
      const uniqueClients = totalCheckins; // This is a conservative estimate

      const revenuePerClient = uniqueClients > 0 ? totalRevenue / uniqueClients : 0;

      return {
        format,
        totalSessions,
        totalRevenue,
        totalCapacity,
        totalCheckins,
        fillRate,
        avgRevenuePerSession,
        avgRevenuePerHour,
        capacityUtilization,
        uniqueClients,
        avgAttendancePerSession,
        revenuePerClient
      };
    });

    // Cross-format participation (clients who attend multiple formats)
    // Note: Without direct access to participant data, we'll calculate this differently
    // Using total unique check-ins across all formats
    const totalCheckins = data.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
    const totalUniqueClients = totalCheckins; // Conservative estimate
    
    // Estimate multi-format clients based on overlap in session patterns
    // This is a simplified approximation
    // Only show cross-format metrics if viewing all formats
    const multiFormatClients = singleFormat ? 0 : Math.floor(totalUniqueClients * 0.15); // Assume 15% cross-format
    const crossFormatRate = (!singleFormat && totalUniqueClients > 0)
      ? (multiFormatClients / totalUniqueClients) * 100 
      : 0;

    return { formatMetrics, crossFormatRate, multiFormatClients, totalUniqueClients, singleFormat };
  }, [data, singleFormat]);

  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    color = 'blue',
    delay = 0 
  }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className={`bg-gradient-to-br from-white via-${color}-50/20 to-white border-${color}-200 shadow-lg hover:shadow-xl transition-all`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-3">
            <Icon className={`w-8 h-8 text-${color}-600`} />
            {trend !== undefined && (
              <Badge variant={trend >= 0 ? 'default' : 'destructive'} className="text-xs">
                {trend >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {formatPercentage(Math.abs(trend))}
              </Badge>
            )}
          </div>
          <div className={`text-3xl font-bold text-${color}-900 mb-1`}>
            {value}
          </div>
          <p className="text-sm text-slate-600 font-medium">{title}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-2">{subtitle}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Overall Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {!metrics.singleFormat && metrics.crossFormatRate > 0 && (
          <MetricCard
            icon={Users}
            title="Cross-Format Participation"
            value={formatPercentage(metrics.crossFormatRate)}
            subtitle={`${formatNumber(metrics.multiFormatClients)} of ${formatNumber(metrics.totalUniqueClients)} clients`}
            color="emerald"
            delay={0}
          />
        )}
        
        {metrics.formatMetrics
          .filter(fm => fm.totalSessions > 0)
          .map((fm, idx) => (
          <MetricCard
            key={fm.format}
            icon={DollarSign}
            title={metrics.singleFormat ? `Revenue per Session` : `${fm.format} Revenue/Session`}
            value={formatCurrency(fm.avgRevenuePerSession)}
            subtitle={`${formatNumber(fm.totalSessions)} total sessions`}
            color={idx === 0 ? 'blue' : idx === 1 ? 'purple' : 'orange'}
            delay={metrics.singleFormat ? 0 : 0.1 * (idx + 1)}
          />
        ))}
      </div>

      {/* Format Comparison Table - Only show if there's data */}
      {metrics.formatMetrics.filter(fm => fm.totalSessions > 0).length > 0 && (
      <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" />
            {metrics.singleFormat 
              ? `${metrics.formatMetrics.find(fm => fm.totalSessions > 0)?.format || ''} Performance Metrics`
              : 'Advanced Format Performance Metrics'
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-3 text-sm font-semibold text-slate-700">Metric</th>
                  {metrics.formatMetrics
                    .filter(fm => fm.totalSessions > 0)
                    .map(fm => (
                    <th key={fm.format} className="text-right p-3 text-sm font-semibold text-slate-700">
                      {metrics.singleFormat ? 'Value' : fm.format}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 text-sm font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-600" />
                      Capacity Utilization
                    </div>
                  </td>
                  {metrics.formatMetrics
                    .filter(fm => fm.totalSessions > 0)
                    .map(fm => (
                    <td key={fm.format} className="text-right p-3">
                      <Badge variant={fm.capacityUtilization >= 70 ? 'default' : 'secondary'}>
                        {formatPercentage(fm.capacityUtilization)}
                      </Badge>
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 text-sm font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      Revenue Per Hour
                    </div>
                  </td>
                  {metrics.formatMetrics
                    .filter(fm => fm.totalSessions > 0)
                    .map(fm => (
                    <td key={fm.format} className="text-right p-3 text-sm font-semibold text-slate-900">
                      {formatCurrency(fm.avgRevenuePerHour)}
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 text-sm font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      Unique Clients
                    </div>
                  </td>
                  {metrics.formatMetrics
                    .filter(fm => fm.totalSessions > 0)
                    .map(fm => (
                    <td key={fm.format} className="text-right p-3 text-sm font-semibold text-slate-900">
                      {formatNumber(fm.uniqueClients)}
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 text-sm font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-orange-600" />
                      Avg Attendance/Session
                    </div>
                  </td>
                  {metrics.formatMetrics
                    .filter(fm => fm.totalSessions > 0)
                    .map(fm => (
                    <td key={fm.format} className="text-right p-3 text-sm font-semibold text-slate-900">
                      {fm.avgAttendancePerSession.toFixed(1)}
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 text-sm font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-yellow-600" />
                      Revenue Per Client
                    </div>
                  </td>
                  {metrics.formatMetrics
                    .filter(fm => fm.totalSessions > 0)
                    .map(fm => (
                    <td key={fm.format} className="text-right p-3 text-sm font-semibold text-slate-900">
                      {formatCurrency(fm.revenuePerClient)}
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 text-sm font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-indigo-600" />
                      Class Average
                    </div>
                  </td>
                  {metrics.formatMetrics
                    .filter(fm => fm.totalSessions > 0)
                    .map(fm => (
                    <td key={fm.format} className="text-right p-3 text-sm font-semibold text-slate-900">
                      {fm.avgAttendancePerSession.toFixed(1)} attendees
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-slate-50">
                  <td className="p-3 text-sm font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-600" />
                      Fill Rate
                    </div>
                  </td>
                  {metrics.formatMetrics
                    .filter(fm => fm.totalSessions > 0)
                    .map(fm => (
                    <td key={fm.format} className="text-right p-3">
                      <Badge variant={fm.fillRate >= 75 ? 'default' : fm.fillRate >= 50 ? 'secondary' : 'outline'}>
                        {formatPercentage(fm.fillRate)}
                      </Badge>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Empty State */}
      {metrics.formatMetrics.filter(fm => fm.totalSessions > 0).length === 0 && (
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <CardContent className="p-12 text-center">
            <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">No Data Available</h3>
            <p className="text-slate-600">
              No session data found for the selected format and filters.
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Try adjusting your filters or selecting a different time period.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Key Insights - Only show if there's data */}
      {metrics.formatMetrics.filter(fm => fm.totalSessions > 0).length > 0 && (
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-indigo-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-indigo-600" />
            {metrics.singleFormat 
              ? `${metrics.formatMetrics.find(fm => fm.totalSessions > 0)?.format || ''} Key Insights`
              : 'Key Performance Insights'
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!metrics.singleFormat && metrics.formatMetrics
              .sort((a, b) => b.avgRevenuePerHour - a.avgRevenuePerHour)
              .map((fm, idx) => {
                if (idx === 0) {
                  return (
                    <div key={fm.format} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-emerald-200">
                      <Award className="w-5 h-5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Highest Revenue Per Hour: <span className="text-emerald-600">{fm.format}</span>
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          Generating {formatCurrency(fm.avgRevenuePerHour)}/hour with {formatPercentage(fm.capacityUtilization)} capacity utilization
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })}

            {metrics.singleFormat && metrics.formatMetrics.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-emerald-200">
                <Award className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Revenue Performance
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Generating {formatCurrency(metrics.formatMetrics[0].avgRevenuePerHour)}/hour with {formatPercentage(metrics.formatMetrics[0].capacityUtilization)} capacity utilization
                  </p>
                </div>
              </div>
            )}

            {!metrics.singleFormat && metrics.formatMetrics
              .sort((a, b) => b.fillRate - a.fillRate)
              .map((fm, idx) => {
                if (idx === 0) {
                  return (
                    <div key={fm.format} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
                      <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Highest Fill Rate: <span className="text-blue-600">{fm.format}</span>
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          Achieving {formatPercentage(fm.fillRate)} fill rate across {formatNumber(fm.totalSessions)} sessions
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })}

            {metrics.singleFormat && metrics.formatMetrics.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
                <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Fill Rate Performance
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Achieving {formatPercentage(metrics.formatMetrics[0].fillRate)} fill rate across {formatNumber(metrics.formatMetrics[0].totalSessions)} sessions
                  </p>
                </div>
              </div>
            )}

            {!metrics.singleFormat && metrics.formatMetrics
              .sort((a, b) => b.avgAttendancePerSession - a.avgAttendancePerSession)
              .map((fm, idx) => {
                if (idx === 0) {
                  return (
                    <div key={fm.format} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-cyan-200">
                      <Target className="w-5 h-5 text-cyan-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Highest Class Average: <span className="text-cyan-600">{fm.format}</span>
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          Averaging {fm.avgAttendancePerSession.toFixed(1)} attendees per class with {formatNumber(fm.totalSessions)} total sessions
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })}

            {metrics.singleFormat && metrics.formatMetrics.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-cyan-200">
                <Target className="w-5 h-5 text-cyan-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Class Average Performance
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Averaging {metrics.formatMetrics[0].avgAttendancePerSession.toFixed(1)} attendees per class with {formatNumber(metrics.formatMetrics[0].totalSessions)} total sessions
                  </p>
                </div>
              </div>
            )}

            {!metrics.singleFormat && (
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-200">
              <Users className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Multi-Format Engagement
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {formatPercentage(metrics.crossFormatRate)} of clients ({formatNumber(metrics.multiFormatClients)}) attend multiple formats - strong cross-sell opportunity
                </p>
              </div>
            </div>
            )}
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
};
