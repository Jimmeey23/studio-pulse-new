
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, Users, Target, DollarSign, Percent } from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SessionsTopBottomListsProps {
  data: SessionData[];
  title: string;
  type: 'classes' | 'trainers';
  variant: 'top' | 'bottom';
}

type MetricType = 'attendance' | 'fillRate' | 'revenue' | 'lateCancellations' | 'classAverage';

export const SessionsTopBottomLists: React.FC<SessionsTopBottomListsProps> = ({
  data,
  title,
  type,
  variant
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('classAverage');
  const [showCount, setShowCount] = useState(5);
  const [includeTrainer, setIncludeTrainer] = useState(false);

  const processedData = useMemo(() => {
    const grouped: Record<string, {
      name: string;
      cleanedClass: string;
      dayOfWeek: string;
      time: string;
      location: string;
      trainerName: string;
      totalAttendance: number;
      avgFillRate: number;
      totalRevenue: number;
      lateCancellations: number;
      sessions: number;
      classAverage: number;
    }> = {};

    data.forEach(session => {
      let key: string;
      
      if (type === 'classes') {
        if (includeTrainer) {
          key = `${session.cleanedClass}|${session.dayOfWeek}|${session.time}|${session.location}|${session.trainerName}`;
        } else {
          key = `${session.cleanedClass}|${session.dayOfWeek}|${session.time}|${session.location}`;
        }
      } else {
        key = session.trainerName;
      }
      
      if (!key) return;

      if (!grouped[key]) {
        grouped[key] = {
          name: key,
          cleanedClass: session.cleanedClass || '',
          dayOfWeek: session.dayOfWeek || '',
          time: session.time || '',
          location: session.location || '',
          trainerName: session.trainerName || '',
          totalAttendance: 0,
          avgFillRate: 0,
          totalRevenue: 0,
          lateCancellations: 0,
          sessions: 0,
          classAverage: 0
        };
      }

      grouped[key].totalAttendance += session.checkedInCount;
      grouped[key].totalRevenue += session.totalPaid;
      grouped[key].lateCancellations += session.lateCancelledCount;
      grouped[key].sessions += 1;
    });

    // Calculate averages
    Object.values(grouped).forEach(item => {
      const relatedSessions = data.filter(s => {
        if (type === 'classes') {
          if (includeTrainer) {
            return s.cleanedClass === item.cleanedClass && 
                   s.dayOfWeek === item.dayOfWeek && 
                   s.time === item.time && 
                   s.location === item.location &&
                   s.trainerName === item.trainerName;
          } else {
            return s.cleanedClass === item.cleanedClass && 
                   s.dayOfWeek === item.dayOfWeek && 
                   s.time === item.time && 
                   s.location === item.location;
          }
        } else {
          return s.trainerName === item.trainerName;
        }
      });
      
      const totalCapacity = relatedSessions.reduce((sum, s) => sum + s.capacity, 0);
      item.avgFillRate = totalCapacity > 0 ? (item.totalAttendance / totalCapacity) * 100 : 0;
      item.classAverage = item.sessions > 0 ? item.totalAttendance / item.sessions : 0;
    });

    const sortedData = Object.values(grouped).sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (selectedMetric) {
        case 'attendance':
          aValue = a.totalAttendance;
          bValue = b.totalAttendance;
          break;
        case 'fillRate':
          aValue = a.avgFillRate;
          bValue = b.avgFillRate;
          break;
        case 'revenue':
          aValue = a.totalRevenue;
          bValue = b.totalRevenue;
          break;
        case 'lateCancellations':
          aValue = a.lateCancellations;
          bValue = b.lateCancellations;
          return variant === 'top' ? bValue - aValue : aValue - bValue;
        case 'classAverage':
        default:
          aValue = a.classAverage;
          bValue = b.classAverage;
          break;
      }
      
      return variant === 'top' ? bValue - aValue : aValue - bValue;
    });

    return sortedData.slice(0, showCount);
  }, [data, type, selectedMetric, variant, showCount, includeTrainer]);

  const metricOptions = [
    { value: 'classAverage', label: 'Class Average', icon: Target },
    { value: 'attendance', label: 'Total Attendance', icon: Users },
    { value: 'fillRate', label: 'Fill Rate %', icon: Percent },
    { value: 'revenue', label: 'Revenue', icon: DollarSign },
    { value: 'lateCancellations', label: 'Late Cancellations', icon: TrendingDown }
  ];

  const getMetricValue = (item: typeof processedData[0]) => {
    switch (selectedMetric) {
      case 'attendance':
        return formatNumber(item.totalAttendance);
      case 'fillRate':
        return `${item.avgFillRate.toFixed(1)}%`;
      case 'revenue':
        return formatCurrency(item.totalRevenue);
      case 'lateCancellations':
        return formatNumber(item.lateCancellations);
      case 'classAverage':
      default:
        return item.classAverage.toFixed(1);
    }
  };

  const getMetricSubtext = (item: typeof processedData[0]) => {
    switch (selectedMetric) {
      case 'attendance':
        return `${item.sessions} sessions`;
      case 'fillRate':
        return `${formatNumber(item.totalAttendance)} attendees`;
      case 'revenue':
        return `Avg: ${formatCurrency(item.totalRevenue / item.sessions)}`;
      case 'lateCancellations':
        return `${((item.lateCancellations / item.sessions) * 100).toFixed(1)}% rate`;
      case 'classAverage':
      default:
        return `${formatNumber(item.totalAttendance)} total attendees`;
    }
  };

  const getDisplayName = (item: typeof processedData[0]) => {
    if (type === 'classes') {
      if (includeTrainer) {
        return `${item.cleanedClass} - ${item.dayOfWeek} ${item.time} @ ${item.location} (${item.trainerName})`;
      } else {
        return `${item.cleanedClass} - ${item.dayOfWeek} ${item.time} @ ${item.location}`;
      }
    } else {
      return item.trainerName;
    }
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-800 flex items-center gap-2">
            {variant === 'top' ? <TrendingUp className="w-5 h-5 text-green-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {type === 'classes' && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-trainer"
                  checked={includeTrainer}
                  onCheckedChange={setIncludeTrainer}
                />
                <Label htmlFor="include-trainer" className="text-xs">Include Trainer</Label>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {metricOptions.find(opt => opt.value === selectedMetric)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white">
                {metricOptions.map(option => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setSelectedMetric(option.value as MetricType)}
                  >
                    <option.icon className="w-4 h-4 mr-2" />
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="max-h-80 overflow-auto">
          {processedData.map((item, index) => (
            <div 
              key={item.name}
              className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  variant === 'top' 
                    ? index < 3 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                    : index < 3 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-gray-100 text-gray-700'
                }`}>
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate text-sm">{getDisplayName(item)}</p>
                  <p className="text-xs text-gray-500">{getMetricSubtext(item)}</p>
                  {type === 'classes' && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="text-xs px-1 py-0">{item.cleanedClass}</Badge>
                      <Badge variant="outline" className="text-xs px-1 py-0">{item.dayOfWeek}</Badge>
                      <Badge variant="outline" className="text-xs px-1 py-0">{item.time}</Badge>
                      <Badge variant="outline" className="text-xs px-1 py-0">{item.location}</Badge>
                      {includeTrainer && (
                        <Badge variant="outline" className="text-xs px-1 py-0">{item.trainerName}</Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right ml-2">
                <p className="font-semibold text-gray-900 text-sm">{getMetricValue(item)}</p>
                <Badge 
                  variant={variant === 'top' ? 'default' : 'destructive'} 
                  className="text-xs"
                >
                  {variant === 'top' ? 'High' : 'Low'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-100 flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCount(showCount === 5 ? 10 : 5)}
          >
            Show {showCount === 5 ? 'More' : 'Less'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
