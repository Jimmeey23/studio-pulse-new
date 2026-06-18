import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PowerCycleBarreStrengthEnhancedFilterSection } from './PowerCycleBarreStrengthEnhancedFilterSection';
import { PowerCycleBarreStrengthComprehensiveMetrics } from './PowerCycleBarreStrengthComprehensiveMetrics';
import { PowerCycleBarreStrengthComprehensiveComparison } from './PowerCycleBarreStrengthComprehensiveComparison';
import { PowerCycleBarreStrengthComprehensiveRankings } from './PowerCycleBarreStrengthComprehensiveRankings';
import { PowerCycleBarreStrengthDetailedAnalytics } from './PowerCycleBarreStrengthDetailedAnalytics';
import { PowerCycleBarreStrengthComprehensiveCharts } from './PowerCycleBarreStrengthComprehensiveCharts';
import { PowerCycleBarreStrengthInsightsSection } from './PowerCycleBarreStrengthInsightsSection';
import { PowerCycleBarreStrengthDrillDownModal } from './PowerCycleBarreStrengthDrillDownModal';
import { PayrollData } from '@/types/dashboard';
import { getThemeColors, getActiveTabClasses } from '@/utils/colorThemes';
import { getPreviousMonthDateRange, getPreviousMonthPeriod } from '@/utils/dateUtils';
import { logger } from '@/utils/logger';
import { 
  BarChart3, 
  Activity, 
  TrendingUp, 
  Users, 
  Eye, 
  Zap, 
  Target,
  Sparkles,
  Filter
} from 'lucide-react';

interface PowerCycleBarreStrengthComprehensiveSectionProps {
  data: PayrollData[];
}

