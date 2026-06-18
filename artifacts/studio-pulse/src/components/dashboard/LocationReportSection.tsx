import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Users, 
  Target, 
  BarChart3, 
  Calendar, 
  Activity,
  UserCheck,
  ShoppingCart,
  TrendingDown,
  Percent,
  Clock,
  Building2,
  Award,
  AlertCircle,
  CheckCircle,
  Lightbulb
} from 'lucide-react';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { LocationReportData, LocationReportMetrics } from '@/hooks/useLocationReportData';
import { RevenuePerformanceSection } from './RevenuePerformanceSection';
import { SessionPerformanceSection } from './SessionPerformanceSection';
import { LocationTrainerPerformanceSection } from './LocationTrainerPerformanceSection';
import { ClientRetentionSection } from './ClientRetentionSection';
import { LeadFunnelSection } from './LeadFunnelSection';

interface LocationReportSectionProps {
  data: LocationReportData | null;
  metrics: LocationReportMetrics | null;
  isLoading: boolean;
}

export const LocationReportSection: React.FC<LocationReportSectionProps> = ({
  data,
  metrics,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <BrandSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading report data...</span>
      </div>
    );
  }

  if (!data || !metrics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">
            Please select a location and date range to generate the report.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Key metrics for overview cards
  const overviewMetrics = [
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue),
      change: metrics.revenueGrowth,
      icon: TrendingUp,
      description: 'Gross revenue generated during the period'
    },
    {
      title: 'Session Fill Rate',
      value: formatPercentage(metrics.fillRate),
      change: 0, // TODO: Add historical comparison
      icon: Activity,
      description: 'Average class capacity utilization'
    },
    {
      title: 'Client Retention',
      value: formatPercentage(metrics.retentionRate),
      change: 0, // TODO: Add historical comparison
      icon: UserCheck,
      description: 'Client retention rate during the period'
    },
    {
      title: 'Conversion Rate',
      value: formatPercentage(metrics.conversionRate),
      change: 0, // TODO: Add historical comparison
      icon: Target,
      description: 'Lead to client conversion rate'
    },
    {
      title: 'New Clients',
      value: formatNumber(metrics.newClientsAcquired),
      change: 0, // TODO: Add historical comparison
      icon: Users,
      description: 'New clients acquired during the period'
    },
    {
      title: 'Total Sessions',
      value: formatNumber(metrics.totalSessions),
      change: 0, // TODO: Add historical comparison
      icon: Calendar,
      description: 'Total classes conducted during the period'
    }
  ];

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  const getTrendColor = (change: number) => {
    if (change > 5) return 'text-green-600';
    if (change < -5) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-8">
      {/* Report Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Location Performance Summary</CardTitle>
              <p className="text-gray-600 mt-2">
                {data.location} • {data.reportPeriod.monthName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Overall Performance Score</p>
                <p className="text-3xl font-bold text-blue-600">{metrics.overallScore}/100</p>
              </div>
              <Award className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {overviewMetrics.map((metric, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                      {metric.change !== 0 && (
                        <div className="flex items-center mt-1">
                          {getTrendIcon(metric.change)}
                          <span className={`text-sm ml-1 ${getTrendColor(metric.change)}`}>
                            {metric.change > 0 ? '+' : ''}{metric.change}%
                          </span>
                        </div>
                      )}
                    </div>
                    <metric.icon className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{metric.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      {data.insights && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Highlights */}
          {data.insights.highlights.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-green-700">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Performance Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.insights.highlights.map((highlight, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Concerns */}
          {data.insights.concerns.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-red-700">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Areas of Concern
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.insights.concerns.map((concern, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      {concern}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {data.insights.recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-blue-700">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.insights.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Detailed Sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="trainers">Trainers</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.avgTransactionValue)}</p>
                    <p className="text-sm text-gray-600">Avg Transaction Value</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{formatNumber(metrics.avgClassSize)}</p>
                    <p className="text-sm text-gray-600">Avg Class Size</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(metrics.averageLTV)}</p>
                    <p className="text-sm text-gray-600">Avg Client LTV</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{formatPercentage(metrics.discountRate)}</p>
                    <p className="text-sm text-gray-600">Discount Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Class Format Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Class Format Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">PowerCycle</span>
                    <span className="text-sm text-gray-600">{metrics.powerCycleSessions} sessions</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${(metrics.powerCycleSessions / metrics.totalSessions) * 100}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Barre</span>
                    <span className="text-sm text-gray-600">{metrics.barreSessions} sessions</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-pink-500 h-2 rounded-full" 
                      style={{ width: `${(metrics.barreSessions / metrics.totalSessions) * 100}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Strength</span>
                    <span className="text-sm text-gray-600">{metrics.strengthSessions} sessions</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(metrics.strengthSessions / metrics.totalSessions) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="mt-6">
          <RevenuePerformanceSection metrics={metrics} />
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <SessionPerformanceSection metrics={metrics} />
        </TabsContent>

        <TabsContent value="trainers" className="mt-6">
          <LocationTrainerPerformanceSection metrics={metrics} />
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          <div className="space-y-6">
            <ClientRetentionSection metrics={metrics} />
            <LeadFunnelSection metrics={metrics} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LocationReportSection;