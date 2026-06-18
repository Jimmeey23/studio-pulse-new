import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PayrollData } from '@/types/dashboard';
import { formatNumber } from '@/utils/formatters';
import { Activity, Users, DollarSign, Target, Calendar, AlertTriangle } from 'lucide-react';
import { PersistentTableFooter } from '@/components/dashboard/PersistentTableFooter';
import type { TableColumn } from '@/hooks/useGeminiAnalysis';

interface BarreDetailedTableProps {
  data: PayrollData[];
  onItemClick: (item: any) => void;
}

export const BarreDetailedTable: React.FC<BarreDetailedTableProps> = ({
  data,
  onItemClick
}) => {
  const totals = useMemo(() => {
    const totalSessions = data.reduce((s, r) => s + (r.barreSessions || 0), 0);
    const totalEmpty = data.reduce((s, r) => s + (r.emptyBarreSessions || 0), 0);
    const totalCustomers = data.reduce((s, r) => s + (r.barreCustomers || 0), 0);
    const totalRevenue = data.reduce((s, r) => s + (r.barrePaid || 0), 0);
    const fillRate = totalSessions > 0 ? ((totalSessions - totalEmpty) / totalSessions) * 100 : 0;
    const revenuePerSession = totalSessions > 0 ? totalRevenue / totalSessions : 0;
    const avgCustomers = (totalSessions - totalEmpty) > 0 ? totalCustomers / (totalSessions - totalEmpty) : 0;
    return { totalSessions, totalEmpty, totalCustomers, totalRevenue, fillRate, revenuePerSession, avgCustomers };
  }, [data]);

  const aiTableData = useMemo(() => data.map(trainer => {
    const sessions = trainer.barreSessions || 0;
    const emptySessions = trainer.emptyBarreSessions || 0;
    const customers = trainer.barreCustomers || 0;
    const revenue = trainer.barrePaid || 0;
    const fillRate = sessions > 0 ? ((sessions - emptySessions) / sessions) * 100 : 0;
    const revenuePerSession = sessions > 0 ? revenue / sessions : 0;
    const avgCustomers = (sessions - emptySessions) > 0 ? customers / (sessions - emptySessions) : 0;
    return { trainer: trainer.teacherName, location: trainer.location, sessions, emptySessions, fillRate, customers, revenue, revenuePerSession, avgCustomers };
  }), [data]);

  const aiTableColumns: TableColumn[] = [
    { key: 'trainer', header: 'Trainer', type: 'text' },
    { key: 'location', header: 'Location', type: 'text' },
    { key: 'sessions', header: 'Sessions', type: 'number' },
    { key: 'emptySessions', header: 'Empty Sessions', type: 'number' },
    { key: 'fillRate', header: 'Fill Rate %', type: 'percentage' },
    { key: 'customers', header: 'Customers', type: 'number' },
    { key: 'revenue', header: 'Revenue', type: 'currency' },
    { key: 'revenuePerSession', header: 'Revenue/Session', type: 'currency' },
    { key: 'avgCustomers', header: 'Avg Customers', type: 'number' },
  ];

  return (
    <Card className="bg-gradient-to-br from-white via-pink-50/40 to-pink-100/30 border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-pink-600 to-rose-600 text-white">
        <CardTitle className="text-lg font-bold flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/20"><Activity className="w-5 h-5" /></span>
          Barre Detailed Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
            <div className="text-xs text-pink-700">Total Sessions</div>
            <div className="text-lg font-semibold text-pink-900">{formatNumber(totals.totalSessions)}</div>
          </div>
          <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
            <div className="text-xs text-pink-700">Total Revenue</div>
            <div className="text-lg font-semibold text-pink-900">₹{formatNumber(totals.totalRevenue)}</div>
          </div>
          <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
            <div className="text-xs text-pink-700">Fill Rate</div>
            <div className="text-lg font-semibold text-pink-900">{totals.fillRate.toFixed(1)}%</div>
          </div>
          <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
            <div className="text-xs text-pink-700">Avg Customers</div>
            <div className="text-lg font-semibold text-pink-900">{totals.avgCustomers.toFixed(1)}</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow">
                <th className="text-left p-3 font-semibold">Trainer</th>
                <th className="text-right p-3 font-semibold">Total Sessions</th>
                <th className="text-right p-3 font-semibold">Empty Sessions</th>
                <th className="text-right p-3 font-semibold">Fill Rate</th>
                <th className="text-right p-3 font-semibold">Customers</th>
                <th className="text-right p-3 font-semibold">Revenue</th>
                <th className="text-right p-3 font-semibold">Revenue/Session</th>
                <th className="text-right p-3 font-semibold">Avg Customers</th>
              </tr>
            </thead>
            <tbody>
              {data.map((trainer, index) => {
                const sessions = trainer.barreSessions || 0;
                const emptySessions = trainer.emptyBarreSessions || 0;
                const customers = trainer.barreCustomers || 0;
                const revenue = trainer.barrePaid || 0;
                const fillRate = sessions > 0 ? ((sessions - emptySessions) / sessions) * 100 : 0;
                const revenuePerSession = sessions > 0 ? revenue / sessions : 0;
                const avgCustomers = (sessions - emptySessions) > 0 ? customers / (sessions - emptySessions) : 0;

                return (
                  <tr 
                    key={trainer.unique}
                    className="border-b border-pink-100 hover:bg-pink-50 cursor-pointer"
                    onClick={() => onItemClick({ 
                      type: 'barre-trainer', 
                      trainer, 
                      metrics: { sessions, emptySessions, customers, revenue, fillRate, revenuePerSession, avgCustomers }
                    })}
                  >
                    <td className="p-3">
                      <div>
                        <div className="font-medium text-pink-900">{trainer.teacherName}</div>
                        <div className="text-sm text-pink-600">{trainer.location}</div>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Calendar className="w-4 h-4 text-pink-500" />
                        <span className="font-medium">{formatNumber(sessions)}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">{formatNumber(emptySessions)}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <Badge 
                        variant={fillRate >= 80 ? "default" : fillRate >= 60 ? "secondary" : "destructive"}
                        className="flex items-center gap-1"
                      >
                        <Target className="w-3 h-3" />
                        {fillRate.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Users className="w-4 h-4 text-pink-500" />
                        <span className="font-medium">{formatNumber(customers)}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span className="font-medium">₹{formatNumber(revenue)}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-medium">₹{formatNumber(revenuePerSession)}</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-medium">{avgCustomers.toFixed(1)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-pink-50 border-t border-pink-200">
                <td className="p-3 font-semibold text-pink-900">TOTALS</td>
                <td className="p-3 text-right font-semibold text-pink-900">{formatNumber(totals.totalSessions)}</td>
                <td className="p-3 text-right font-semibold text-pink-900">{formatNumber(totals.totalEmpty)}</td>
                <td className="p-3 text-right">
                  <Badge variant={totals.fillRate >= 80 ? 'default' : totals.fillRate >= 60 ? 'secondary' : 'destructive'}>
                    {totals.fillRate.toFixed(1)}%
                  </Badge>
                </td>
                <td className="p-3 text-right font-semibold text-pink-900">{formatNumber(totals.totalCustomers)}</td>
                <td className="p-3 text-right font-semibold text-pink-900">₹{formatNumber(totals.totalRevenue)}</td>
                <td className="p-3 text-right font-semibold text-pink-900">₹{formatNumber(totals.revenuePerSession)}</td>
                <td className="p-3 text-right font-semibold text-pink-900">{totals.avgCustomers.toFixed(1)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <PersistentTableFooter
          tableId="barre-detailed-analytics"
          tableData={aiTableData}
          tableColumns={aiTableColumns}
          tableName="Barre Detailed Analytics"
          tableContext="Trainer-level Barre performance with sessions, customers, revenue, fill rate, and efficiencies"
        />
      </CardContent>
    </Card>
  );
};