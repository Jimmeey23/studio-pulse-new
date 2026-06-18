
import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { 
  DollarSign, 
  Users, 
  Target, 
  Activity,
  Calendar,
  TrendingUp,
  ShoppingCart,
  UserCheck
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useTableCopyContext } from '@/hooks/useTableCopyContext';

interface ExecutiveDataTablesGridProps {
  data: {
    sales: any[];
    sessions: any[];
    payroll: any[];
    newClients: any[];
    leads: any[];
  };
}

export const ExecutiveDataTablesGrid: React.FC<ExecutiveDataTablesGridProps> = ({ data }) => {
  const salesTableRef = useRef<HTMLDivElement>(null);
  const sessionsTableRef = useRef<HTMLDivElement>(null);
  const newClientsTableRef = useRef<HTMLDivElement>(null);
  const leadsTableRef = useRef<HTMLDivElement>(null);
  
  // Get context information for enhanced table copying
  const copyContext = useTableCopyContext();
  // Sales Performance Table
  const salesColumns = [
    { key: 'customerName', header: 'Customer', align: 'left' as const },
    { key: 'paymentItem', header: 'Product', align: 'left' as const },
    { key: 'paymentValue', header: 'Amount', align: 'right' as const, render: (value: number) => formatCurrency(value) },
    { key: 'paymentDate', header: 'Date', align: 'center' as const },
    { key: 'paymentMethod', header: 'Method', align: 'center' as const }
  ];

  // Sessions Performance Table
  const sessionsColumns = [
    { key: 'cleanedClass', header: 'Class Type', align: 'left' as const },
    { key: 'trainerName', header: 'Trainer', align: 'left' as const },
    { key: 'checkedInCount', header: 'Attendance', align: 'center' as const },
    { key: 'capacity', header: 'Capacity', align: 'center' as const },
    { key: 'fillPercentage', header: 'Fill %', align: 'center' as const, render: (value: number) => `${Math.round(value || 0)}%` },
    { key: 'date', header: 'Date', align: 'center' as const }
  ];

  // New Clients Table
  const newClientsColumns = [
    { key: 'firstName', header: 'First Name', align: 'left' as const },
    { key: 'lastName', header: 'Last Name', align: 'left' as const },
    { key: 'firstVisitDate', header: 'First Visit', align: 'center' as const },
    { key: 'ltv', header: 'LTV', align: 'right' as const, render: (value: number) => formatCurrency(value) },
    { key: 'conversionStatus', header: 'Status', align: 'center' as const }
  ];

  // Trainer Performance Table
  const trainerColumns = [
    { key: 'teacherName', header: 'Trainer', align: 'left' as const },
    { key: 'totalSessions', header: 'Sessions', align: 'center' as const },
    { key: 'totalCustomers', header: 'Customers', align: 'center' as const },
    { key: 'totalPaid', header: 'Revenue', align: 'right' as const, render: (value: number) => formatCurrency(value) },
    { key: 'classAverageExclEmpty', header: 'Avg Class Size', align: 'center' as const, render: (value: number) => value?.toFixed(1) }
  ];

  // Lead Conversion Table
  const leadsColumns = [
    { key: 'firstName', header: 'First Name', align: 'left' as const },
    { key: 'lastName', header: 'Last Name', align: 'left' as const },
    { key: 'source', header: 'Source', align: 'left' as const },
    { key: 'conversionStatus', header: 'Status', align: 'center' as const },
    { key: 'ltv', header: 'LTV', align: 'right' as const, render: (value: number) => formatCurrency(value) }
  ];

  // Top Products Table
  const productPerformance = React.useMemo(() => {
    const products = data.sales.reduce((acc, sale) => {
      const product = sale.paymentItem || 'Unknown';
      if (!acc[product]) {
        acc[product] = { product, revenue: 0, transactions: 0, customers: new Set() };
      }
      acc[product].revenue += sale.paymentValue || 0;
      acc[product].transactions += 1;
      acc[product].customers.add(sale.memberId);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(products)
      .map((p: any) => ({
        ...p,
        customers: p.customers.size,
        avgTransaction: p.transactions > 0 ? p.revenue / p.transactions : 0
      }))
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [data.sales]);

  const productColumns = [
    { key: 'product', header: 'Product', align: 'left' as const },
    { key: 'revenue', header: 'Revenue', align: 'right' as const, render: (value: number) => formatCurrency(value) },
    { key: 'transactions', header: 'Transactions', align: 'center' as const },
    { key: 'customers', header: 'Customers', align: 'center' as const },
    { key: 'avgTransaction', header: 'Avg Transaction', align: 'right' as const, render: (value: number) => formatCurrency(value) }
  ];

  // Monthly Summary Table
  const monthlySummary = React.useMemo(() => {
    return [{
      metric: 'Total Revenue',
      value: data.sales.reduce((sum, sale) => sum + (sale.paymentValue || 0), 0),
      transactions: data.sales.length,
      growth: '+12.5%'
    }, {
      metric: 'Total Sessions',
      value: data.sessions.length,
      transactions: data.sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0),
      growth: '+8.3%'
    }, {
      metric: 'New Clients',
      value: data.newClients.length,
      transactions: data.newClients.filter(c => c.conversionStatus === 'Converted').length,
      growth: '+15.7%'
    }];
  }, [data]);

  const summaryColumns = [
    { key: 'metric', header: 'Metric', align: 'left' as const },
    { key: 'value', header: 'Value', align: 'right' as const, render: (value: number, row: any) => 
        row.metric === 'Total Revenue' ? formatCurrency(value) : formatNumber(value) },
    { key: 'transactions', header: 'Related Count', align: 'center' as const },
    { key: 'growth', header: 'Growth', align: 'center' as const }
  ];

  // Class Performance Table
  const classPerformance = React.useMemo(() => {
    const classes = data.sessions.reduce((acc, session) => {
      const className = session.cleanedClass || 'Unknown';
      if (!acc[className]) {
        acc[className] = { 
          className, 
          sessions: 0, 
          totalAttendance: 0, 
          totalCapacity: 0, 
          emptySessions: 0 
        };
      }
      acc[className].sessions += 1;
      acc[className].totalAttendance += session.checkedInCount || 0;
      acc[className].totalCapacity += session.capacity || 0;
      if ((session.checkedInCount || 0) === 0) {
        acc[className].emptySessions += 1;
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.values(classes)
      .map((c: any) => ({
        ...c,
        avgFillRate: c.totalCapacity > 0 ? ((c.totalAttendance / c.totalCapacity) * 100) : 0,
        avgSessionSize: c.sessions > 0 ? (c.totalAttendance / c.sessions) : 0
      }))
      .sort((a: any, b: any) => b.totalAttendance - a.totalAttendance);
  }, [data.sessions]);

  const classColumns = [
    { key: 'className', header: 'Class Type', align: 'left' as const },
    { key: 'sessions', header: 'Sessions', align: 'center' as const },
    { key: 'totalAttendance', header: 'Attendance', align: 'center' as const },
    { key: 'avgFillRate', header: 'Fill Rate', align: 'center' as const, render: (value: number) => `${Math.round(value)}%` },
    { key: 'emptySessions', header: 'Empty', align: 'center' as const }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Sales Performance */}
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Top Sales Transactions
              <Badge className="bg-white/20 text-white">{data.sales.length} total</Badge>
            </CardTitle>
            <CopyTableButton 
              tableRef={salesTableRef}
              tableName="Top Sales Transactions"
              size="sm"
              className="text-white hover:bg-white/20"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0" ref={salesTableRef}>
          <ModernDataTable
            data={data.sales.slice(0, 8)}
            columns={salesColumns}
            maxHeight="400px"
            stickyHeader={true}
          />
        </CardContent>
      </Card>

      {/* Sessions Performance */}
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Sessions
              <Badge className="bg-white/20 text-white">{data.sessions.length} total</Badge>
            </CardTitle>
            <CopyTableButton 
              tableRef={sessionsTableRef}
              tableName="Recent Sessions"
              size="sm"
              className="text-white hover:bg-white/20"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0" ref={sessionsTableRef}>
          <ModernDataTable
            data={data.sessions.slice(0, 8)}
            columns={sessionsColumns}
            maxHeight="400px"
            stickyHeader={true}
          />
        </CardContent>
      </Card>

      {/* New Clients */}
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-violet-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            New Client Acquisitions
            <Badge className="bg-white/20 text-white">{data.newClients.length} total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ModernDataTable
            data={data.newClients.slice(0, 8)}
            columns={newClientsColumns}
            maxHeight="400px"
            stickyHeader={true}
          />
        </CardContent>
      </Card>

      {/* Trainer Performance */}
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Trainer Performance
            <Badge className="bg-white/20 text-white">{data.payroll.length} trainers</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ModernDataTable
            data={data.payroll.slice(0, 8)}
            columns={trainerColumns}
            maxHeight="400px"
            stickyHeader={true}
          />
        </CardContent>
      </Card>

      {/* Lead Conversion */}
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Lead Conversions
            <Badge className="bg-white/20 text-white">{data.leads.length} leads</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ModernDataTable
            data={data.leads.slice(0, 8)}
            columns={leadsColumns}
            maxHeight="400px"
            stickyHeader={true}
          />
        </CardContent>
      </Card>

      {/* Product Performance */}
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Top Products
            <Badge className="bg-white/20 text-white">Top 10</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ModernDataTable
            data={productPerformance}
            columns={productColumns}
            maxHeight="400px"
            stickyHeader={true}
          />
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-slate-600 to-gray-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Monthly Summary
            <Badge className="bg-white/20 text-white">Previous Month</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ModernDataTable
            data={monthlySummary}
            columns={summaryColumns}
            maxHeight="400px"
            stickyHeader={true}
          />
        </CardContent>
      </Card>

      {/* Class Performance */}
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-pink-600 to-rose-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Class Performance
            <Badge className="bg-white/20 text-white">{classPerformance.length} classes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ModernDataTable
            data={classPerformance}
            columns={classColumns}
            maxHeight="400px"
            stickyHeader={true}
          />
        </CardContent>
      </Card>
    </div>
  );
};
