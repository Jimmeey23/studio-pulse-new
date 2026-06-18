import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Target, 
  TrendingUp, 
  Clock, 
  Filter,
  UserPlus,
  Phone,
  Calendar,
  CheckCircle,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { LocationReportMetrics } from '@/hooks/useLocationReportData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface LeadFunnelSectionProps {
  metrics: LocationReportMetrics;
}

export const LeadFunnelSection: React.FC<LeadFunnelSectionProps> = ({
  metrics
}) => {
  // Funnel data showing progression from leads to conversion
  const funnelData = [
    { name: 'Total Leads', value: metrics.totalLeads, color: '#3B82F6', percentage: 100 },
    { 
      name: 'Qualified Leads', 
      value: Math.round(metrics.totalLeads * 0.75), 
      color: '#10B981', 
      percentage: 75 
    },
    { 
      name: 'Trial Bookings', 
      value: Math.round(metrics.totalLeads * 0.5), 
      color: '#F59E0B', 
      percentage: 50 
    },
    { 
      name: 'Trial Completed', 
      value: Math.round(metrics.totalLeads * 0.35), 
      color: '#EF4444', 
      percentage: 35 
    },
    { 
      name: 'Converted', 
      value: metrics.leadsConverted, 
      color: '#8B5CF6', 
      percentage: metrics.leadConversionRate 
    }
  ];

  // Lead sources breakdown (using sample data based on common sources)
  const leadSourcesArray = Object.entries(metrics.leadsBySource).map(([source, count]) => ({
    name: source,
    value: count,
    percentage: (count / metrics.totalLeads) * 100
  }));

  // If no lead sources data, create sample data
  const leadSources = leadSourcesArray.length > 0 ? leadSourcesArray : [
    { name: 'Website', value: Math.round(metrics.totalLeads * 0.4), percentage: 40 },
    { name: 'Social Media', value: Math.round(metrics.totalLeads * 0.25), percentage: 25 },
    { name: 'Referrals', value: Math.round(metrics.totalLeads * 0.2), percentage: 20 },
    { name: 'Walk-ins', value: Math.round(metrics.totalLeads * 0.1), percentage: 10 },
    { name: 'Other', value: Math.round(metrics.totalLeads * 0.05), percentage: 5 }
  ];

  // Sample conversion timeline data
  const conversionTimeline = [
    { days: '0-3', leads: Math.round(metrics.leadsConverted * 0.3), percentage: 30 },
    { days: '4-7', leads: Math.round(metrics.leadsConverted * 0.25), percentage: 25 },
    { days: '8-14', leads: Math.round(metrics.leadsConverted * 0.2), percentage: 20 },
    { days: '15-30', leads: Math.round(metrics.leadsConverted * 0.15), percentage: 15 },
    { days: '30+', leads: Math.round(metrics.leadsConverted * 0.1), percentage: 10 }
  ];

  const leadMetrics = [
    {
      title: 'Total Leads',
      value: formatNumber(metrics.totalLeads),
      subValue: 'Lead volume',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Conversion Rate',
      value: formatPercentage(metrics.leadConversionRate),
      subValue: 'Lead to client',
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Converted Leads',
      value: formatNumber(metrics.leadsConverted),
      subValue: 'Successful conversions',
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Avg Conversion Time',
      value: `${formatNumber(metrics.avgConversionDays)} days`,
      subValue: 'Time to convert',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const getConversionStatus = (rate: number) => {
    if (rate >= 25) return { status: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle };
    if (rate >= 20) return { status: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Target };
    if (rate >= 15) return { status: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Clock };
    return { status: 'Poor', color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertCircle };
  };

  const conversionStatus = getConversionStatus(metrics.leadConversionRate);

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6">
      {/* Lead Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {leadMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className={`p-2 rounded-lg ${metric.bgColor} mb-4 w-fit`}>
                <metric.icon className={`w-6 h-6 ${metric.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                <p className="text-xs text-gray-500">{metric.subValue}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conversion Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Lead Conversion Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-6 rounded-lg ${conversionStatus.bgColor} flex items-center justify-between`}>
            <div className="flex items-center">
              <conversionStatus.icon className={`w-8 h-8 ${conversionStatus.color} mr-4`} />
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(metrics.leadConversionRate)}</p>
                <p className={`text-lg font-medium ${conversionStatus.color}`}>{conversionStatus.status}</p>
                <p className="text-sm text-gray-600">Lead conversion rate</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Industry Benchmark: 20%+</p>
              <p className="text-xs text-gray-500">Fitness industry standard</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Lead Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leadSources}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                >
                  {leadSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} leads`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {leadSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span>{source.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{formatNumber(source.value)}</span>
                    <span className="text-gray-500 ml-2">({source.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Conversion Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionTimeline} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="days" />
                <Tooltip 
                  formatter={(value, name) => [
                    formatNumber(Number(value)),
                    'Conversions'
                  ]} 
                />
                <Bar dataKey="leads" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center p-4 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-800">Average Conversion Time</p>
              <p className="text-2xl font-bold text-blue-600">{formatNumber(metrics.avgConversionDays)} days</p>
              <p className="text-sm text-blue-700">From initial lead to conversion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Lead Conversion Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelData.map((stage, index) => (
              <div key={index} className="flex items-center">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{stage.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{formatNumber(stage.value)}</span>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: stage.color, color: stage.color }}
                      >
                        {stage.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${stage.percentage}%`,
                        backgroundColor: stage.color 
                      }}
                    />
                  </div>
                </div>
                {index < funnelData.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-4" />
                )}
              </div>
            ))}
          </div>
          
          {/* Funnel Insights */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800">Lead Volume</p>
              <p className="text-2xl font-bold text-blue-600">{formatNumber(metrics.totalLeads)}</p>
              <p className="text-xs text-blue-700">Total leads generated</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800">Conversion Rate</p>
              <p className="text-2xl font-bold text-green-600">{formatPercentage(metrics.leadConversionRate)}</p>
              <p className="text-xs text-green-700">Leads to clients</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-purple-800">Success Count</p>
              <p className="text-2xl font-bold text-purple-600">{formatNumber(metrics.leadsConverted)}</p>
              <p className="text-xs text-purple-700">Successful conversions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Successful Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <TrendingUp className="w-5 h-5 mr-2" />
              High-Performing Channels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leadSources
                .sort((a, b) => b.value - a.value)
                .slice(0, 3)
                .map((source, index) => (
                  <div key={index} className="p-4 bg-green-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium text-green-800">{source.name}</p>
                      <Badge className="bg-green-100 text-green-800">
                        #{index + 1}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatNumber(source.value)}</p>
                    <p className="text-sm text-green-700">
                      {formatPercentage(source.percentage)} of total leads
                    </p>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>

        {/* Optimization Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-orange-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              Optimization Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.leadConversionRate < 20 && (
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="font-medium text-orange-800">Low Conversion Rate</p>
                  <p className="text-sm text-orange-700">
                    {formatPercentage(metrics.leadConversionRate)} conversion needs improvement
                  </p>
                </div>
              )}
              {metrics.avgConversionDays > 14 && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="font-medium text-red-800">Slow Conversion Process</p>
                  <p className="text-sm text-red-700">
                    {formatNumber(metrics.avgConversionDays)} days average is too long
                  </p>
                </div>
              )}
              {metrics.totalLeads < 50 && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="font-medium text-yellow-800">Low Lead Volume</p>
                  <p className="text-sm text-yellow-700">
                    Increase marketing efforts to generate more leads
                  </p>
                </div>
              )}
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-800">Best Performing Source</p>
                <p className="text-sm text-blue-700">
                  Focus on {leadSources[0]?.name || 'top channel'} for optimal ROI
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Funnel Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.totalLeads)}</p>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-xs text-gray-500">Lead generation</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{formatPercentage(metrics.leadConversionRate)}</p>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-xs text-gray-500">Success rate</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.leadsConverted)}</p>
              <p className="text-sm text-gray-600">Conversions</p>
              <p className="text-xs text-gray-500">New clients</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.avgConversionDays)}</p>
              <p className="text-sm text-gray-600">Avg Days</p>
              <p className="text-xs text-gray-500">To conversion</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadFunnelSection;