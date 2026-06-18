import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Calendar, 
  CalendarIcon,
  Users, 
  Package, 
  CreditCard,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { ExecutivePDFExportButton } from './ExecutivePDFExportButton';

interface ExecutiveFilterSectionProps {
  availableLocations: string[];
  showExportButton?: boolean;
  headerActions?: ReactNode;
  onClearFilters?: () => void;
}

export const ExecutiveFilterSection: React.FC<ExecutiveFilterSectionProps> = ({ 
  availableLocations,
  showExportButton = true,
  headerActions,
  onClearFilters,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { filters, updateFilters, clearFilters } = useGlobalFilters();

  const handleLocationSelect = (location: string) => {
    const currentLocations = Array.isArray(filters.location) ? filters.location : [];
    
    if (location === 'all') {
      updateFilters({ location: [] });
    } else {
      const isSelected = currentLocations.includes(location);
      if (isSelected) {
        updateFilters({ 
          location: currentLocations.filter(l => l !== location) 
        });
      } else {
        updateFilters({ 
          location: [location] // Only allow single location selection for executive summary
        });
      }
    }
  };

  const selectedLocation = Array.isArray(filters.location) ? filters.location[0] : filters.location;
  const hasActiveFilters = (filters.location && filters.location.length > 0) || filters.dateRange?.start || filters.dateRange?.end;

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

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Filter className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">Filters & Controls</span>
                  <p className="text-sm text-gray-600 font-normal">
                    {filters.dateRange?.start || filters.dateRange?.end 
                      ? `Custom date range${selectedLocation ? ` • ${selectedLocation}` : ''}` 
                      : `All dates${selectedLocation ? ` • ${selectedLocation}` : ''}`
                    }
                  </p>
                </div>
                {hasActiveFilters && (
                  <Badge className="bg-blue-100 text-blue-800 ml-2">
                    {(filters.location?.length || 0) + ((filters.dateRange?.start || filters.dateRange?.end) ? 1 : 0)} filter{hasActiveFilters ? 's' : ''} active
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onClearFilters) {
                        onClearFilters();
                        return;
                      }
                      clearFilters();
                    }}
                    className="text-gray-600 hover:text-red-600"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
                {showExportButton && (
                  <ExecutivePDFExportButton
                    dateRange={filters.dateRange ? { start: filters.dateRange.start, end: filters.dateRange.end } : undefined}
                    location={selectedLocation}
                    size="sm"
                    variant="outline"
                    showLabel={false}
                  />
                )}
                {headerActions}
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Date Range Filter */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Date Range Filter</h3>
                {(filters.dateRange?.start || filters.dateRange?.end) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDateRange}
                    className="text-gray-500 hover:text-red-600 ml-auto"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear Range
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-sm text-gray-700 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      Start Date
                    </label>
                    {filters.dateRange?.start && (
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
                        {filters.dateRange?.start 
                          ? format(new Date(filters.dateRange.start), 'PPP')
                          : 'Select start date'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dateRange?.start ? new Date(filters.dateRange.start) : undefined}
                        onSelect={(date) => handleDateRangeChange('start', date || null)}
                        disabled={(date) => 
                          filters.dateRange?.end 
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
                    {filters.dateRange?.end && (
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
                        {filters.dateRange?.end 
                          ? format(new Date(filters.dateRange.end), 'PPP')
                          : 'Select end date'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dateRange?.end ? new Date(filters.dateRange.end) : undefined}
                        onSelect={(date) => handleDateRangeChange('end', date || null)}
                        disabled={(date) => 
                          filters.dateRange?.start 
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
              
              {/* Date Range Info */}
              {!(filters.dateRange?.start || filters.dateRange?.end) && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    <strong>Default:</strong> Showing Jan 1, 2026 to Mar 31, 2026
                  </p>
                </div>
              )}
              
              {(filters.dateRange?.start || filters.dateRange?.end) && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700">
                    <strong>Custom Range:</strong> {' '}
                    {filters.dateRange.start && format(new Date(filters.dateRange.start), 'MMM d, yyyy')}
                    {filters.dateRange.start && filters.dateRange.end && ' to '}
                    {filters.dateRange.end && format(new Date(filters.dateRange.end), 'MMM d, yyyy')}
                  </p>
                </div>
              )}
            </div>

            {/* Location Filter */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Location Filter</h3>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={!selectedLocation ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleLocationSelect('all')}
                  className="flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  All Locations
                </Button>
                
                {availableLocations.map((location) => (
                  <Button
                    key={location}
                    variant={selectedLocation === location ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleLocationSelect(location)}
                    className="flex items-center gap-2"
                  >
                    {location}
                    {selectedLocation === location && (
                      <Badge className="bg-white/20 text-current ml-1">Active</Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Filter Summary */}
            {hasActiveFilters && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Active Filters Summary</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>Location: {selectedLocation || 'All'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Period: {(filters.dateRange?.start || filters.dateRange?.end) 
                        ? 'Custom date range' 
                        : 'Previous month default range'}
                    </span>
                  </div>
                  {(filters.dateRange?.start || filters.dateRange?.end) && (
                    <div className="flex items-center gap-2 ml-6">
                      <span className="text-xs text-gray-500">
                        {filters.dateRange.start && format(new Date(filters.dateRange.start), 'MMM d, yyyy')}
                        {filters.dateRange.start && filters.dateRange.end && ' to '}
                        {filters.dateRange.end && format(new Date(filters.dateRange.end), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
