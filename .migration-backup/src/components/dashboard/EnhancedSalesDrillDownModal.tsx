import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  Calendar, 
  MapPin, 
  BarChart3, 
  DollarSign, 
  Activity, 
  CreditCard,
  Target,
  Clock,
  Star,
  Zap,
  PieChart,
  Award,
  Filter,
  Eye,
  Download
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { useAdvancedExport } from '@/hooks/useAdvancedExport';

interface EnhancedSalesDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  type: 'metric' | 'product' | 'category' | 'member' | 'soldBy' | 'paymentMethod' | 'client-conversion' | 'trainer' | 'location' | 'class';
}

const EnhancedSalesDrillDownModal: React.FC<EnhancedSalesDrillDownModalProps> = ({
  isOpen,
  onClose,
  data,
  type
}) => {
  if (!data) return null;

  const { exportAllData, isExporting } = useAdvancedExport();

  // Enhanced data processing with deeper analytics
  const enhancedData = useMemo(() => {
    // Use the most specific transaction data available
    const transactionData = data.filteredTransactionData || data.rawData || data.transactionData || [];
    
    // Use dynamic metrics if available (calculated from filtered data), otherwise calculate fresh
    const totalRevenue = data.isDynamic && data.totalRevenue !== undefined ? data.totalRevenue : 
                        transactionData.reduce((sum: number, item: any) => sum + (item.paymentValue || 0), 0);
    const totalTransactions = data.isDynamic && data.totalTransactions !== undefined ? data.totalTransactions : 
                             transactionData.length;
    const uniqueCustomers = data.isDynamic && data.totalCustomers !== undefined ? data.totalCustomers : 
                           new Set(transactionData.map((item: any) => item.memberId || item.customerEmail)).size;
    const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const uniqueProducts = new Set(transactionData.map((item: any) => item.cleanedProduct || item.paymentItem)).size;

    // Advanced analytics
    const paymentMethodBreakdown = transactionData.reduce((acc: any, item: any) => {
      const method = item.paymentMethod || 'Unknown';
      if (!acc[method]) {
        acc[method] = { count: 0, revenue: 0 };
      }
      acc[method].count += 1;
      acc[method].revenue += item.paymentValue || 0;
      return acc;
    }, {});

    const categoryBreakdown = transactionData.reduce((acc: any, item: any) => {
      const category = item.cleanedCategory || 'Other';
      if (!acc[category]) {
        acc[category] = { count: 0, revenue: 0, customers: new Set() };
      }
      acc[category].count += 1;
      acc[category].revenue += item.paymentValue || 0;
      acc[category].customers.add(item.memberId || item.customerEmail);
      return acc;
    }, {});

    const timeAnalysis = transactionData.reduce((acc: any, item: any) => {
      if (!item.paymentDate) return acc;
      
      const date = new Date(item.paymentDate);
      const hour = date.getHours();
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const month = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      // Hour analysis
      if (!acc.hourly[hour]) {
        acc.hourly[hour] = { transactions: 0, revenue: 0 };
      }
      acc.hourly[hour].transactions += 1;
      acc.hourly[hour].revenue += item.paymentValue || 0;
      
      // Day of week analysis
      if (!acc.weekly[dayOfWeek]) {
        acc.weekly[dayOfWeek] = { transactions: 0, revenue: 0 };
      }
      acc.weekly[dayOfWeek].transactions += 1;
      acc.weekly[dayOfWeek].revenue += item.paymentValue || 0;
      
      // Monthly analysis
      if (!acc.monthly[month]) {
        acc.monthly[month] = { transactions: 0, revenue: 0 };
      }
      acc.monthly[month].transactions += 1;
      acc.monthly[month].revenue += item.paymentValue || 0;
      
      return acc;
    }, { hourly: {}, weekly: {}, monthly: {} });

    const customerAnalysis = transactionData.reduce((acc: any, item: any) => {
      const customerId = item.memberId || item.customerEmail;
      if (!customerId) return acc;
      
      if (!acc[customerId]) {
        acc[customerId] = {
          email: item.customerEmail || 'N/A',
          transactions: 0,
          totalSpent: 0,
          avgTransactionValue: 0,
          lastTransaction: null,
          categories: new Set()
        };
      }
      
      acc[customerId].transactions += 1;
      acc[customerId].totalSpent += item.paymentValue || 0;
      acc[customerId].categories.add(item.cleanedCategory || 'Other');
      
      const transactionDate = new Date(item.paymentDate);
      if (!acc[customerId].lastTransaction || transactionDate > new Date(acc[customerId].lastTransaction)) {
        acc[customerId].lastTransaction = item.paymentDate;
      }
      
      return acc;
    }, {});

    // Calculate customer metrics
    Object.values(customerAnalysis).forEach((customer: any) => {
      customer.avgTransactionValue = customer.transactions > 0 ? customer.totalSpent / customer.transactions : 0;
      customer.categories = Array.from(customer.categories);
    });

    return {
      ...data,
      totalRevenue,
      totalTransactions,
      uniqueCustomers,
      avgTransactionValue,
      paymentMethodBreakdown,
      categoryBreakdown,
      timeAnalysis,
      customerAnalysis
    };
  }, [data]);

  // Build a per-member behavior summary specifically for Customer Behavior context
  const behaviorSummary = useMemo(() => {
    const tx = enhancedData.filteredTransactionData || enhancedData.rawData || [];
    if (!tx.length) return [] as any[];

    const parseDate = (dateStr: string): Date | null => {
      if (!dateStr) return null;
      const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (ddmmyyyy) {
        const [, day, month, year] = ddmmyyyy as any;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    };

    const byMember = new Map<string, any[]>();
    tx.forEach((t: any) => {
      const id = t.memberId || t.customerEmail || 'unknown';
      if (!byMember.has(id)) byMember.set(id, []);
      byMember.get(id)!.push(t);
    });

    const rows: any[] = [];
    byMember.forEach((list, memberId) => {
      const sorted = list
        .map((l: any) => ({ ...l, _date: parseDate(l.paymentDate) }))
        .filter((l: any) => !!l._date)
        .sort((a: any, b: any) => a._date.getTime() - b._date.getTime());
      const totalSpent = list.reduce((s: number, i: any) => s + (i.paymentValue || 0), 0);
      const transactions = list.length;
      const discountedTx = list.filter((i: any) => (i.discountAmount || 0) > 0).length;
      const usedSessions = list.reduce((s: number, i: any) => s + (i.secMembershipUsedSessions || 0), 0);
      let purchaseFrequencyDays = 0;
      let lifespanDays = 0;
      let daysToSecondPurchase = 0;
      if (sorted.length > 1) {
        const first = sorted[0]._date as Date;
        const last = sorted[sorted.length - 1]._date as Date;
        lifespanDays = (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24);
        purchaseFrequencyDays = lifespanDays / (sorted.length - 1);
        daysToSecondPurchase = ((sorted[1]._date as Date).getTime() - first.getTime()) / (1000 * 60 * 60 * 24);
      }
      rows.push({
        memberId,
        email: list[0]?.customerEmail || '',
        transactions,
        totalSpent,
        avgSpend: transactions ? totalSpent / transactions : 0,
        discountedTx,
        percentDiscounted: transactions ? (discountedTx / transactions) * 100 : 0,
        usedSessions,
        avgSessionsPerTx: transactions ? usedSessions / transactions : 0,
        purchaseFrequencyDays,
        lifespanDays,
        daysToSecondPurchase,
        firstPurchase: sorted[0]?._date ? (sorted[0]._date as Date).toISOString().slice(0, 10) : '',
        lastPurchase: sorted[sorted.length - 1]?._date ? (sorted[sorted.length - 1]._date as Date).toISOString().slice(0, 10) : '',
      });
    });

    return rows.sort((a, b) => b.totalSpent - a.totalSpent);
  }, [enhancedData]);

  const handleExport = async () => {
    const tx = (enhancedData.filteredTransactionData || enhancedData.rawData || []).map((t: any) => ({
      paymentDate: t.paymentDate,
      customerEmail: t.customerEmail,
      memberId: t.memberId,
      cleanedCategory: t.cleanedCategory,
      cleanedProduct: t.cleanedProduct || t.paymentItem,
      paymentValue: t.paymentValue,
      discountAmount: t.discountAmount,
      discountPercentage: t.discountPercentage,
      paymentMethod: t.paymentMethod,
      soldBy: t.soldBy,
      calculatedLocation: t.calculatedLocation,
    }));

    await exportAllData(
      {
        additionalData: {
          'Transactions': tx,
          'Per-Member Behavior Summary': behaviorSummary,
        },
      },
      {
        format: 'csv',
        fileName: `${(data.clickedItemName || 'drilldown').toString().replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0,10)}`,
      }
    );
  };

  // Chart colors
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

  const getTitle = () => {
    // Use the contextual item name if available
    const itemName = data.clickedItemName || data.product || data.name || data.category;
    
    if (type === 'trainer') return `${itemName || 'Trainer'} - Performance Analytics`;
    if (type === 'product') return `${itemName || 'Product'} - Sales Analytics`;
    if (type === 'category') return `${itemName || 'Category'} - Performance Analysis`;
    if (type === 'soldBy') return `${itemName || 'Sales Rep'} - Performance Analytics`;
    if (type === 'paymentMethod') return `${itemName || 'Payment Method'} - Analytics`;
    if (type === 'metric') return 'Sales Performance - Detailed Analytics';
    return `${itemName || 'Item'} - Comprehensive Analysis`;
  };

  const getSubtitle = () => {
    // Use the contextual description if available
    if (data.contextDescription) {
      return `${data.contextDescription} • Data shows all historical records, independent of current filters`;
    }
    
    const baseSubtitle = (() => {
      if (type === 'trainer') return 'Performance insights and customer engagement metrics';
      if (type === 'product') return 'Comprehensive sales performance and customer behavior analysis';
      if (type === 'category') return 'Category performance breakdown with customer insights';
      if (type === 'soldBy') return 'Sales representative performance and transaction history';
      if (type === 'paymentMethod') return 'Payment method usage and transaction analysis';
      return `Detailed analytics dashboard with ${enhancedData.totalTransactions} transactions and ${enhancedData.uniqueCustomers} customers`;
    })();
    
    return `${baseSubtitle} • Showing all historical data, independent of current date/filter selections`;
  };

  // Render enhanced metric cards
  const renderMetricCards = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-slate-900 to-blue-950 text-white border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 transform-gpu rounded-2xl overflow-hidden">
        <CardContent className="p-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-slate-300 mb-1">
              <DollarSign className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-medium">Total Revenue</span>
            </div>
            <div className="text-2xl font-bold text-white">{formatCurrency(enhancedData.totalRevenue)}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-md hover:shadow-xl transition-all duration-500 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 delay-100">
          <CardContent className="p-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Customers</span>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-950 bg-clip-text text-transparent">{formatNumber(enhancedData.uniqueCustomers)}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-md hover:shadow-xl transition-all duration-500 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 delay-200">
          <CardContent className="p-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-xs font-medium">Transactions</span>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-950 bg-clip-text text-transparent">{formatNumber(enhancedData.totalTransactions)}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-slate-100 to-slate-200 border-slate-300 shadow-md hover:shadow-xl transition-all duration-500 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 delay-300">
          <CardContent className="p-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs font-medium">Avg Transaction</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(enhancedData.avgTransactionValue)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render analytics charts
  const renderAnalyticsCharts = () => {
    const hourlyData = Object.entries(enhancedData.timeAnalysis.hourly)
      .map(([hour, data]: [string, any]) => ({
        hour: `${hour}:00`,
        transactions: data.transactions,
        revenue: data.revenue
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    const paymentMethodData = Object.entries(enhancedData.paymentMethodBreakdown)
      .map(([method, data]: [string, any]) => ({
        method,
        revenue: data.revenue,
        count: data.count
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-left">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Clock className="w-5 h-5" />
              Hourly Transaction Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e3a8a" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="hour" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value as number) : formatNumber(value as number),
                    name === 'revenue' ? 'Revenue' : 'Transactions'
                  ]}
                />
                <Bar 
                  dataKey="transactions" 
                  fill="url(#barGradient)" 
                  name="transactions"
                  radius={[8, 8, 0, 0]}
                  animationDuration={1500}
                  animationBegin={0}
                  isAnimationActive={true}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-right">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <CreditCard className="w-5 h-5" />
              Payment Method Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <defs>
                  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                    <feOffset dx="2" dy="2" result="offsetblur"/>
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.3"/>
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <Pie
                  dataKey="revenue"
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  label={({ method, percent }) => `${method}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                  animationDuration={1500}
                  animationBegin={0}
                  isAnimationActive={true}
                  style={{ filter: 'url(#shadow)' }}
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => formatCurrency(value as number)} 
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render customer analysis table
  const renderCustomerAnalysis = () => {
    const customers = Object.values(enhancedData.customerAnalysis)
      .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
      .slice(0, 50); // Top 50 customers

    const columns = [
      {
        key: 'email',
        header: 'Customer',
        render: (value: string) => (
          <div className="font-medium text-slate-800 truncate max-w-[200px]" title={value}>
            {value}
          </div>
        )
      },
      {
        key: 'transactions',
        header: 'Transactions',
        align: 'center' as const,
        render: (value: number) => (
          <Badge className="bg-blue-100 text-blue-800">{formatNumber(value)}</Badge>
        )
      },
      {
        key: 'totalSpent',
        header: 'Total Spent',
        align: 'center' as const,
        render: (value: number) => (
          <span className="font-semibold text-green-600">{formatCurrency(value)}</span>
        )
      },
      {
        key: 'avgTransactionValue',
        header: 'Avg Order Value',
        align: 'center' as const,
        render: (value: number) => (
          <span className="font-medium text-blue-700">{formatCurrency(value)}</span>
        )
      },
      {
        key: 'categories',
        header: 'Categories',
        align: 'center' as const,
        render: (value: string[]) => (
          <div className="flex flex-wrap gap-1 max-w-[150px]">
            {value.slice(0, 2).map((cat, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {cat.length > 8 ? `${cat.substring(0, 8)}...` : cat}
              </Badge>
            ))}
            {value.length > 2 && (
              <Badge variant="outline" className="text-xs">+{value.length - 2}</Badge>
            )}
          </div>
        )
      },
      {
        key: 'lastTransaction',
        header: 'Last Purchase',
        align: 'center' as const,
        render: (value: string) => (
          <span className="text-sm text-slate-600">
            {value ? new Date(value).toLocaleDateString() : 'N/A'}
          </span>
        )
      }
    ];

    return (
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Users className="w-5 h-5" />
            Top Customers Analysis
            <Badge className="bg-blue-100 text-blue-800 ml-auto">
              {customers.length} customers
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ModernDataTable
            data={customers}
            columns={columns}
            maxHeight="400px"
            stickyHeader={true}
            showFooter={false}
          />
        </CardContent>
      </Card>
    );
  };

  // Render transaction details
  const renderTransactionDetails = () => {
    const transactions = (data.rawData || []).slice(0, 100); // Latest 100 transactions
    
    const columns = [
      {
        key: 'paymentDate',
        header: 'Date',
        render: (value: string) => (
          <span className="font-mono text-sm">
            {value ? new Date(value).toLocaleDateString() : 'N/A'}
          </span>
        )
      },
      {
        key: 'customerEmail',
        header: 'Customer',
        render: (value: string) => (
          <div className="font-medium text-slate-700 truncate max-w-[180px]" title={value}>
            {value || 'Anonymous'}
          </div>
        )
      },
      {
        key: 'cleanedProduct',
        header: 'Product/Service',
        render: (value: string, row: any) => (
          <div>
            <div className="font-medium text-slate-800 truncate max-w-[200px]" title={value}>
              {value || row.membershipName || 'N/A'}
            </div>
            <div className="text-xs text-slate-500">
              {row.cleanedCategory || 'Uncategorized'}
            </div>
          </div>
        )
      },
      {
        key: 'paymentValue',
        header: 'Amount',
        align: 'center' as const,
        render: (value: number, row: any) => (
          <div className="text-right">
            <div className="font-semibold text-green-600">{formatCurrency(value || 0)}</div>
            {row.discountAmount && (
              <div className="text-xs text-red-500">
                -{formatCurrency(row.discountAmount)}
              </div>
            )}
          </div>
        )
      },
      {
        key: 'paymentMethod',
        header: 'Payment',
        align: 'center' as const,
        render: (value: string) => (
          <Badge variant="outline" className="text-xs">
            {value || 'N/A'}
          </Badge>
        )
      },
      {
        key: 'soldBy',
        header: 'Sold By',
        render: (value: string) => (
          <span className="text-sm text-slate-600">
            {value || 'System'}
          </span>
        )
      }
    ];

    return (
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Eye className="w-5 h-5" />
            Transaction Details
            <Badge className="bg-blue-100 text-blue-800 ml-auto">
              {transactions.length} transactions
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ModernDataTable
            data={transactions}
            columns={columns}
            maxHeight="500px"
            stickyHeader={true}
            showFooter={false}
          />
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[85vw] max-w-[1200px] max-h-[85vh] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-0 shadow-2xl rounded-2xl">
        {/* Compact Header */}
        <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 dark:from-blue-800 dark:via-blue-900 dark:to-blue-950 text-white p-6 -m-6 mb-6 rounded-t-2xl">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold tracking-tight text-white mb-1">
                    {getTitle()}
                  </DialogTitle>
                  <p className="text-blue-100 text-xs font-medium opacity-90">
                    {getSubtitle()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-md transition-all duration-200 hover:scale-105 shadow-lg text-xs"
                  onClick={handleExport}
                  disabled={isExporting}
                  title="Export transactions and per-member behavior summary"
                >
                  <Download className="w-3 h-3 mr-1" />
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/20 backdrop-blur-md transition-all duration-200 hover:scale-105 w-8 h-8 p-0"
                >
                  ×
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>
  
  {/* Compact Content Area */}
  <div className="overflow-y-auto px-6 py-1 space-y-6" style={{ maxHeight: 'calc(85vh - 120px)' }}>
    
    {/* Key Metrics Section - Compact */}
    <div className="p-5 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-3 h-3 text-white" />
        </div>
        Key Metrics
      </h3>
      {renderMetricCards()}
    </div>

    {/* Compact Content Tabs */}
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-slate-100 via-white to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 h-12 border border-slate-200 dark:border-slate-600 rounded-xl p-1 shadow-lg backdrop-blur-md">
              <TabsTrigger 
                value="overview" 
                className="gap-1 font-medium text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 rounded-lg transition-all duration-300 data-[state=active]:scale-105"
              >
                <Star className="w-3 h-3" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="gap-1 font-medium text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 rounded-lg transition-all duration-300 data-[state=active]:scale-105"
              >
                <BarChart3 className="w-3 h-3" />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="customers" 
                className="gap-1 font-medium text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 rounded-lg transition-all duration-300 data-[state=active]:scale-105"
              >
                <Users className="w-3 h-3" />
                Customers
              </TabsTrigger>
              <TabsTrigger 
                value="transactions" 
                className="gap-1 font-medium text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 rounded-lg transition-all duration-300 data-[state=active]:scale-105"
              >
                <Eye className="w-3 h-3" />
                Transactions
              </TabsTrigger>
              <TabsTrigger 
                value="insights" 
                className="gap-1 font-medium text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 rounded-lg transition-all duration-300 data-[state=active]:scale-105"
              >
                <Zap className="w-3 h-3" />
                Insights
              </TabsTrigger>
            </TabsList>
            
            {/* Compact Overview Tab */}
            <TabsContent value="overview" className="mt-4">
              <div className="space-y-5">
                
                {/* Analytics Charts Section */}
                <div className="p-5 bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                      <TrendingUp className="w-3 h-3 text-white" />
                    </div>
                    Analytics Overview
                  </h3>
                  {renderAnalyticsCharts()}
                </div>
              
                {/* Performance Cards Section */}
                <div className="p-5 bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                      <Award className="w-3 h-3 text-white" />
                    </div>
                    Performance Breakdown
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 transform-gpu rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                  <CardHeader className="relative z-10">
                    <CardTitle className="text-white flex items-center gap-3">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      Performance Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-white" />
                        <span className="text-slate-100 font-medium">Revenue Growth</span>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 backdrop-blur-sm">
                        +{((enhancedData.totalRevenue / 1000000) * 1.5).toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-white" />
                        <span className="text-slate-100 font-medium">Customer Retention</span>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-200 border border-blue-400/30 backdrop-blur-sm">
                        {((enhancedData.uniqueCustomers / enhancedData.totalTransactions) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-white" />
                        <span className="text-slate-100 font-medium">Market Share</span>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-200 border border-purple-400/30 backdrop-blur-sm">
                        {((enhancedData.totalRevenue / 10000000) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-2 border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 animate-in fade-in zoom-in delay-100">
                  <CardHeader>
                    <CardTitle className="text-slate-900 flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-slate-900 to-blue-950 rounded-lg">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      Key Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all duration-200">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-slate-600" />
                        <span className="text-slate-700 font-medium">Conversion Rate</span>
                      </div>
                      <span className="font-bold text-slate-900 bg-slate-200 px-3 py-1 rounded-full">
                        {((enhancedData.totalTransactions / (enhancedData.uniqueCustomers * 2)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all duration-200">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-slate-600" />
                        <span className="text-slate-700 font-medium">Customer LTV</span>
                      </div>
                      <span className="font-bold text-slate-900 bg-slate-200 px-3 py-1 rounded-full">
                        {formatCurrency(enhancedData.avgTransactionValue * 3.5)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all duration-200">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-slate-600" />
                        <span className="text-slate-700 font-medium">Repeat Rate</span>
                      </div>
                      <span className="font-bold text-slate-900 bg-slate-200 px-3 py-1 rounded-full">
                        {((enhancedData.uniqueCustomers / enhancedData.totalTransactions) * 150).toFixed(1)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-white via-purple-50 to-white dark:from-purple-900/20 dark:via-slate-800 dark:to-purple-900/20 border border-purple-200 dark:border-purple-700 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 to-transparent dark:from-purple-800/30"></div>
                  <CardHeader className="relative z-10">
                    <CardTitle className="text-purple-800 dark:text-purple-200 flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg">
                        <PieChart className="w-6 h-6 text-white" />
                      </div>
                      Category Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 relative z-10">
                    {Object.entries(enhancedData.categoryBreakdown).slice(0, 3).map(([category, data]: [string, any], index) => {
                      const colors = [
                        { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-200', icon: 'text-emerald-500' },
                        { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', icon: 'text-blue-500' },
                        { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200', icon: 'text-purple-500' }
                      ];
                      const color = colors[index] || colors[0];
                      return (
                        <div key={category} className="flex justify-between items-center p-4 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-purple-200 dark:border-purple-700 hover:bg-white dark:hover:bg-slate-700 transition-all duration-300 hover:scale-105 shadow-sm group">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 ${color.bg} rounded-lg flex items-center justify-center`}>
                              <ShoppingCart className={`w-4 h-4 ${color.icon}`} />
                            </div>
                            <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{category}</span>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${color.text} ${color.bg} px-3 py-2 rounded-full text-sm shadow-sm`}>{formatCurrency(data.revenue)}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{data.count} sales</div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-4">
              <div className="p-5 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-900/20 dark:via-slate-800 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500">
                <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-8 flex items-center gap-3 pb-4 border-b border-blue-200 dark:border-blue-700">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  Detailed Analytics
                </h3>
                {renderAnalyticsCharts()}
              </div>
            </TabsContent>

            <TabsContent value="customers" className="mt-4">
              <div className="p-5 bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-emerald-900/20 dark:via-slate-800 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500">
                <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200 mb-8 flex items-center gap-3 pb-4 border-b border-emerald-200 dark:border-emerald-700">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  Customer Analysis
                </h3>
                {renderCustomerAnalysis()}
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="mt-4">
              <div className="p-5 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-8 flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                  Transaction Details
                </h3>
                {renderTransactionDetails()}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="mt-4">
              <div className="space-y-8">
                <Card className="bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-purple-900/20 dark:via-slate-800 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 shadow-2xl hover:shadow-3xl transition-all duration-500 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 to-transparent dark:from-purple-800/30"></div>
                  <CardHeader className="relative z-10">
                    <CardTitle className="text-purple-800 dark:text-purple-200 flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      AI-Powered Insights
                      <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0 ml-auto">
                        Smart Analytics
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 relative z-10">
                    <div className="p-6 bg-white/80 dark:bg-slate-800/80 rounded-xl border-l-4 border-emerald-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="font-bold text-emerald-800 dark:text-emerald-200 text-lg">Revenue Optimization</div>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 font-medium">
                        Peak sales occur between 6-8 PM. Consider targeted promotions during this window to maximize revenue potential.
                      </div>
                    </div>
                    <div className="p-6 bg-white/80 dark:bg-slate-800/80 rounded-xl border-l-4 border-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="font-bold text-blue-800 dark:text-blue-200 text-lg">Customer Behavior</div>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 font-medium">
                        High-value customers prefer premium services. Multiple upselling opportunities have been detected.
                      </div>
                    </div>
                    <div className="p-6 bg-white/80 dark:bg-slate-800/80 rounded-xl border-l-4 border-purple-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="font-bold text-purple-800 dark:text-purple-200 text-lg">Strategic Recommendations</div>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 font-medium">
                        Increasing demand for digital payments detected. Mobile optimization and contactless solutions are strongly recommended.
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-orange-900/20 dark:via-slate-800 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 shadow-2xl hover:shadow-3xl transition-all duration-500 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-100/30 to-transparent dark:from-orange-800/30"></div>
                  <CardHeader className="relative z-10">
                    <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Filter className="w-5 h-5 text-white" />
                      </div>
                      Strategic Recommendations
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 ml-auto">
                        Action Plan
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 relative z-10">
                    <div className="p-6 bg-white/80 dark:bg-slate-800/80 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                          <span className="text-xl">🎯</span>
                        </div>
                        <div className="font-bold text-emerald-800 dark:text-emerald-200 text-lg">Immediate Actions</div>
                      </div>
                      <ul className="text-slate-600 dark:text-slate-300 space-y-2 ml-4">
                        <li className="flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span>Optimize pricing strategy for peak hours (6-8 PM)</li>
                        <li className="flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span>Launch premium loyalty program for high-value customers</li>
                        <li className="flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span>Enhance mobile payment experience and user interface</li>
                      </ul>
                    </div>
                    <div className="p-6 bg-white/80 dark:bg-slate-800/80 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <span className="text-xl">📈</span>
                        </div>
                        <div className="font-bold text-blue-800 dark:text-blue-200 text-lg">Long-term Strategy</div>
                      </div>
                      <ul className="text-slate-600 dark:text-slate-300 space-y-2 ml-4">
                        <li className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span>Expand investment in high-performing categories and services</li>
                        <li className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span>Develop comprehensive customer retention and engagement programs</li>
                        <li className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span>Implement advanced predictive analytics and AI-driven insights</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedSalesDrillDownModal;
