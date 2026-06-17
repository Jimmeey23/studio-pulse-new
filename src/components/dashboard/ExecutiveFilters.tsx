import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Filter, X, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';

export const ExecutiveFilters: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { filters, updateFilters, clearFilters } = useGlobalFilters();

  const handleDateRangeChange = (type: 'start' | 'end', date: Date | null) => {
    const dateString = date ? date.toISOString().split('T')[0] : '';
    updateFilters({
      dateRange: {
        ...filters.dateRange,
        [type]: dateString
      }
    });
  };

  const clearDateRange = () => {
    updateFilters({
      dateRange: { start: '', end: '' }
    });
  };

  const activeFilterCount = (filters.dateRange.start ? 1 : 0) + (filters.dateRange.end ? 1 : 0);

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-800 text-xl flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                Executive Dashboard Filters
                {activeFilterCount > 0 && (
                  <Badge className="bg-blue-600 text-white">
                    {activeFilterCount} Active
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-700">
                  <Calendar className="w-3 h-3 mr-1" />
                  Previous Month Focus
                </Badge>
                {activeFilterCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearDateRange();
                    }}
                    className="gap-1"
                  >
                    <X className="h-4 w-4" />
                    Clear All
                  </Button>
                )}
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-sm text-gray-700 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Start Date
                  </label>
                  {filters.dateRange.start && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDateRangeChange('start', null)}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.start 
                        ? format(new Date(filters.dateRange.start), 'PPP')
                        : 'Select start date'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={filters.dateRange.start ? new Date(filters.dateRange.start) : undefined}
                      onSelect={(date) => handleDateRangeChange('start', date || null)}
                      disabled={(date) => 
                        filters.dateRange.end 
                          ? date > new Date(filters.dateRange.end) 
                          : false
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-gray-500">Filter data from this date</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-sm text-gray-700 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    End Date
                  </label>
                  {filters.dateRange.end && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDateRangeChange('end', null)}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.end 
                        ? format(new Date(filters.dateRange.end), 'PPP')
                        : 'Select end date'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={filters.dateRange.end ? new Date(filters.dateRange.end) : undefined}
                      onSelect={(date) => handleDateRangeChange('end', date || null)}
                      disabled={(date) => 
                        filters.dateRange.start 
                          ? date < new Date(filters.dateRange.start) 
                          : false
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-gray-500">Filter data up to this date</p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
