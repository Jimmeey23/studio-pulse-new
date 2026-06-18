
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';
import { useSessionsFilters } from '@/contexts/SessionsFiltersContext';

export const PowerCycleVsBarreFilterSection: React.FC = () => {
  const { filters, updateFilters, clearAllFilters } = useSessionsFilters();

  const hasActiveFilters = filters.trainers.length > 0 || 
    filters.classTypes.length > 0 || 
    filters.dayOfWeek.length > 0 || 
    filters.timeSlots.length > 0 ||
    filters.dateRange.start || 
    filters.dateRange.end;

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-800">Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {[
                  filters.trainers.length,
                  filters.classTypes.length,
                  filters.dayOfWeek.length,
                  filters.timeSlots.length,
                  filters.dateRange.start ? 1 : 0,
                  filters.dateRange.end ? 1 : 0
                ].filter(count => count > 0).length} active
              </Badge>
            )}
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Clear All
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
