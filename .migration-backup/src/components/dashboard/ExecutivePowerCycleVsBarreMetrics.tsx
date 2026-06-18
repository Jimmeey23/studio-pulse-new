
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Bike, TrendingUp, Users, Target } from 'lucide-react';
import { useSessionsData } from '@/hooks/useSessionsData';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { formatNumber } from '@/utils/formatters';

export const ExecutivePowerCycleVsBarreMetrics: React.FC = () => {
  const { data: sessionData, loading } = useSessionsData();

  if (loading || !sessionData) {
    return (
      <div className="flex items-center justify-center p-8">
        <BrandSpinner size="md" />
      </div>
    );
  }

  // Calculate PowerCycle metrics
  const powerCycleData = sessionData.filter(session => 
    session.cleanedClass?.toLowerCase().includes('cycle') || 
    session.classType?.toLowerCase().includes('cycle')
  );

  // Calculate Barre metrics
  const barreData = sessionData.filter(session => 
    session.cleanedClass?.toLowerCase().includes('barre') || 
    session.classType?.toLowerCase().includes('barre')
  );

  const pcMetrics = {
    sessions: powerCycleData.length,
    attendance: powerCycleData.reduce((sum, s) => sum + s.checkedInCount, 0),
    avgFill: powerCycleData.length > 0 ? 
      (powerCycleData.reduce((sum, s) => sum + s.checkedInCount, 0) / 
       powerCycleData.reduce((sum, s) => sum + s.capacity, 0)) * 100 : 0
  };

  const barreMetrics = {
    sessions: barreData.length,
    attendance: barreData.reduce((sum, s) => sum + s.checkedInCount, 0),
    avgFill: barreData.length > 0 ? 
      (barreData.reduce((sum, s) => sum + s.checkedInCount, 0) / 
       barreData.reduce((sum, s) => sum + s.capacity, 0)) * 100 : 0
  };

  return (
    <Card className="bg-gradient-to-br from-white via-slate-50/30 to-purple-50/20 shadow-xl border-0">
      <CardHeader className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          PowerCycle vs Barre Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PowerCycle Metrics */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">PowerCycle</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{formatNumber(pcMetrics.sessions)}</p>
                <p className="text-xs text-gray-600">Sessions</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{formatNumber(pcMetrics.attendance)}</p>
                <p className="text-xs text-gray-600">Attendance</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{Math.round(pcMetrics.avgFill)}%</p>
                <p className="text-xs text-gray-600">Avg Fill</p>
              </div>
            </div>
          </div>

          {/* Barre Metrics */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center">
                <Bike className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Barre</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-pink-50 rounded-lg">
                <p className="text-2xl font-bold text-pink-600">{formatNumber(barreMetrics.sessions)}</p>
                <p className="text-xs text-gray-600">Sessions</p>
              </div>
              <div className="text-center p-3 bg-pink-50 rounded-lg">
                <p className="text-2xl font-bold text-pink-600">{formatNumber(barreMetrics.attendance)}</p>
                <p className="text-xs text-gray-600">Attendance</p>
              </div>
              <div className="text-center p-3 bg-pink-50 rounded-lg">
                <p className="text-2xl font-bold text-pink-600">{Math.round(barreMetrics.avgFill)}%</p>
                <p className="text-xs text-gray-600">Avg Fill</p>
              </div>
            </div>
          </div>
        </div>

        {/* Winner Badges */}
        <div className="mt-6 flex justify-center gap-4">
          {pcMetrics.sessions > barreMetrics.sessions && (
            <Badge className="bg-blue-100 text-blue-800">
              <Zap className="w-3 h-3 mr-1" />
              PowerCycle leads in Sessions
            </Badge>
          )}
          {barreMetrics.sessions > pcMetrics.sessions && (
            <Badge className="bg-pink-100 text-pink-800">
              <Bike className="w-3 h-3 mr-1" />
              Barre leads in Sessions
            </Badge>
          )}
          {pcMetrics.attendance > barreMetrics.attendance && (
            <Badge className="bg-blue-100 text-blue-800">
              <Users className="w-3 h-3 mr-1" />
              PowerCycle leads in Attendance
            </Badge>
          )}
          {barreMetrics.attendance > pcMetrics.attendance && (
            <Badge className="bg-pink-100 text-pink-800">
              <Users className="w-3 h-3 mr-1" />
              Barre leads in Attendance
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
