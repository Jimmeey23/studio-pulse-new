
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  GitCompare, 
  Plus, 
  X, 
  BarChart3, 
  Users, 
  Target,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SessionsComparisonToolProps {
  data: SessionData[];
}

type ComparisonType = 'classes' | 'trainers' | 'timeSlots' | 'locations';
type MetricType = 'attendance' | 'fillRate' | 'revenue' | 'sessions';

export const SessionsComparisonTool: React.FC<SessionsComparisonToolProps> = ({ data }) => {
  const [comparisonType, setComparisonType] = useState<ComparisonType>('classes');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('attendance');

  const availableOptions = useMemo(() => {
    const options: Record<ComparisonType, string[]> = {
      classes: [...new Set(data.map(s => s.cleanedClass))].filter(Boolean),
      trainers: [...new Set(data.map(s => s.trainerName))].filter(Boolean),
      timeSlots: [...new Set(data.map(s => s.time))].filter(Boolean),
      locations: [...new Set(data.map(s => s.location))].filter(Boolean)
    };
    return options;
  }, [data]);

  const comparisonData = useMemo(() => {
    if (selectedItems.length === 0) return [];

    return selectedItems.map(item => {
      const filteredData = data.filter(session => {
        switch (comparisonType) {
          case 'classes': return session.cleanedClass === item;
          case 'trainers': return session.trainerName === item;
          case 'timeSlots': return session.time === item;
          case 'locations': return session.location === item;
          default: return false;
        }
      });

      const totalSessions = filteredData.length;
      const totalAttendees = filteredData.reduce((sum, s) => sum + s.checkedInCount, 0);
      const totalCapacity = filteredData.reduce((sum, s) => sum + s.capacity, 0);
      const totalRevenue = filteredData.reduce((sum, s) => sum + s.totalPaid, 0);
      const avgFillRate = totalCapacity > 0 ? (totalAttendees / totalCapacity) * 100 : 0;
      const avgAttendance = totalSessions > 0 ? totalAttendees / totalSessions : 0;
      const avgRevenue = totalSessions > 0 ? totalRevenue / totalSessions : 0;
      const lateCancellations = filteredData.reduce((sum, s) => sum + s.lateCancelledCount, 0);
      const cancellationRate = totalSessions > 0 ? (lateCancellations / totalSessions) * 100 : 0;

      return {
        name: item,
        totalSessions,
        totalAttendees,
        totalRevenue,
        avgFillRate,
        avgAttendance,
        avgRevenue,
        cancellationRate,
        lateCancellations,
        revenuePerAttendee: totalAttendees > 0 ? totalRevenue / totalAttendees : 0
      };
    });
  }, [data, selectedItems, comparisonType]);

  const chartData = useMemo(() => {
    return comparisonData.map(item => ({
      name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
      fullName: item.name,
      attendance: item.totalAttendees,
      fillRate: item.avgFillRate,
      revenue: item.totalRevenue,
      sessions: item.totalSessions,
      avgAttendance: item.avgAttendance,
      avgRevenue: item.avgRevenue
    }));
  }, [comparisonData]);

  const radarData = useMemo(() => {
    if (comparisonData.length === 0) return [];
    
    const maxValues = {
      attendance: Math.max(...comparisonData.map(d => d.totalAttendees)),
      fillRate: 100,
      revenue: Math.max(...comparisonData.map(d => d.totalRevenue)),
      sessions: Math.max(...comparisonData.map(d => d.totalSessions)),
      cancellationRate: Math.max(...comparisonData.map(d => d.cancellationRate))
    };

    return [
      'Attendance',
      'Fill Rate',
      'Revenue',
      'Sessions',
      'Cancellation Rate'
    ].map(metric => {
      const dataPoint: any = { metric };
      
      comparisonData.forEach((item, index) => {
        let value: number;
        switch (metric) {
          case 'Attendance':
            value = (item.totalAttendees / maxValues.attendance) * 100;
            break;
          case 'Fill Rate':
            value = item.avgFillRate;
            break;
          case 'Revenue':
            value = (item.totalRevenue / maxValues.revenue) * 100;
            break;
          case 'Sessions':
            value = (item.totalSessions / maxValues.sessions) * 100;
            break;
          case 'Cancellation Rate':
            value = maxValues.cancellationRate > 0 ? 100 - (item.cancellationRate / maxValues.cancellationRate) * 100 : 100;
            break;
          default:
            value = 0;
        }
        dataPoint[item.name] = value;
      });
      
      return dataPoint;
    });
  }, [comparisonData]);

  const performanceInsights = useMemo(() => {
    if (comparisonData.length < 2) return [];
    
    const insights = [];
    const sorted = [...comparisonData];
    
    // Best performer by attendance
    const bestAttendance = sorted.sort((a, b) => b.totalAttendees - a.totalAttendees)[0];
    insights.push({
      type: 'positive',
      title: 'Highest Attendance',
      description: `${bestAttendance.name} leads with ${formatNumber(bestAttendance.totalAttendees)} total attendees`,
      icon: Users
    });
    
    // Best fill rate
    const bestFillRate = sorted.sort((a, b) => b.avgFillRate - a.avgFillRate)[0];
    insights.push({
      type: 'positive',
      title: 'Best Fill Rate',
      description: `${bestFillRate.name} achieves ${bestFillRate.avgFillRate.toFixed(1)}% average fill rate`,
      icon: Target
    });
    
    // Highest revenue
    const bestRevenue = sorted.sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
    insights.push({
      type: 'positive',
      title: 'Top Revenue Generator',
      description: `${bestRevenue.name} generates ${formatCurrency(bestRevenue.totalRevenue)} total revenue`,
      icon: TrendingUp
    });
    
    // Lowest performer
    const lowestAttendance = sorted.sort((a, b) => a.totalAttendees - b.totalAttendees)[0];
    insights.push({
      type: 'warning',
      title: 'Improvement Opportunity',
      description: `${lowestAttendance.name} has lowest attendance at ${formatNumber(lowestAttendance.totalAttendees)}`,
      icon: TrendingDown
    });
    
    return insights;
  }, [comparisonData]);

  const addItem = (item: string) => {
    if (!selectedItems.includes(item) && selectedItems.length < 5) {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const removeItem = (item: string) => {
    setSelectedItems(selectedItems.filter(i => i !== item));
  };

  const clearAll = () => {
    setSelectedItems([]);
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-purple-600" />
            Performance Comparison Tool
          </CardTitle>
          <div className="flex gap-2">
            <Select value={comparisonType} onValueChange={(value: ComparisonType) => {
              setComparisonType(value);
              setSelectedItems([]);
            }}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="classes">Classes</SelectItem>
                <SelectItem value="trainers">Trainers</SelectItem>
                <SelectItem value="timeSlots">Time Slots</SelectItem>
                <SelectItem value="locations">Locations</SelectItem>
              </SelectContent>
            </Select>
            {selectedItems.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearAll}>
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Selection Area */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Select {comparisonType} to Compare (Max 5)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
              {availableOptions[comparisonType].slice(0, 12).map(option => (
                <Button
                  key={option}
                  variant={selectedItems.includes(option) ? "default" : "outline"}
                  size="sm"
                  onClick={() => selectedItems.includes(option) ? removeItem(option) : addItem(option)}
                  disabled={!selectedItems.includes(option) && selectedItems.length >= 5}
                  className="justify-start"
                >
                  {selectedItems.includes(option) ? (
                    <Minus className="w-3 h-3 mr-1" />
                  ) : (
                    <Plus className="w-3 h-3 mr-1" />
                  )}
                  <span className="truncate">{option}</span>
                </Button>
              ))}
            </div>
            
            {selectedItems.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedItems.map(item => (
                  <Badge key={item} variant="default" className="px-3 py-1">
                    {item}
                    <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => removeItem(item)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {selectedItems.length > 0 && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="charts">Visual Comparison</TabsTrigger>
                <TabsTrigger value="radar">Performance Radar</TabsTrigger>
                <TabsTrigger value="insights">Key Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-center">Sessions</TableHead>
                      <TableHead className="text-center">Total Attendees</TableHead>
                      <TableHead className="text-center">Avg Attendance</TableHead>
                      <TableHead className="text-center">Fill Rate</TableHead>
                      <TableHead className="text-center">Total Revenue</TableHead>
                      <TableHead className="text-center">Avg Revenue</TableHead>
                      <TableHead className="text-center">Cancellation Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center">{item.totalSessions}</TableCell>
                        <TableCell className="text-center">{formatNumber(item.totalAttendees)}</TableCell>
                        <TableCell className="text-center">{item.avgAttendance.toFixed(1)}</TableCell>
                        <TableCell className="text-center">{item.avgFillRate.toFixed(1)}%</TableCell>
                        <TableCell className="text-center">{formatCurrency(item.totalRevenue)}</TableCell>
                        <TableCell className="text-center">{formatCurrency(item.avgRevenue)}</TableCell>
                        <TableCell className="text-center">{item.cancellationRate.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="charts" className="space-y-6">
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={selectedMetric === 'attendance' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedMetric('attendance')}
                  >
                    Attendance
                  </Button>
                  <Button
                    variant={selectedMetric === 'fillRate' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedMetric('fillRate')}
                  >
                    Fill Rate
                  </Button>
                  <Button
                    variant={selectedMetric === 'revenue' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedMetric('revenue')}
                  >
                    Revenue
                  </Button>
                  <Button
                    variant={selectedMetric === 'sessions' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedMetric('sessions')}
                  >
                    Sessions
                  </Button>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(label) => {
                          const item = chartData.find(d => d.name === label);
                          return item?.fullName || label;
                        }}
                      />
                      <Bar 
                        dataKey={selectedMetric} 
                        fill="#3B82F6"
                        name={
                          selectedMetric === 'attendance' ? 'Total Attendees' :
                          selectedMetric === 'fillRate' ? 'Fill Rate %' :
                          selectedMetric === 'revenue' ? 'Total Revenue' :
                          'Sessions'
                        }
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="radar" className="space-y-4">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={18} domain={[0, 100]} />
                      {selectedItems.map((item, index) => (
                        <Radar
                          key={item}
                          name={item}
                          dataKey={item}
                          stroke={`hsl(${(index * 360) / selectedItems.length}, 70%, 50%)`}
                          fill={`hsl(${(index * 360) / selectedItems.length}, 70%, 50%)`}
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      ))}
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Values are normalized to 0-100 scale for comparison. Higher values indicate better performance.
                </p>
              </TabsContent>

              <TabsContent value="insights" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {performanceInsights.map((insight, index) => (
                    <Card key={index} className={`border-l-4 ${
                      insight.type === 'positive' ? 'border-l-green-500 bg-green-50' :
                      insight.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
                      'border-l-blue-500 bg-blue-50'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <insight.icon className={`w-5 h-5 mt-1 ${
                            insight.type === 'positive' ? 'text-green-600' :
                            insight.type === 'warning' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`} />
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">{insight.title}</h3>
                            <p className="text-sm text-gray-700">{insight.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {comparisonData.length >= 2 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Performance Gap Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-2">Attendance Range</h4>
                          <p className="text-sm">
                            Difference: {formatNumber(Math.max(...comparisonData.map(d => d.totalAttendees)) - Math.min(...comparisonData.map(d => d.totalAttendees)))} attendees
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-2">Revenue Range</h4>
                          <p className="text-sm">
                            Difference: {formatCurrency(Math.max(...comparisonData.map(d => d.totalRevenue)) - Math.min(...comparisonData.map(d => d.totalRevenue)))}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {selectedItems.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Start Your Comparison</h3>
              <p className="text-gray-500">
                Select {comparisonType} from the options above to begin comparing their performance metrics
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
