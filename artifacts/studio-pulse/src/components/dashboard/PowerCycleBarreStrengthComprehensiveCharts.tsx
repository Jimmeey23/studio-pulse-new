import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PayrollData } from '@/types/dashboard';
import { Activity, TrendingUp, TrendingDown, Users, Zap, Target } from 'lucide-react';

interface PowerCycleBarreStrengthComprehensiveChartsProps {
  data: PayrollData[];
  onItemClick: (item: any) => void;
}

export const PowerCycleBarreStrengthComprehensiveCharts: React.FC<PowerCycleBarreStrengthComprehensiveChartsProps> = ({
  data,
  onItemClick
}) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { byLocation: [], byTrainer: [], byMonth: [] };

    // Group by location
    const byLocation = data.reduce((acc, item) => {
      const location = item.location || 'Unknown';
      if (!acc[location]) {
        acc[location] = {
          location,
          totalSessions: 0,
          totalCustomers: 0,
          cycleSessions: 0,
          barreSessions: 0,
          strengthSessions: 0,
          totalPaid: 0
        };
      }
      acc[location].totalSessions += item.totalSessions || 0;
      acc[location].totalCustomers += item.totalCustomers || 0;
      acc[location].cycleSessions += item.cycleSessions || 0;
      acc[location].barreSessions += item.barreSessions || 0;
      acc[location].strengthSessions += item.strengthSessions || 0;
      acc[location].totalPaid += item.totalPaid || 0;
      return acc;
    }, {} as Record<string, any>);

    // Group by trainer
    const byTrainer = data.reduce((acc, item) => {
      const trainer = item.teacherName || 'Unknown';
      if (!acc[trainer]) {
        acc[trainer] = {
          trainer,
          totalSessions: 0,
          totalCustomers: 0,
          cycleSessions: 0,
          barreSessions: 0,
          strengthSessions: 0,
          totalPaid: 0
        };
      }
      acc[trainer].totalSessions += item.totalSessions || 0;
      acc[trainer].totalCustomers += item.totalCustomers || 0;
      acc[trainer].cycleSessions += item.cycleSessions || 0;
      acc[trainer].barreSessions += item.barreSessions || 0;
      acc[trainer].strengthSessions += item.strengthSessions || 0;
      acc[trainer].totalPaid += item.totalPaid || 0;
      return acc;
    }, {} as Record<string, any>);

    // Group by month
    const byMonth = data.reduce((acc, item) => {
      const month = item.monthYear || 'Unknown';
      if (!acc[month]) {
        acc[month] = {
          month,
          totalSessions: 0,
          totalCustomers: 0,
          cycleSessions: 0,
          barreSessions: 0,
          strengthSessions: 0,
          totalPaid: 0
        };
      }
      acc[month].totalSessions += item.totalSessions || 0;
      acc[month].totalCustomers += item.totalCustomers || 0;
      acc[month].cycleSessions += item.cycleSessions || 0;
      acc[month].barreSessions += item.barreSessions || 0;
      acc[month].strengthSessions += item.strengthSessions || 0;
      acc[month].totalPaid += item.totalPaid || 0;
      return acc;
    }, {} as Record<string, any>);

    return {
      byLocation: Object.values(byLocation).sort((a, b) => b.totalSessions - a.totalSessions),
      byTrainer: Object.values(byTrainer).sort((a, b) => b.totalSessions - a.totalSessions),
      byMonth: Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month))
    };
  }, [data]);

  const renderBarChart = (data: any[], key: string, title: string, icon: React.ReactNode) => {
    const maxValue = Math.max(...data.map(d => d.totalSessions));
    
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.slice(0, 8).map((item, index) => {
              const percentage = maxValue > 0 ? (item.totalSessions / maxValue) * 100 : 0;
              const displayKey = item.location || item.trainer || item.month;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700 truncate flex-1 mr-2">
                      {displayKey}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.totalSessions} sessions
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {item.totalCustomers} customers
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Cycle: {item.cycleSessions} | Barre: {item.barreSessions}</span>
                    <span>₹{(item.totalPaid || 0).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Performance Analytics Charts</h2>
        <p className="text-slate-600">Visual breakdown of sessions, customers, and revenue across different dimensions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {renderBarChart(chartData.byLocation, 'location', 'By Location', <Target className="w-5 h-5 text-green-500" />)}
        {renderBarChart(chartData.byTrainer, 'trainer', 'By Trainer', <Users className="w-5 h-5 text-blue-500" />)}
        {renderBarChart(chartData.byMonth, 'month', 'By Month', <TrendingUp className="w-5 h-5 text-purple-500" />)}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-500" />
            Overall Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-cyan-50 rounded-lg">
              <div className="text-2xl font-bold text-cyan-600">{data.reduce((sum, d) => sum + (d.totalSessions || 0), 0)}</div>
              <div className="text-sm text-slate-600">Total Sessions</div>
            </div>
            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-600">{data.reduce((sum, d) => sum + (d.totalCustomers || 0), 0)}</div>
              <div className="text-sm text-slate-600">Total Customers</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.reduce((sum, d) => sum + (d.cycleSessions || 0), 0)}</div>
              <div className="text-sm text-slate-600">Cycle Sessions</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{data.reduce((sum, d) => sum + (d.barreSessions || 0), 0)}</div>
              <div className="text-sm text-slate-600">Barre Sessions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};