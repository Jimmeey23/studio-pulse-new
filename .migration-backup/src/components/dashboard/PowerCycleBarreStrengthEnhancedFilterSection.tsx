import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  BarChart3, 
  Calendar, 
  MapPin, 
  User, 
  Clock,
  Dumbbell
} from 'lucide-react';
import { PayrollData } from '@/types/dashboard';
import { getPreviousMonthPeriod } from '@/utils/dateUtils';

interface PowerCycleBarreStrengthEnhancedFilterSectionProps {
  data: PayrollData[];
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  selectedTrainer: string;
  onTrainerChange: (trainer: string) => void;
}

export const PowerCycleBarreStrengthEnhancedFilterSection: React.FC<PowerCycleBarreStrengthEnhancedFilterSectionProps> = ({
  data,
  selectedLocation,
  onLocationChange,
  selectedPeriod,
  onPeriodChange,
  selectedTrainer,
  onTrainerChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const filterOptions = useMemo(() => {
    const locations = [...new Set(data.map(d => d.location))].filter(Boolean).sort();
    const trainers = [...new Set(data.map(d => d.teacherName))].filter(Boolean).sort();
    const monthYears = [...new Set(data.map(d => d.monthYear))].filter(Boolean).sort();

    return { locations, trainers, monthYears };
  }, [data]);

  const periods = [
    { value: 'all', label: 'All Periods' },
    ...filterOptions.monthYears.map(monthYear => ({
      value: monthYear,
      label: monthYear
    }))
  ];

  // Default period to previous month if not set and available
  React.useEffect(() => {
    if (selectedPeriod !== 'all') return;
    if (!filterOptions.monthYears || filterOptions.monthYears.length === 0) return;
    const prev = getPreviousMonthPeriod();
    if (filterOptions.monthYears.includes(prev)) {
      onPeriodChange(prev);
    }
  }, [filterOptions.monthYears, selectedPeriod, onPeriodChange]);

  const hasActiveFilters = selectedLocation !== 'all' || 
    selectedPeriod !== 'all' || 
    selectedTrainer !== 'all';

  const activeFilterCount = [
    selectedLocation !== 'all' ? 1 : 0,
    selectedPeriod !== 'all' ? 1 : 0,
    selectedTrainer !== 'all' ? 1 : 0
  ].filter(count => count > 0).length;

  const clearAllFilters = () => {
    onLocationChange('all');
    onPeriodChange('all');
    onTrainerChange('all');
  };

  return (
    <Card className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 border-0 shadow-xl overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter className="w-6 h-6" />
                <div>
                  <h3 className="text-xl font-bold">PowerCycle vs Barre vs Strength Filters</h3>
                  <p className="text-blue-100 text-sm">Customize your comprehensive analysis</p>
                </div>
                {hasActiveFilters && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    {activeFilterCount} Active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAllFilters();
                    }}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                )}
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-slate-800">Advanced Filter Options</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Location Filter */}
              <div className="space-y-2">
                <Label htmlFor="location-select" className="text-slate-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-500" />
                  Location
                </Label>
                <Select value={selectedLocation} onValueChange={onLocationChange}>
                  <SelectTrigger id="location-select" className="bg-white border-slate-200">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="all">All Locations</SelectItem>
                    {filterOptions.locations.map(location => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Period Filter */}
              <div className="space-y-2">
                <Label htmlFor="period-select" className="text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Period
                </Label>
                <Select value={selectedPeriod} onValueChange={onPeriodChange}>
                  <SelectTrigger id="period-select" className="bg-white border-slate-200">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    {periods.map(period => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Trainer Filter */}
              <div className="space-y-2">
                <Label htmlFor="trainer-select" className="text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-500" />
                  Trainer
                </Label>
                <Select value={selectedTrainer} onValueChange={onTrainerChange}>
                  <SelectTrigger id="trainer-select" className="bg-white border-slate-200">
                    <SelectValue placeholder="Select trainer" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="all">All Trainers</SelectItem>
                    {filterOptions.trainers.map(trainer => (
                      <SelectItem key={trainer} value={trainer}>
                        {trainer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Summary */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {selectedLocation !== 'all' && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <MapPin className="w-3 h-3 mr-1" />
                      {selectedLocation}
                    </Badge>
                  )}
                  {selectedPeriod !== 'all' && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Calendar className="w-3 h-3 mr-1" />
                      {periods.find(p => p.value === selectedPeriod)?.label}
                    </Badge>
                  )}
                  {selectedTrainer !== 'all' && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      <User className="w-3 h-3 mr-1" />
                      {selectedTrainer}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-slate-600">
                  {data.length} total records available
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};