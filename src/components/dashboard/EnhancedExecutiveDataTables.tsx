
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Users, 
  Target, 
  Activity,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  UserCheck,
  Calendar,
  Star,
  Zap
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';

interface EnhancedExecutiveDataTablesProps {
  data: {
    sales: any[];
    sessions: any[];
    payroll: any[];
    newClients: any[];
    leads: any[];
    expirations?: any[];
  };
  selectedLocation?: string;
}

export const EnhancedExecutiveDataTables: React.FC<EnhancedExecutiveDataTablesProps> = ({ 
  data, 
  selectedLocation 
}) => {
  const { filters } = useGlobalFilters();
  const periodId = useMemo(() => `${filters.dateRange.start}:${filters.dateRange.end}`, [filters.dateRange.start, filters.dateRange.end]);
  // Process sales by product and category
  const salesByProduct = useMemo(() => {
    const productGroups = data.sales.reduce((acc, sale) => {
      const product = sale.cleanedProduct || 'Unknown Product';
      const category = sale.cleanedCategory || 'Uncategorized';
      
      if (!acc[product]) {
        acc[product] = {
          product,
          category,
          revenue: 0,
          transactions: 0,
          avgValue: 0
        };
      }
      
      acc[product].revenue += sale.paymentValue || 0;
      acc[product].transactions += 1;
      acc[product].avgValue = acc[product].revenue / acc[product].transactions;
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(productGroups)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [data.sales]);

  // Process leads by source
  const leadsBySource = useMemo(() => {
    const sourceGroups = data.leads.reduce((acc, lead) => {
      const source = lead.source || 'Unknown Source';
      
      if (!acc[source]) {
        acc[source] = {
          source,
          total: 0,
          converted: 0,
          conversionRate: 0
        };
      }
      
      acc[source].total += 1;
      if (lead.conversionStatus === 'Converted') {
        acc[source].converted += 1;
      }
      acc[source].conversionRate = acc[source].total > 0 ? (acc[source].converted / acc[source].total) * 100 : 0;
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(sourceGroups)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 8);
  }, [data.leads]);

  // Process new clients by class with conversions
  const newClientsByClass = useMemo(() => {
    const classGroups = data.newClients.reduce((acc, client) => {
      const className = client.firstClassType || 'Unknown Class';
      
      if (!acc[className]) {
        acc[className] = {
          className,
          newClients: 0,
          retained: 0,
          retentionRate: 0
        };
      }
      
      acc[className].newClients += 1;
      if (client.retentionStatus === 'Retained') {
        acc[className].retained += 1;
      }
      acc[className].retentionRate = acc[className].newClients > 0 ? (acc[className].retained / acc[className].newClients) * 100 : 0;
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(classGroups)
      .sort((a: any, b: any) => b.newClients - a.newClients)
      .slice(0, 8);
  }, [data.newClients]);

  // Process top and bottom performing classes
  const classPerformance = useMemo(() => {
    const classGroups = data.sessions.reduce((acc, session) => {
      const className = session.cleanedClass || 'Unknown Class';
      
      if (!acc[className]) {
        acc[className] = {
          className,
          sessions: 0,
          totalAttendance: 0,
          totalCapacity: 0,
          fillRate: 0,
          avgAttendance: 0
        };
      }
      
      acc[className].sessions += 1;
      acc[className].totalAttendance += session.checkedInCount || 0;
      acc[className].totalCapacity += session.capacity || 0;
      acc[className].avgAttendance = acc[className].totalAttendance / acc[className].sessions;
      acc[className].fillRate = acc[className].totalCapacity > 0 ? (acc[className].totalAttendance / acc[className].totalCapacity) * 100 : 0;
      
      return acc;
    }, {} as Record<string, any>);
    
    const sortedClasses = Object.values(classGroups).sort((a: any, b: any) => b.fillRate - a.fillRate);
    
    return {
      top: sortedClasses.slice(0, 5),
      bottom: sortedClasses.slice(-5).reverse()
    };
  }, [data.sessions]);

  // Process trainer performance
  const trainerPerformance = useMemo(() => {
    const trainerGroups = data.sessions.reduce((acc, session) => {
      const trainer = session.trainerName || 'Unknown Trainer';
      
      if (!acc[trainer]) {
        acc[trainer] = {
          trainer,
          sessions: 0,
          totalAttendance: 0,
          avgAttendance: 0,
          fillRate: 0
        };
      }
      
      acc[trainer].sessions += 1;
      acc[trainer].totalAttendance += session.checkedInCount || 0;
      acc[trainer].avgAttendance = acc[trainer].totalAttendance / acc[trainer].sessions;
      
      return acc;
    }, {} as Record<string, any>);
    
    const sortedTrainers = Object.values(trainerGroups).sort((a: any, b: any) => b.avgAttendance - a.avgAttendance);
    
    return {
      top: sortedTrainers.slice(0, 5),
      bottom: sortedTrainers.slice(-5).reverse()
    };
  }, [data.sessions]);

  // PowerCycle vs Barre comparison
  const formatComparison = useMemo(() => {
    const powerCycleSessions = data.sessions.filter(s => 
      s.cleanedClass?.toLowerCase().includes('cycle') || 
      s.classType?.toLowerCase().includes('cycle')
    );
    
    const barreSessions = data.sessions.filter(s => 
      s.cleanedClass?.toLowerCase().includes('barre')
    );

    const powerCycleStats = {
      sessions: powerCycleSessions.length,
      attendance: powerCycleSessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0),
      avgAttendance: powerCycleSessions.length > 0 ? powerCycleSessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0) / powerCycleSessions.length : 0
    };

    const barreStats = {
      sessions: barreSessions.length,
      attendance: barreSessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0),
      avgAttendance: barreSessions.length > 0 ? barreSessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0) / barreSessions.length : 0
    };

    return { powerCycle: powerCycleStats, barre: barreStats };
  }, [data.sessions]);

  if (!data || Object.values(data).every(arr => arr.length === 0)) {
    return (
      <div className="text-center text-gray-600 p-8">
        <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p>No data available for the selected location and time period.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sales by Product */}
      <Card className="bg-gradient-to-br from-white via-blue-50/30 to-white border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Top Products by Revenue
            <Badge variant="secondary">{salesByProduct.length} items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {salesByProduct.map((product: any, index) => (
              <div key={product.product} className="flex items-center justify-between p-3 bg-white/80 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{product.product}</p>
                    <p className="text-xs text-slate-500">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{formatCurrency(product.revenue)}</p>
                  <p className="text-xs text-slate-500">{product.transactions} sales</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leads by Source */}
      <Card className="bg-gradient-to-br from-white via-green-50/30 to-white border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            Lead Sources & Conversion
            <Badge variant="secondary">{leadsBySource.length} sources</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leadsBySource.map((source: any, index) => (
              <div key={source.source} className="flex items-center justify-between p-3 bg-white/80 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{source.source}</p>
                    <p className="text-xs text-slate-500">{source.total} leads</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{source.conversionRate.toFixed(1)}%</p>
                  <p className="text-xs text-slate-500">{source.converted} converted</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* New Clients by Class */}
      <Card className="bg-gradient-to-br from-white via-purple-50/30 to-white border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-purple-600" />
            New Clients by Class Type
            <Badge variant="secondary">{newClientsByClass.length} classes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {newClientsByClass.map((classData: any, index) => (
              <div key={classData.className} className="flex items-center justify-between p-3 bg-white/80 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{classData.className}</p>
                    <p className="text-xs text-slate-500">{classData.newClients} new clients</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{classData.retentionRate.toFixed(1)}%</p>
                  <p className="text-xs text-slate-500">retention</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top & Bottom Performing Classes */}
      <Card className="bg-gradient-to-br from-white via-orange-50/30 to-white border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-600" />
            Class Performance Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Top Performing
              </h4>
              <div className="space-y-2">
                {classPerformance.top.map((classData: any, index) => (
                  <div key={classData.className} className="flex items-center justify-between p-2 bg-green-50/50 rounded">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">{classData.className}</span>
                    </div>
                    <span className="text-sm font-bold text-green-700">{classData.fillRate.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-1">
                <TrendingDown className="w-4 h-4" />
                Needs Improvement
              </h4>
              <div className="space-y-2">
                {classPerformance.bottom.map((classData: any, index) => (
                  <div key={classData.className} className="flex items-center justify-between p-2 bg-red-50/50 rounded">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium">{classData.className}</span>
                    </div>
                    <span className="text-sm font-bold text-red-700">{classData.fillRate.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PowerCycle vs Barre */}
      <Card className="bg-gradient-to-br from-white via-indigo-50/30 to-white border-0 shadow-lg lg:col-span-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            PowerCycle vs Barre Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-800">PowerCycle</h4>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-900">{formatComparison.powerCycle.sessions}</p>
                  <p className="text-xs text-blue-600">Sessions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-900">{formatComparison.powerCycle.attendance}</p>
                  <p className="text-xs text-blue-600">Total Attendance</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-900">{formatComparison.powerCycle.avgAttendance.toFixed(1)}</p>
                  <p className="text-xs text-blue-600">Avg per Session</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-pink-600" />
                <h4 className="font-semibold text-pink-800">Barre</h4>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-pink-900">{formatComparison.barre.sessions}</p>
                  <p className="text-xs text-pink-600">Sessions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-pink-900">{formatComparison.barre.attendance}</p>
                  <p className="text-xs text-pink-600">Total Attendance</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-pink-900">{formatComparison.barre.avgAttendance.toFixed(1)}</p>
                  <p className="text-xs text-pink-600">Avg per Session</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Trainers */}
      <Card className="bg-gradient-to-br from-white via-teal-50/30 to-white border-0 shadow-lg lg:col-span-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Trainer Performance Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Top Performers
              </h4>
              <div className="space-y-3">
                {trainerPerformance.top.map((trainer: any, index) => (
                  <div key={trainer.trainer} className="flex items-center justify-between p-3 bg-green-50/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{trainer.trainer}</p>
                        <p className="text-xs text-slate-500">{trainer.sessions} sessions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-700">{trainer.avgAttendance.toFixed(1)}</p>
                      <p className="text-xs text-slate-500">avg attendance</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-orange-700 mb-3 flex items-center gap-1">
                <TrendingDown className="w-4 h-4" />
                Needs Support
              </h4>
              <div className="space-y-3">
                {trainerPerformance.bottom.map((trainer: any, index) => (
                  <div key={trainer.trainer} className="flex items-center justify-between p-3 bg-orange-50/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-orange-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{trainer.trainer}</p>
                        <p className="text-xs text-slate-500">{trainer.sessions} sessions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-700">{trainer.avgAttendance.toFixed(1)}</p>
                      <p className="text-xs text-slate-500">avg attendance</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expirations Analysis - Only if data exists */}
      {data.expirations && data.expirations.length > 0 && (
        <Card className="bg-gradient-to-br from-white via-purple-50/30 to-white border-0 shadow-lg lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Package Expirations Analysis
              <Badge variant="secondary">{data.expirations.length} packages</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-purple-900">Total Expiring Value</h4>
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(data.expirations.reduce((sum, e) => sum + (e.orderValue || 0), 0))}
                </p>
                <p className="text-xs text-purple-600 mt-2">across {data.expirations.length} packages</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-amber-900">Avg Days to Expiry</h4>
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-amber-900">
                  {data.expirations.length > 0 
                    ? (data.expirations.reduce((sum, e) => sum + (e.daysToExpiry || 0), 0) / data.expirations.length).toFixed(0)
                    : '0'}
                </p>
                <p className="text-xs text-amber-600 mt-2">time to expiration</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-red-900">Urgent (&lt; 7 days)</h4>
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-900">
                  {data.expirations.filter(e => (e.daysToExpiry || 0) < 7).length}
                </p>
                <p className="text-xs text-red-600 mt-2">packages expiring soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
