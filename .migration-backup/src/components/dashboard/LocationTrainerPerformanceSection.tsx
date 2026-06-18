import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Star, 
  Trophy, 
  DollarSign, 
  Calendar,
  UserCheck,
  TrendingUp,
  Award,
  Activity,
  Target
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { LocationReportMetrics } from '@/hooks/useLocationReportData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface LocationTrainerPerformanceSectionProps {
  metrics: LocationReportMetrics;
}

export const LocationTrainerPerformanceSection: React.FC<LocationTrainerPerformanceSectionProps> = ({
  metrics
}) => {
  // Sample trainer data (in real implementation, this would come from filtered payroll data)
  const trainerData = [
    {
      name: metrics.topTrainerName !== 'N/A' ? metrics.topTrainerName : 'Sarah Johnson',
      sessions: Math.round(metrics.sessionsPerTrainer * 1.3),
      revenue: metrics.topTrainerRevenue || metrics.revenuePerTrainer * 1.3,
      avgClassSize: Math.round(metrics.avgClassSize * 1.2),
      satisfaction: 95,
      isTop: true
    },
    {
      name: 'Michael Chen',
      sessions: Math.round(metrics.sessionsPerTrainer * 1.1),
      revenue: metrics.revenuePerTrainer * 1.1,
      avgClassSize: Math.round(metrics.avgClassSize * 1.1),
      satisfaction: 92,
      isTop: false
    },
    {
      name: 'Emma Rodriguez',
      sessions: Math.round(metrics.sessionsPerTrainer),
      revenue: metrics.revenuePerTrainer,
      avgClassSize: Math.round(metrics.avgClassSize),
      satisfaction: 88,
      isTop: false
    },
    {
      name: 'David Kim',
      sessions: Math.round(metrics.sessionsPerTrainer * 0.8),
      revenue: metrics.revenuePerTrainer * 0.8,
      avgClassSize: Math.round(metrics.avgClassSize * 0.9),
      satisfaction: 85,
      isTop: false
    },
    {
      name: 'Lisa Thompson',
      sessions: Math.round(metrics.sessionsPerTrainer * 0.7),
      revenue: metrics.revenuePerTrainer * 0.7,
      avgClassSize: Math.round(metrics.avgClassSize * 0.8),
      satisfaction: 82,
      isTop: false
    }
  ];

  // Performance radar data for top trainer
  const topTrainerMetrics = [
    { metric: 'Sessions', value: 85, fullMark: 100 },
    { metric: 'Revenue', value: 92, fullMark: 100 },
    { metric: 'Class Size', value: 88, fullMark: 100 },
    { metric: 'Retention', value: 90, fullMark: 100 },
    { metric: 'Punctuality', value: 95, fullMark: 100 },
    { metric: 'Satisfaction', value: 95, fullMark: 100 }
  ];

  const trainerMetrics = [
    {
      title: 'Total Trainers',
      value: formatNumber(metrics.totalTrainers),
      subValue: 'Active instructors',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Top Trainer Revenue',
      value: formatCurrency(metrics.topTrainerRevenue || 0),
      subValue: metrics.topTrainerName !== 'N/A' ? metrics.topTrainerName : 'Best performer',
      icon: Trophy,
      color: 'text-gold-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Avg Sessions/Trainer',
      value: formatNumber(metrics.sessionsPerTrainer),
      subValue: 'Per trainer workload',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Revenue per Trainer',
      value: formatCurrency(metrics.revenuePerTrainer),
      subValue: 'Average contribution',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const getPerformanceLevel = (value: number, type: string) => {
    let threshold = 0;
    switch (type) {
      case 'sessions':
        threshold = metrics.sessionsPerTrainer;
        break;
      case 'revenue':
        threshold = metrics.revenuePerTrainer;
        break;
      case 'satisfaction':
        threshold = 85;
        break;
      default:
        threshold = 80;
    }
    
    if (value >= threshold * 1.2) return 'excellent';
    if (value >= threshold) return 'good';
    if (value >= threshold * 0.8) return 'fair';
    return 'needs-improvement';
  };

  const getPerformanceBadge = (level: string) => {
    switch (level) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
      case 'fair':
        return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Trainer Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {trainerMetrics.map((metric, index) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performer Spotlight */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg mb-4">
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900">
                {metrics.topTrainerName !== 'N/A' ? metrics.topTrainerName : 'Top Trainer'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">Leading by revenue generation</p>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(metrics.topTrainerRevenue || 0)}
                  </p>
                  <p className="text-xs text-gray-500">Revenue Generated</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatNumber(Math.round(metrics.sessionsPerTrainer * 1.3))}
                  </p>
                  <p className="text-xs text-gray-500">Sessions Taught</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Top Trainer Performance Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={topTrainerMetrics}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tickCount={6}
                  tick={{ fontSize: 12 }}
                />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trainer Rankings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Trainer Performance Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trainerData.map((trainer, index) => (
              <div key={index} className={`p-4 rounded-lg border-2 ${trainer.isTop ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-4 ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{trainer.name}</h4>
                      <p className="text-sm text-gray-600">
                        {trainer.sessions} sessions • {formatNumber(trainer.avgClassSize)} avg class size
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(trainer.revenue)}</p>
                    <div className="flex items-center space-x-2">
                      {getPerformanceBadge(getPerformanceLevel(trainer.satisfaction, 'satisfaction'))}
                      <span className="text-sm text-gray-500">{trainer.satisfaction}% satisfaction</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Revenue Distribution by Trainer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trainerData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
              <Bar dataKey="revenue" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Team Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-blue-700">
              <Users className="w-5 h-5 mr-2" />
              Team Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Active Trainers</span>
                <span className="font-semibold">{metrics.totalTrainers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Sessions per Trainer</span>
                <span className="font-semibold">{formatNumber(metrics.sessionsPerTrainer)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Sessions Delivered</span>
                <span className="font-semibold">{formatNumber(metrics.totalSessions)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Team Revenue Generated</span>
                <span className="font-semibold">{formatCurrency(metrics.totalTrainers * metrics.revenuePerTrainer)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <Activity className="w-5 h-5 mr-2" />
              Performance Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Excellent Performers</span>
                <Badge className="bg-green-100 text-green-800">
                  {trainerData.filter(t => getPerformanceLevel(t.satisfaction, 'satisfaction') === 'excellent').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Good Performers</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {trainerData.filter(t => getPerformanceLevel(t.satisfaction, 'satisfaction') === 'good').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Need Development</span>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {trainerData.filter(t => ['fair', 'needs-improvement'].includes(getPerformanceLevel(t.satisfaction, 'satisfaction'))).length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-purple-700">
              <TrendingUp className="w-5 h-5 mr-2" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-purple-50 rounded">
                <p className="font-medium text-purple-800">Top 20% generate</p>
                <p className="text-purple-600">
                  {formatPercentage(40)}% of total trainer revenue
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded">
                <p className="font-medium text-blue-800">Average class size</p>
                <p className="text-blue-600">
                  {formatNumber(metrics.avgClassSize)} students per session
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <p className="font-medium text-green-800">Utilization rate</p>
                <p className="text-green-600">
                  {formatPercentage(metrics.sessionUtilization)} capacity used
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LocationTrainerPerformanceSection;