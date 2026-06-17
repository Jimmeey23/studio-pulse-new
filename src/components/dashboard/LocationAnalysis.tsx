import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PayrollData } from '@/types/dashboard';
import { formatNumber, formatCurrency, formatPercentage } from '@/utils/formatters';
import { FormatFilters } from './FormatAnalysisFilters';
import { 
  MapPin, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  DollarSign,
  Users,
  Activity,
  Target,
  Trophy,
  Star
} from 'lucide-react';

interface LocationAnalysisProps {
  data: PayrollData[];
  filters: FormatFilters;
}

interface LocationMetrics {
  location: string;
  cycle: {
    sessions: number;
    emptySessions: number;
    visits: number;
    revenue: number;
    fillRate: number;
    avgPerSession: number;
    revenuePerVisit: number;
  };
  barre: {
    sessions: number;
    emptySessions: number;
    visits: number;
    revenue: number;
    fillRate: number;
    avgPerSession: number;
    revenuePerVisit: number;
  };
  strength: {
    sessions: number;
    emptySessions: number;
    visits: number;
    revenue: number;
    fillRate: number;
    avgPerSession: number;
    revenuePerVisit: number;
  };
  totals: {
    sessions: number;
    visits: number;
    revenue: number;
    fillRate: number;
    score: number;
  };
}

