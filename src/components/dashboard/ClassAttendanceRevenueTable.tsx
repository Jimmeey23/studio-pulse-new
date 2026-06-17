import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingUp, Target, BarChart3, Zap, Users, Calendar } from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatNumber, formatPercentage } from '@/utils/formatters';

interface ClassAttendanceRevenueTableProps {
  data: SessionData[];
}

export const ClassAttendanceRevenueTable: React.FC<ClassAttendanceRevenueTableProps> = ({ data }) => {
  const [selectedMetric, setSelectedMetric] = useState('totalRevenue');

  const revenueData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const formatStats = data.reduce((acc, session) => {
      const format = session.cleanedClass || session.classType || 'Unknown';
      if (!acc[format]) {
        acc[format] = {
          format,
          totalSessions: 0,
          totalRevenue: 0,
          totalAttendance: 0,
          totalCapacity: 0,
          revenueGeneratingSessions: 0,
          freeAttendees: 0,
          paidAttendees: 0,
          membership: 0,
          packages: 0,
          introOffers: 0,
          singleClasses: 0
        };
      }
      
      acc[format].totalSessions += 1;
      acc[format].totalRevenue += session.totalPaid || 0;
      acc[format].totalAttendance += session.checkedInCount || 0;
      acc[format].totalCapacity += session.capacity || 0;
      
      // Payment type breakdown
      acc[format].membership += session.checkedInsWithMemberships || 0;
      acc[format].packages += session.checkedInsWithPackages || 0;
      acc[format].introOffers += session.checkedInsWithIntroOffers || 0;
      acc[format].singleClasses += session.checkedInsWithSingleClasses || 0;
      
      const paidCount = (session.checkedInsWithMemberships || 0) + 
                       (session.checkedInsWithPackages || 0) + 
                       (session.checkedInsWithIntroOffers || 0) + 
                       (session.checkedInsWithSingleClasses || 0);
      
      acc[format].paidAttendees += paidCount;
      acc[format].freeAttendees += (session.checkedInCount || 0) - paidCount;
      
      if ((session.totalPaid || 0) > 0) acc[format].revenueGeneratingSessions += 1;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(formatStats).map((stat: any) => ({
      ...stat,
      avgRevenue: stat.totalSessions > 0 ? Number((stat.totalRevenue / stat.totalSessions).toFixed(1)) : 0,
      revenuePerAttendee: stat.totalAttendance > 0 ? Number((stat.totalRevenue / stat.totalAttendance).toFixed(1)) : 0,
      revenuePerCapacity: stat.totalCapacity > 0 ? Number((stat.totalRevenue / stat.totalCapacity).toFixed(1)) : 0,
      revenueEfficiency: stat.totalSessions > 0 ? (stat.revenueGeneratingSessions / stat.totalSessions) * 100 : 0,
      paidAttendeeRate: stat.totalAttendance > 0 ? (stat.paidAttendees / stat.totalAttendance) * 100 : 0,
      fillRate: stat.totalCapacity > 0 ? (stat.totalAttendance / stat.totalCapacity) * 100 : 0,
      monetizationRate: stat.totalCapacity > 0 ? (stat.paidAttendees / stat.totalCapacity) * 100 : 0
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [data]);

  const metrics = [
    { id: 'totalRevenue', label: 'Total Revenue', icon: DollarSign, color: 'green' },
    { id: 'avgRevenue', label: 'Avg Revenue/Session', icon: BarChart3, color: 'blue' },
    { id: 'revenuePerAttendee', label: 'Revenue/Attendee', icon: Users, color: 'purple' },
    { id: 'revenueEfficiency', label: 'Revenue Efficiency', icon: Zap, color: 'orange' },
    { id: 'paidAttendeeRate', label: 'Paid Attendee Rate', icon: Target, color: 'indigo' },
    { id: 'monetizationRate', label: 'Monetization Rate', icon: TrendingUp, color: 'pink' }
  ];

  const getMetricValue = (row: any, metricId: string) => {
    const value = row[metricId];
    switch (metricId) {
      case 'totalRevenue':
      case 'avgRevenue':
      case 'revenuePerAttendee':
      case 'revenuePerCapacity':
        return formatNumber(value);
      case 'revenueEfficiency':
      case 'paidAttendeeRate':
      case 'fillRate':
      case 'monetizationRate':
        return formatPercentage(value);
      default:
        return formatNumber(value);
    }
  };

  const getPaymentBreakdown = (row: any) => {
    const total = row.totalAttendance;
    if (total === 0) return [];
    
    return [
      { type: 'Memberships', count: row.membership, percentage: (row.membership / total) * 100, color: 'bg-blue-100 text-blue-800' },
      { type: 'Packages', count: row.packages, percentage: (row.packages / total) * 100, color: 'bg-green-100 text-green-800' },
      { type: 'Intro Offers', count: row.introOffers, percentage: (row.introOffers / total) * 100, color: 'bg-purple-100 text-purple-800' },
      { type: 'Single Classes', count: row.singleClasses, percentage: (row.singleClasses / total) * 100, color: 'bg-orange-100 text-orange-800' },
      { type: 'Free', count: row.freeAttendees, percentage: (row.freeAttendees / total) * 100, color: 'bg-gray-100 text-gray-800' }
    ].filter(item => item.count > 0);
  };

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader className="border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            Revenue Performance Analysis
            <Badge variant="outline" className="text-green-600">
              {revenueData.length} formats
            </Badge>
          </CardTitle>
        </div>
        
        {/* Metric Selector */}
        <div className="flex flex-wrap gap-2 mt-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Button
                key={metric.id}
                variant={selectedMetric === metric.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric(metric.id)}
                className="gap-1 text-xs"
              >
                <Icon className="w-3 h-3" />
                {metric.label}
              </Button>
            );
          })}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                <TableHead className="font-semibold text-slate-100 sticky left-0 z-10 bg-slate-800">Class Format</TableHead>
                <TableHead className="text-center font-semibold text-slate-100">Total Revenue</TableHead>
                <TableHead className="text-center font-semibold text-slate-100">Avg Revenue</TableHead>
                <TableHead className="text-center font-semibold text-slate-100">Revenue/Attendee</TableHead>
                <TableHead className="text-center font-semibold text-slate-100">Selected Metric</TableHead>
                <TableHead className="text-center font-semibold text-slate-100">Payment Breakdown</TableHead>
                <TableHead className="text-center font-semibold text-slate-100">Efficiency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenueData.map((row, index) => {
                const paymentBreakdown = getPaymentBreakdown(row);
                const topPaymentMethod = paymentBreakdown.reduce((max, current) => 
                  current.count > max.count ? current : max, { count: 0, type: 'None', percentage: 0 }
                );
                
                return (
                  <TableRow key={index} className="compact-table-row hover:bg-gray-50 transition-colors">
                    <TableCell className="font-medium sticky left-0 bg-white z-10 border-r whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-gray-900">{row.format}</span>
                        <span className="text-xs text-gray-500">
                          {formatNumber(row.totalSessions)} sessions
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col">
                        <span className="font-medium text-green-600">{formatCurrency(row.totalRevenue)}</span>
                        <span className="text-xs text-gray-500">
                          {formatNumber(row.revenueGeneratingSessions)} revenue sessions
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col">
                        <span className="font-medium">{formatNumber(row.avgRevenue)}</span>
                        <span className="text-xs text-gray-500">per session</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col">
                        <span className="font-medium">{formatNumber(row.revenuePerAttendee)}</span>
                        <span className="text-xs text-gray-500">per attendee</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={
                        selectedMetric.includes('Rate') || selectedMetric.includes('Efficiency') 
                          ? row[selectedMetric] >= 80 ? 'bg-green-100 text-green-800' :
                            row[selectedMetric] >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }>
                        {getMetricValue(row, selectedMetric)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col gap-1">
                        {paymentBreakdown.slice(0, 2).map((payment, idx) => (
                          <Badge key={idx} className={`text-xs ${payment.color}`}>
                            {payment.type}: {payment.count} ({formatPercentage(payment.percentage)})
                          </Badge>
                        ))}
                        {paymentBreakdown.length > 2 && (
                          <span className="text-xs text-gray-500">+{paymentBreakdown.length - 2} more</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="text-xs">
                          {formatPercentage(row.revenueEfficiency)} revenue rate
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {formatPercentage(row.monetizationRate)} monetization
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};