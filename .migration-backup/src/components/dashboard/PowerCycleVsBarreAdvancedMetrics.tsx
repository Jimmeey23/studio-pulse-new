
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, MapPin, Clock, Target } from 'lucide-react';
import { formatNumber } from '@/utils/formatters';
import { SessionData } from '@/hooks/useSessionsData';

interface PowerCycleVsBarreAdvancedMetricsProps {
  data: SessionData[];
}

export const PowerCycleVsBarreAdvancedMetrics: React.FC<PowerCycleVsBarreAdvancedMetricsProps> = ({ data }) => {
  const processedData = useMemo(() => {
    // Time-based analysis
    const timeAnalysis = data.reduce((acc, session) => {
      const hour = new Date(`2025-01-01 ${session.time}`).getHours();
      const timeSlot = hour < 6 ? 'Early Morning' : 
                     hour < 12 ? 'Morning' : 
                     hour < 18 ? 'Afternoon' : 'Evening';
      
      if (!acc[timeSlot]) {
        acc[timeSlot] = { powercycle: 0, barre: 0, pcAttendance: 0, barreAttendance: 0, pcSessions: 0, barreSessions: 0 };
      }
      
      const isPowerCycle = session.cleanedClass.toLowerCase().includes('cycle');
      const isBarre = session.cleanedClass.toLowerCase().includes('barre');
      
      if (isPowerCycle) {
        acc[timeSlot].powercycle += session.checkedInCount;
        acc[timeSlot].pcAttendance += session.checkedInCount;
        acc[timeSlot].pcSessions += 1;
      } else if (isBarre) {
        acc[timeSlot].barre += session.checkedInCount;
        acc[timeSlot].barreAttendance += session.checkedInCount;
        acc[timeSlot].barreSessions += 1;
      }
      
      return acc;
    }, {} as Record<string, any>);

    const timeData = Object.entries(timeAnalysis).map(([time, metrics]) => ({
      time,
      powercycle: metrics.powercycle,
      barre: metrics.barre,
      pcAvgAttendance: metrics.pcSessions > 0 ? (metrics.pcAttendance / metrics.pcSessions).toFixed(1) : '0',
      barreAvgAttendance: metrics.barreSessions > 0 ? (metrics.barreAttendance / metrics.barreSessions).toFixed(1) : '0'
    }));

    // Location-based analysis
    const locationAnalysis = data.reduce((acc, session) => {
      const location = session.location.substring(0, 3).toUpperCase();
      const fullLocation = session.location;
      
      if (!acc[location]) {
        acc[location] = { 
          location, 
          fullLocation,
          powercycleSessions: 0, 
          barreSessions: 0, 
          pcAttendance: 0, 
          barreAttendance: 0,
          pcCapacity: 0,
          barreCapacity: 0
        };
      }
      
      const isPowerCycle = session.cleanedClass.toLowerCase().includes('cycle');
      const isBarre = session.cleanedClass.toLowerCase().includes('barre');
      
      if (isPowerCycle) {
        acc[location].powercycleSessions += 1;
        acc[location].pcAttendance += session.checkedInCount;
        acc[location].pcCapacity += session.capacity;
      } else if (isBarre) {
        acc[location].barreSessions += 1;
        acc[location].barreAttendance += session.checkedInCount;
        acc[location].barreCapacity += session.capacity;
      }
      
      return acc;
    }, {} as Record<string, any>);

    const locationData = Object.values(locationAnalysis).map((loc: any) => ({
      ...loc,
      pcFillRate: loc.pcCapacity > 0 ? ((loc.pcAttendance / loc.pcCapacity) * 100).toFixed(1) + '%' : '0%',
      barreFillRate: loc.barreCapacity > 0 ? ((loc.barreAttendance / loc.barreCapacity) * 100).toFixed(1) + '%' : '0%',
      pcAvgAttendance: loc.powercycleSessions > 0 ? (loc.pcAttendance / loc.powercycleSessions).toFixed(1) : '0',
      barreAvgAttendance: loc.barreSessions > 0 ? (loc.barreAttendance / loc.barreSessions).toFixed(1) : '0'
    }));

    return { timeData, locationData };
  }, [data]);

  const timeColumns = [
    { key: 'time', header: 'Time Slot', align: 'left' as const },
    { key: 'powercycle', header: 'PowerCycle', align: 'center' as const, render: (value: number) => <span className="font-bold text-orange-600">{formatNumber(value)}</span> },
    { key: 'barre', header: 'Barre', align: 'center' as const, render: (value: number) => <span className="font-bold text-pink-600">{formatNumber(value)}</span> },
    { key: 'pcAvgAttendance', header: 'PC Avg', align: 'center' as const },
    { key: 'barreAvgAttendance', header: 'Barre Avg', align: 'center' as const }
  ];

  const locationColumns = [
    { key: 'location', header: 'Location', align: 'left' as const, render: (value: string, item: any) => (
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-blue-500" />
        <span className="font-medium">{value}</span>
      </div>
    )},
    { key: 'powercycleSessions', header: 'PC Sessions', align: 'center' as const, render: (value: number) => <span className="font-bold text-orange-600">{formatNumber(value)}</span> },
    { key: 'barreSessions', header: 'Barre Sessions', align: 'center' as const, render: (value: number) => <span className="font-bold text-pink-600">{formatNumber(value)}</span> },
    { key: 'pcFillRate', header: 'PC Fill Rate', align: 'center' as const },
    { key: 'barreFillRate', header: 'Barre Fill Rate', align: 'center' as const },
    { key: 'pcAvgAttendance', header: 'PC Avg', align: 'center' as const },
    { key: 'barreAvgAttendance', header: 'Barre Avg', align: 'center' as const }
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-pink-500">
          <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
            <Clock className="w-5 h-5" />
            Time-based Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ModernDataTable
            data={processedData.timeData}
            columns={timeColumns}
            maxHeight="400px"
            stickyHeader={true}
          />
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500">
          <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
            <MapPin className="w-5 h-5" />
            Location-based Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ModernDataTable
            data={processedData.locationData}
            columns={locationColumns}
            maxHeight="400px"
            stickyHeader={true}
          />
        </CardContent>
      </Card>
    </div>
  );
};
