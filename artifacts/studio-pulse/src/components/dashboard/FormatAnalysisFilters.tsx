import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Calendar, MapPin, RefreshCw, TrendingUp, BarChart3 } from 'lucide-react';
import { PayrollData } from '@/types/dashboard';

interface FormatAnalysisFiltersProps {
  data: PayrollData[];
  onFiltersChange: (filters: FormatFilters) => void;
}

export interface FormatFilters {
  dateRange: {
    start: string;
    end: string;
    period: 'all' | 'last3months' | 'last6months' | 'last12months' | 'ytd' | 'custom';
  };
  locations: string[];
  formats: ('cycle' | 'barre' | 'strength')[];
  compareBy: 'month' | 'quarter' | 'location' | 'format';
  showEmpty: boolean;
}

export const FormatAnalysisFilters: React.FC<FormatAnalysisFiltersProps> = ({ 
  data, 
  onFiltersChange 
}) => {
  const [filters, setFilters] = useState<FormatFilters>({
    dateRange: {
      start: '',
      end: '',
      period: 'all'
    },
    locations: [],
    formats: ['cycle', 'barre', 'strength'],
    compareBy: 'format',
    showEmpty: true
  });

  // Extract unique values from data
  const uniqueLocations = React.useMemo(() => {
    return Array.from(new Set(data.map(item => item.location).filter(Boolean)));
  }, [data]);

  const uniqueMonths = React.useMemo(() => {
    return Array.from(new Set(data.map(item => item.monthYear).filter(Boolean))).sort();
  }, [data]);

  const handleFilterChange = (key: keyof FormatFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleLocationToggle = (location: string) => {
    const newLocations = filters.locations.includes(location)
      ? filters.locations.filter(l => l !== location)
      : [...filters.locations, location];
    handleFilterChange('locations', newLocations);
  };

  const handleFormatToggle = (format: 'cycle' | 'barre' | 'strength') => {
    const newFormats = filters.formats.includes(format)
      ? filters.formats.filter(f => f !== format)
      : [...filters.formats, format];
    handleFilterChange('formats', newFormats);
  };

  const resetFilters = () => {
    const defaultFilters: FormatFilters = {
      dateRange: {
        start: '',
        end: '',
        period: 'all'
      },
      locations: [],
      formats: ['cycle', 'barre', 'strength'],
      compareBy: 'format',
      showEmpty: true
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const getDateRangeLabel = () => {
    switch (filters.dateRange.period) {
      case 'last3months': return 'Last 3 Months';
      case 'last6months': return 'Last 6 Months';
      case 'last12months': return 'Last 12 Months';
      case 'ytd': return 'Year to Date';
      case 'custom': return 'Custom Range';
      default: return 'All Time';
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
            <Select 
              value={filters.dateRange.period} 
              onValueChange={(value) => handleFilterChange('dateRange', { ...filters.dateRange, period: value as any })}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="last3months">Last 3 Months</SelectItem>
                <SelectItem value="last6months">Last 6 Months</SelectItem>
                <SelectItem value="last12months">Last 12 Months</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location Filter */}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Location:</span>
            <MultiSelect
              options={uniqueLocations}
              selected={filters.locations}
              onChange={(selected) => handleFilterChange('locations', selected)}
              placeholder="All Locations"
            />
          </div>

          {/* Compare By Filter */}
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">View:</span>
            <Select 
              value={filters.compareBy} 
              onValueChange={(value) => handleFilterChange('compareBy', value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="format">By Format</SelectItem>
                <SelectItem value="month">By Month</SelectItem>
                <SelectItem value="quarter">By Quarter</SelectItem>
                <SelectItem value="location">By Location</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetFilters}
            className="ml-auto flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset Filters
          </Button>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          {/* Format Selection */}
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Formats:</span>
            <div className="flex gap-2">
              {[
                { key: 'cycle', label: 'PowerCycle', color: 'blue' },
                { key: 'barre', label: 'Barre', color: 'pink' },
                { key: 'strength', label: 'Strength', color: 'orange' }
              ].map(format => (
                <Button
                  key={format.key}
                  variant={filters.formats.includes(format.key as any) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFormatToggle(format.key as any)}
                  className={`h-8 px-3 ${
                    filters.formats.includes(format.key as any)
                      ? format.color === 'blue' ? 'bg-blue-500 hover:bg-blue-600' :
                        format.color === 'pink' ? 'bg-pink-500 hover:bg-pink-600' :
                        'bg-orange-500 hover:bg-orange-600'
                      : ''
                  }`}
                >
                  {format.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-4 ml-auto">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.showEmpty}
                onChange={(e) => handleFilterChange('showEmpty', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">Include empty sessions</span>
            </label>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {(filters.locations.length > 0 || filters.formats.length < 3 || filters.dateRange.period !== 'all' || !filters.showEmpty) && (
        <div className="flex flex-wrap items-center gap-2 px-4">
          <span className="text-sm font-medium text-gray-600">Active filters:</span>
          
          {filters.dateRange.period !== 'all' && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              <Calendar className="h-3 w-3 mr-1" />
              {getDateRangeLabel()}
            </Badge>
          )}
          
          {filters.locations.length > 0 && (
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
              <MapPin className="h-3 w-3 mr-1" />
              {filters.locations.length === 1 ? filters.locations[0] : `${filters.locations.length} locations`}
            </Badge>
          )}
          
          {filters.formats.length < 3 && (
            <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
              <BarChart3 className="h-3 w-3 mr-1" />
              {filters.formats.length} format{filters.formats.length !== 1 ? 's' : ''}
            </Badge>
          )}
          
          {!filters.showEmpty && (
            <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
              Excluding empty sessions
            </Badge>
          )}

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetFilters}
            className="text-xs text-gray-500 hover:text-gray-700 ml-2"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};