export const PowerCycleBarreStrengthComprehensiveSection: React.FC<PowerCycleBarreStrengthComprehensiveSectionProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedLocation, setSelectedLocation] = useState('kwality');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedTrainer, setSelectedTrainer] = useState('all');
  const [didSetDefaultPeriod, setDidSetDefaultPeriod] = useState(false);
  
  const [drillDownData, setDrillDownData] = useState<any>(null);
  // Default collapsed per request
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Get powercycle theme colors
  const theme = getThemeColors('powercycle');

  // On first mount/data load, default period to previous month if available
  React.useEffect(() => {
    if (didSetDefaultPeriod) return;
    if (!data || data.length === 0) return;
    if (selectedPeriod !== 'all') return;

    const prev = getPreviousMonthPeriod(); // 'YYYY-MM'
    const hasPrev = new Set(data.map(d => d.monthYear)).has(prev);
    if (hasPrev) {
      setSelectedPeriod(prev);
      setDidSetDefaultPeriod(true);
    }
  }, [data, selectedPeriod, didSetDefaultPeriod]);

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    if (!data) return [];
    
    logger.debug('PowerCycle filtering - Input data:', data.length, 'items');
    logger.debug('Sample monthYear formats:', data.slice(0, 5).map(item => item.monthYear));
    logger.debug('Filters:', { selectedLocation, selectedPeriod, selectedTrainer });
    
    let filtered = [...data];
    
    // Apply location filter
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(item => item.location === selectedLocation);
    }
    
    // Apply trainer filter
    if (selectedTrainer !== 'all') {
      filtered = filtered.filter(item => item.teacherName === selectedTrainer);
    }
    
    // Apply period filter - filter by exact monthYear match
    if (selectedPeriod !== 'all') {
      filtered = filtered.filter(item => item.monthYear === selectedPeriod);
    }
    
    logger.debug('PowerCycle filtering - Filtered data:', filtered.length, 'items');
    return filtered;
  }, [data, selectedLocation, selectedPeriod, selectedTrainer]);

  const handleItemClick = (item: any) => {
    setDrillDownData(item);
  };

  if (!data || data.length === 0) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-6">
          <p className="text-yellow-600">No PowerCycle vs Barre vs Strength Lab data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-cyan-50/50 via-white to-teal-50/30 min-h-screen">
      {/* Modern Header with Analytics Summary */}
      <div className="relative overflow-hidden">
        <Card className={`bg-gradient-to-r ${theme.heroGradient} border-0 shadow-2xl backdrop-blur-sm`}>
          <CardHeader className="relative pb-8">
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-bold text-white mb-2">
                      PowerCycle vs Barre vs Strength Analytics
                    </CardTitle>
                    <p className="text-white/80 text-lg">
                      Comprehensive performance analysis across all class formats
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {showAdvancedFilters ? 'Hide' : 'Show'} Filters
                  </Button>
                  <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Live Data
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Enhanced Filter Section with Conditional Display */}
      {showAdvancedFilters && (
        <div className="transform transition-all duration-300 ease-in-out">
          <PowerCycleBarreStrengthEnhancedFilterSection
            data={data}
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            selectedTrainer={selectedTrainer}
            onTrainerChange={setSelectedTrainer}
          />
        </div>
      )}

      {/* Comprehensive Metrics Overview */}
      <PowerCycleBarreStrengthComprehensiveMetrics 
        data={filteredData} 
        onItemClick={handleItemClick}
      />

      {/* Main Content Tabs with Modern Design */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <Card className="bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/20 border-0 shadow-xl backdrop-blur-sm">
          <CardHeader className={`bg-gradient-to-r ${theme.heroGradient} text-white relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
            <CardTitle className="text-xl font-bold flex items-center gap-3 relative z-10">
                <div className={`w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm`}>
                <BarChart3 className="w-5 h-5 text-white" />
                </div>
              Advanced Analytics Dashboard
              <Badge className="ml-auto bg-white/20 text-white border-white/30">
                {filteredData.length} Records
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-gradient-to-br from-white to-cyan-50/20">
            <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-cyan-100/80 to-teal-100/80 p-2 rounded-xl shadow-inner backdrop-blur-sm border border-cyan-200/30">
              <TabsTrigger 
                value="dashboard" 
                className={`text-sm font-medium transition-all duration-200 rounded-lg ${getActiveTabClasses('powercycle')}`}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="comparison" 
                className={`text-sm font-medium transition-all duration-200 rounded-lg ${getActiveTabClasses('powercycle')}`}
              >
                <Target className="w-4 h-4 mr-2" />
                Comparison
              </TabsTrigger>
              <TabsTrigger 
                value="rankings" 
                className={`text-sm font-medium transition-all duration-200 rounded-lg ${getActiveTabClasses('powercycle')}`}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Rankings
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className={`text-sm font-medium transition-all duration-200 rounded-lg ${getActiveTabClasses('powercycle')}`}
              >
                <Users className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="charts" 
                className={`text-sm font-medium transition-all duration-200 rounded-lg ${getActiveTabClasses('powercycle')}`}
              >
                <Activity className="w-4 h-4 mr-2" />
                Charts
              </TabsTrigger>
              <TabsTrigger 
                value="insights" 
                className={`text-sm font-medium transition-all duration-200 rounded-lg ${getActiveTabClasses('powercycle')}`}
              >
                <Eye className="w-4 h-4 mr-2" />
                Insights
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        <TabsContent value="dashboard" className="space-y-8 mt-6">
          <div className="bg-gradient-to-br from-white to-cyan-50/30 rounded-xl p-6 shadow-lg backdrop-blur-sm border border-cyan-200/30">
            <PowerCycleBarreStrengthComprehensiveComparison 
              data={filteredData} 
              onItemClick={handleItemClick}
            />
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-8 mt-6">
          <div className="bg-gradient-to-br from-white to-cyan-50/30 rounded-xl p-6 shadow-lg backdrop-blur-sm border border-cyan-200/30">
            <PowerCycleBarreStrengthComprehensiveComparison 
              data={filteredData} 
              onItemClick={handleItemClick}
              showDetailed={true}
            />
          </div>
        </TabsContent>

        <TabsContent value="rankings" className="space-y-8 mt-6">
          <div className="bg-gradient-to-br from-white to-cyan-50/30 rounded-xl p-6 shadow-lg backdrop-blur-sm border border-cyan-200/30">
            <PowerCycleBarreStrengthComprehensiveRankings 
              data={filteredData} 
              onItemClick={handleItemClick}
            />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-8 mt-6">
          <div className="bg-gradient-to-br from-white to-cyan-50/30 rounded-xl p-6 shadow-lg backdrop-blur-sm border border-cyan-200/30">
            <PowerCycleBarreStrengthDetailedAnalytics 
              data={filteredData} 
              onItemClick={handleItemClick}
            />
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-8 mt-6">
          <div className="bg-gradient-to-br from-white to-cyan-50/30 rounded-xl p-6 shadow-lg backdrop-blur-sm border border-cyan-200/30">
            <PowerCycleBarreStrengthComprehensiveCharts 
              data={filteredData} 
              onItemClick={handleItemClick}
            />
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-8 mt-6">
          <div className="bg-gradient-to-br from-white to-cyan-50/30 rounded-xl p-6 shadow-lg backdrop-blur-sm border border-cyan-200/30">
            <PowerCycleBarreStrengthInsightsSection 
              data={filteredData} 
              onItemClick={handleItemClick}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Drill Down Modal */}
      {drillDownData && (
        <PowerCycleBarreStrengthDrillDownModal
          isOpen={!!drillDownData}
          onClose={() => setDrillDownData(null)}
          data={drillDownData}
          allData={filteredData}
        />
      )}
    </div>
  );
};

