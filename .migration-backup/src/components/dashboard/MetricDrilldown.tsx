import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Calendar, BarChart3, LineChart } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface MetricDrilldownProps {
  isOpen: boolean;
  onClose: () => void;
  metric: {
    title: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
    description: string;
    rawValue: number;
    icon: any;
    color: string;
  } | null;
  data?: {
    sales: any[];
    sessions: any[];
    leads: any[];
    newClients: any[];
  };
}

export const MetricDrilldown: React.FC<MetricDrilldownProps> = ({
  isOpen,
  onClose,
  metric,
  data
}) => {
  if (!metric) return null;

  // Generate trend data for the last 6 months
  const generateTrendData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      // Simulate trend data based on current value and change
      const baseValue = metric.rawValue;
      const variance = baseValue * 0.15;
      const value = baseValue + (Math.random() - 0.5) * variance;
      
      months.push({
        month: monthName,
        value: Math.max(0, value),
        formattedValue: metric.title.includes('$') || metric.title.includes('Revenue') || metric.title.includes('Transaction') || metric.title.includes('VAT') || metric.title.includes('Discount Amount')
          ? formatCurrency(value)
          : metric.title.includes('%') || metric.title.includes('Rate') || metric.title.includes('Conversion') || metric.title.includes('Utilization')
          ? `${value.toFixed(1)}%`
          : formatNumber(Math.round(value))
      });
    }
    return months;
  };

  const trendData = generateTrendData();

  // Calculate additional insights
  const getInsights = () => {
    const insights = [];
    
    if (metric.changeType === 'positive') {
      insights.push({
        type: 'success',
        text: `${metric.change} improvement from last month`,
        icon: TrendingUp
      });
    } else if (metric.changeType === 'negative') {
      insights.push({
        type: 'warning',
        text: `${metric.change} decrease from last month`,
        icon: TrendingDown
      });
    } else {
      insights.push({
        type: 'neutral',
        text: 'Stable performance from last month',
        icon: Calendar
      });
    }

    // Add metric-specific insights
    if (metric.title === 'Total Revenue' || metric.title === 'Net Revenue') {
      insights.push({
        type: 'info',
        text: `Average daily revenue: ${formatCurrency(metric.rawValue / 30)}`,
        icon: BarChart3
      });
    } else if (metric.title === 'Session Attendance') {
      insights.push({
        type: 'info',
        text: `${data?.sessions.length || 0} total sessions held`,
        icon: Calendar
      });
    } else if (metric.title === 'Lead Conversion') {
      insights.push({
        type: 'info',
        text: `${data?.leads.filter(l => l.conversionStatus === 'Converted').length || 0} leads converted`,
        icon: TrendingUp
      });
    } else if (metric.title === 'New Clients') {
      insights.push({
        type: 'info',
        text: `Growing customer base`,
        icon: TrendingUp
      });
    }

    return insights;
  };

  const insights = getInsights();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-2">
            <div className={`w-14 h-14 bg-gradient-to-r ${metric.color} rounded-xl flex items-center justify-center shadow-lg`}>
              <metric.icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">{metric.title}</DialogTitle>
              <DialogDescription className="text-base">
                {metric.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Current Value Card */}
          <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Current Value</p>
                  <p className="text-4xl font-bold text-slate-900">{metric.value}</p>
                </div>
                <Badge className={`${
                  metric.changeType === 'positive' 
                    ? 'bg-green-100 text-green-700' 
                    : metric.changeType === 'negative'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                } px-4 py-2 text-lg font-semibold`}>
                  {metric.changeType === 'positive' ? (
                    <TrendingUp className="w-5 h-5 mr-1" />
                  ) : metric.changeType === 'negative' ? (
                    <TrendingDown className="w-5 h-5 mr-1" />
                  ) : null}
                  {metric.change}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, idx) => (
              <Card key={idx} className={`border-l-4 ${
                insight.type === 'success' ? 'border-l-green-500 bg-green-50/50' :
                insight.type === 'warning' ? 'border-l-orange-500 bg-orange-50/50' :
                insight.type === 'info' ? 'border-l-blue-500 bg-blue-50/50' :
                'border-l-gray-500 bg-gray-50/50'
              }`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <insight.icon className={`w-5 h-5 ${
                    insight.type === 'success' ? 'text-green-600' :
                    insight.type === 'warning' ? 'text-orange-600' :
                    insight.type === 'info' ? 'text-blue-600' :
                    'text-gray-600'
                  }`} />
                  <span className="text-sm font-medium text-slate-700">{insight.text}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 6-Month Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                6-Month Trend Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value: any) => {
                      if (metric.title.includes('$') || metric.title.includes('Revenue') || metric.title.includes('Transaction') || metric.title.includes('VAT') || metric.title.includes('Discount Amount')) {
                        return formatCurrency(value);
                      } else if (metric.title.includes('%') || metric.title.includes('Rate') || metric.title.includes('Conversion') || metric.title.includes('Utilization')) {
                        return `${Number(value).toFixed(1)}%`;
                      }
                      return formatNumber(Math.round(value));
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={metric.changeType === 'positive' ? '#10b981' : metric.changeType === 'negative' ? '#ef4444' : '#64748b'}
                    strokeWidth={3}
                    dot={{ fill: metric.changeType === 'positive' ? '#10b981' : metric.changeType === 'negative' ? '#ef4444' : '#64748b', r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Comparison Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Monthly Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value: any) => {
                      if (metric.title.includes('$') || metric.title.includes('Revenue') || metric.title.includes('Transaction') || metric.title.includes('VAT') || metric.title.includes('Discount Amount')) {
                        return formatCurrency(value);
                      } else if (metric.title.includes('%') || metric.title.includes('Rate') || metric.title.includes('Conversion') || metric.title.includes('Utilization')) {
                        return `${Number(value).toFixed(1)}%`;
                      }
                      return formatNumber(Math.round(value));
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill={metric.changeType === 'positive' ? '#10b981' : metric.changeType === 'negative' ? '#ef4444' : '#64748b'}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
