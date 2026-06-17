
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { X, Filter, Users, DollarSign, TrendingUp } from 'lucide-react';

interface TrainerQuickFiltersProps {
  activeFilters: Record<string, string[]>;
  onFilterChange: (key: string, values: string[]) => void;
  trainerCount: number;
  totalRevenue: number;
  avgPerformance: number;
}

export const TrainerQuickFilters: React.FC<TrainerQuickFiltersProps> = ({
  activeFilters,
  onFilterChange,
  trainerCount,
  totalRevenue,
  avgPerformance
}) => {
  const clearFilter = (filterKey: string) => {
    onFilterChange(filterKey, []);
  };

  const clearAllFilters = () => {
    Object.keys(activeFilters).forEach(key => {
      onFilterChange(key, []);
    });
  };

  const activeFilterCount = Object.values(activeFilters).reduce(
    (total, values) => total + values.length, 
    0
  );

  return (
    <Card className="bg-white shadow-sm border border-gray-200 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Quick Filters</h3>
            {activeFilterCount > 0 && (
              <Badge className="bg-blue-600 text-white">
                {activeFilterCount} Active
              </Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="gap-1"
            >
              <X className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-gray-600">Trainers:</span>
            <span className="font-semibold">{trainerCount}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-gray-600">Total Revenue:</span>
            <span className="font-semibold">${totalRevenue.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-gray-600">Avg Performance:</span>
            <span className="font-semibold">{avgPerformance.toFixed(1)}</span>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(activeFilters).map(([key, values]) =>
              values.map(value => (
                <Badge
                  key={`${key}-${value}`}
                  variant="secondary"
                  className="cursor-pointer hover:bg-red-100"
                  onClick={() => clearFilter(key)}
                >
                  {value}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