export const LocationAnalysis: React.FC<LocationAnalysisProps> = ({ data, filters }) => {
  const locationData = useMemo(() => {
    const locationMap = new Map<string, LocationMetrics>();

    // Filter data based on location filter
    let filteredData = data;
    if (filters.locations.length > 0) {
      filteredData = filteredData.filter(item => filters.locations.includes(item.location));
    }

    filteredData.forEach(row => {
      const location = row.location;
      if (!location) return;

      if (!locationMap.has(location)) {
        locationMap.set(location, {
          location,
          cycle: { sessions: 0, emptySessions: 0, visits: 0, revenue: 0, fillRate: 0, avgPerSession: 0, revenuePerVisit: 0 },
          barre: { sessions: 0, emptySessions: 0, visits: 0, revenue: 0, fillRate: 0, avgPerSession: 0, revenuePerVisit: 0 },
          strength: { sessions: 0, emptySessions: 0, visits: 0, revenue: 0, fillRate: 0, avgPerSession: 0, revenuePerVisit: 0 },
          totals: { sessions: 0, visits: 0, revenue: 0, fillRate: 0, score: 0 }
        });
      }

      const locationMetrics = locationMap.get(location)!;

      // PowerCycle
      locationMetrics.cycle.sessions += row.cycleSessions || 0;
      locationMetrics.cycle.emptySessions += row.emptyCycleSessions || 0;
      locationMetrics.cycle.visits += row.cycleCustomers || 0;
      locationMetrics.cycle.revenue += row.cyclePaid || 0;

      // Barre
      locationMetrics.barre.sessions += row.barreSessions || 0;
      locationMetrics.barre.emptySessions += row.emptyBarreSessions || 0;
      locationMetrics.barre.visits += row.barreCustomers || 0;
      locationMetrics.barre.revenue += row.barrePaid || 0;

      // Strength
      locationMetrics.strength.sessions += row.strengthSessions || 0;
      locationMetrics.strength.emptySessions += row.emptyStrengthSessions || 0;
      locationMetrics.strength.visits += row.strengthCustomers || 0;
      locationMetrics.strength.revenue += row.strengthPaid || 0;
    });

    // Calculate derived metrics for each location
    Array.from(locationMap.values()).forEach(location => {
      // Calculate format-specific metrics
      [location.cycle, location.barre, location.strength].forEach(format => {
        format.fillRate = format.sessions > 0 
          ? ((format.sessions - format.emptySessions) / format.sessions) * 100 
          : 0;
        format.avgPerSession = format.sessions > 0 ? format.visits / format.sessions : 0;
        format.revenuePerVisit = format.visits > 0 ? format.revenue / format.visits : 0;
      });

      // Calculate totals
      location.totals.sessions = location.cycle.sessions + location.barre.sessions + location.strength.sessions;
      location.totals.visits = location.cycle.visits + location.barre.visits + location.strength.visits;
      location.totals.revenue = location.cycle.revenue + location.barre.revenue + location.strength.revenue;
      
      const totalEmptySessions = location.cycle.emptySessions + location.barre.emptySessions + location.strength.emptySessions;
      location.totals.fillRate = location.totals.sessions > 0 
        ? ((location.totals.sessions - totalEmptySessions) / location.totals.sessions) * 100 
        : 0;

      // Calculate composite score
      const revenueScore = Math.min((location.totals.revenue / 500000) * 100, 100); // Normalize to 500k max
      const fillRateScore = location.totals.fillRate;
      const volumeScore = Math.min((location.totals.sessions / 100) * 100, 100); // Normalize to 100 sessions max
      
      location.totals.score = (revenueScore * 0.4 + fillRateScore * 0.4 + volumeScore * 0.2);
    });

    return Array.from(locationMap.values()).sort((a, b) => b.totals.score - a.totals.score);
  }, [data, filters]);

  const getBestPerformingFormat = (location: LocationMetrics) => {
    const formats = [
      { name: 'PowerCycle', revenue: location.cycle.revenue, fillRate: location.cycle.fillRate },
      { name: 'Barre', revenue: location.barre.revenue, fillRate: location.barre.fillRate },
      { name: 'Strength', revenue: location.strength.revenue, fillRate: location.strength.fillRate }
    ];

    return formats.reduce((best, current) => 
      (current.revenue + current.fillRate) > (best.revenue + best.fillRate) ? current : best
    );
  };

  const LocationCard = ({ locationMetrics }: { locationMetrics: LocationMetrics }) => {
    const bestFormat = getBestPerformingFormat(locationMetrics);
    const isTopPerformer = locationData.indexOf(locationMetrics) < 3;

    return (
      <Card className={`border-2 transition-all hover:shadow-lg ${
        isTopPerformer 
          ? 'border-gradient-to-r from-yellow-300 to-orange-300 bg-gradient-to-br from-yellow-50 to-orange-50' 
          : 'border-gray-200 bg-gradient-to-br from-white to-gray-50'
      }`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                isTopPerformer 
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}>
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900">{locationMetrics.location}</span>
            </div>
            <div className="flex items-center gap-2">
              {isTopPerformer && <Trophy className="h-5 w-5 text-yellow-600" />}
              <Badge variant={isTopPerformer ? "default" : "secondary"} 
                     className={isTopPerformer ? "bg-yellow-500 text-white" : ""}>
                {formatNumber(locationMetrics.totals.score)}% score
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-lg font-bold text-gray-900">{formatNumber(locationMetrics.totals.sessions)}</div>
              <div className="text-xs text-gray-600">Total Sessions</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-lg font-bold text-gray-900">{formatNumber(locationMetrics.totals.visits)}</div>
              <div className="text-xs text-gray-600">Total Visits</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-lg font-bold text-gray-900">{formatCurrency(locationMetrics.totals.revenue)}</div>
              <div className="text-xs text-gray-600">Total Revenue</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-lg font-bold text-gray-900">{formatPercentage(locationMetrics.totals.fillRate)}</div>
              <div className="text-xs text-gray-600">Fill Rate</div>
            </div>
          </div>

          {/* Format Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Best Format: {bestFormat.name}</span>
            </div>
            
            <div className={`grid gap-2 text-xs ${
              filters.formats.length === 1 ? 'grid-cols-1' :
              filters.formats.length === 2 ? 'grid-cols-2' :
              'grid-cols-3'
            }`}>
              {/* PowerCycle */}
              {filters.formats.includes('cycle') && (
                <div className="p-2 rounded border bg-blue-50 border-blue-200">
                  <div className="font-medium text-blue-900">PowerCycle</div>
                  <div className="space-y-1 mt-1">
                    <div className="flex justify-between">
                      <span>Sessions:</span>
                      <span className="font-medium">{formatNumber(locationMetrics.cycle.sessions)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue:</span>
                      <span className="font-medium">{formatCurrency(locationMetrics.cycle.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fill:</span>
                      <span className="font-medium">{formatPercentage(locationMetrics.cycle.fillRate)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Barre */}
              {filters.formats.includes('barre') && (
                <div className="p-2 rounded border bg-pink-50 border-pink-200">
                  <div className="font-medium text-pink-900">Barre</div>
                  <div className="space-y-1 mt-1">
                    <div className="flex justify-between">
                      <span>Sessions:</span>
                      <span className="font-medium">{formatNumber(locationMetrics.barre.sessions)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue:</span>
                      <span className="font-medium">{formatCurrency(locationMetrics.barre.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fill:</span>
                      <span className="font-medium">{formatPercentage(locationMetrics.barre.fillRate)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Strength */}
              {filters.formats.includes('strength') && (
                <div className="p-2 rounded border bg-orange-50 border-orange-200">
                  <div className="font-medium text-orange-900">Strength</div>
                  <div className="space-y-1 mt-1">
                    <div className="flex justify-between">
                      <span>Sessions:</span>
                      <span className="font-medium">{formatNumber(locationMetrics.strength.sessions)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue:</span>
                      <span className="font-medium">{formatCurrency(locationMetrics.strength.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fill:</span>
                      <span className="font-medium">{formatPercentage(locationMetrics.strength.fillRate)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ComparisonTable = () => (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Location Performance Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="text-left p-3 font-semibold">Location</th>
                <th className="text-center p-3 font-semibold">Score</th>
                <th className="text-center p-3 font-semibold">Total Sessions</th>
                <th className="text-center p-3 font-semibold">Total Visits</th>
                <th className="text-center p-3 font-semibold">Total Revenue</th>
                <th className="text-center p-3 font-semibold">Fill Rate</th>
                <th className="text-center p-3 font-semibold">Best Format</th>
              </tr>
            </thead>
            <tbody>
              {locationData.map((location, index) => {
                const bestFormat = getBestPerformingFormat(location);
                const isTop3 = index < 3;
                
                return (
                  <tr key={location.location} className={`border-b border-gray-100 hover:bg-gray-50 ${
                    isTop3 ? 'bg-gradient-to-r from-yellow-50/50 to-transparent' : ''
                  }`}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {isTop3 && <Trophy className="h-4 w-4 text-yellow-500" />}
                        <span className="font-medium">{location.location}</span>
                      </div>
                    </td>
                    <td className="text-center p-3">
                      <Badge variant={isTop3 ? "default" : "secondary"} 
                             className={isTop3 ? "bg-yellow-500 text-white" : ""}>
                        {formatNumber(location.totals.score)}%
                      </Badge>
                    </td>
                    <td className="text-center p-3 font-medium">{formatNumber(location.totals.sessions)}</td>
                    <td className="text-center p-3 font-medium">{formatNumber(location.totals.visits)}</td>
                    <td className="text-center p-3 font-medium">{formatCurrency(location.totals.revenue)}</td>
                    <td className="text-center p-3 font-medium">{formatPercentage(location.totals.fillRate)}</td>
                    <td className="text-center p-3">
                      <Badge variant="outline" className={
                        bestFormat.name === 'PowerCycle' ? 'border-blue-200 text-blue-800' :
                        bestFormat.name === 'Barre' ? 'border-pink-200 text-pink-800' :
                        'border-orange-200 text-orange-800'
                      }>
                        {bestFormat.name}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Location Performance Analysis
        </h3>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {locationData.length} locations
        </Badge>
      </div>

      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="cards" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Location Cards
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Comparison Table
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cards">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {locationData.map(location => (
              <LocationCard key={location.location} locationMetrics={location} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="table">
          <ComparisonTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};