
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuickFiltersProps {
  filters: {
    locations: string[];
    trainers: string[];
    classes: string[];
    days: string[];
  };
  options: {
    locations: string[];
    trainers: string[];
    classes: string[];
    days: string[];
  };
  onFilterChange: (type: string, values: string[]) => void;
  onClearAll: () => void;
}

export const SessionsQuickFilters: React.FC<QuickFiltersProps> = ({
  filters,
  options,
  onFilterChange,
  onClearAll
}) => {
  const handleQuickSelect = (type: string, value: string) => {
    // Debug log removed for production
    const currentValues = [...(filters[type as keyof typeof filters] || [])];
    const index = currentValues.indexOf(value);
    
    if (index > -1) {
      currentValues.splice(index, 1);
    } else {
      currentValues.push(value);
    }
    
    // Debug log removed for production
    onFilterChange(type, currentValues);
  };

  const totalActiveFilters = Object.values(filters).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            Quick Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            {totalActiveFilters > 0 && (
              <Badge className="bg-blue-600 text-white text-xs">
                {totalActiveFilters} active
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearAll}
              disabled={totalActiveFilters === 0}
              className="gap-1 h-7 px-2 text-xs"
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Days Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Days of Week</label>
          <div className="flex flex-wrap gap-1">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
              <Button
                key={day}
                variant={filters.days?.includes(day) ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickSelect('days', day)}
                className="h-7 px-3 text-xs"
              >
                {day.slice(0, 3)}
              </Button>
            ))}
          </div>
        </div>

        {/* Top Trainers Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Popular Trainers</label>
          <div className="flex flex-wrap gap-1">
            {options.trainers?.slice(0, 6).map((trainer) => (
              <Button
                key={trainer}
                variant={filters.trainers?.includes(trainer) ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickSelect('trainers', trainer)}
                className="h-7 px-3 text-xs"
              >
                {trainer}
              </Button>
            ))}
          </div>
        </div>

        {/* Popular Classes Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Popular Classes</label>
          <div className="flex flex-wrap gap-1">
            {options.classes?.slice(0, 8).map((className) => (
              <Button
                key={className}
                variant={filters.classes?.includes(className) ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickSelect('classes', className)}
                className="h-7 px-3 text-xs"
              >
                {className}
              </Button>
            ))}
          </div>
        </div>

        {/* Active Filters Display */}
        {totalActiveFilters > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-600 mb-2">Active Filters:</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(filters).map(([type, values]) =>
                (values || []).map((value) => (
                  <Badge 
                    key={`${type}-${value}`} 
                    variant="secondary" 
                    className="text-xs cursor-pointer hover:bg-red-100"
                    onClick={() => handleQuickSelect(type, value)}
                  >
                    {value}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
