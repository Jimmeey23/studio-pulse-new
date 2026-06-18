import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar, ChevronDown, MapPin, User, X, Filter, Search, DollarSign, Target, Activity } from 'lucide-react';
import { PayrollData } from '@/types/dashboard';

const MONTH_LABEL_TO_INDEX: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

const parseTrainerMonthLabel = (value: string) => {
  if (!value) return null;

  const normalized = value.replace(/-/g, ' ').trim();
  const parsed = new Date(`1 ${normalized}`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
};

const canonicalizeTrainerMonthLabel = (value: string) => {
  const parsed = parseTrainerMonthLabel(value);
  if (!parsed) return value;

  const monthLabel = parsed.toLocaleDateString('en-US', { month: 'short' });
  return `${monthLabel}-${parsed.getFullYear()}`;
};

const sortTrainerMonthsDesc = (months: string[]) =>
  [...months].sort((a, b) => {
    const aDate = parseTrainerMonthLabel(a)?.getTime() ?? 0;
    const bDate = parseTrainerMonthLabel(b)?.getTime() ?? 0;
    return bDate - aDate;
  });

const formatMonthSelectionLabel = (months: string[]) => {
  if (months.length === 0) return 'All Months';
  if (months.length === 1) return months[0];
  if (months.length === 2) return `${months[0]}, ${months[1]}`;
  return `${months.length} months selected`;
};

interface TrainerFilterSectionProps {
  data: PayrollData[];
  onFiltersChange: (filters: any) => void;
  activeLocation?: string;
  activeMonths?: string[];
  defaultLocation?: string;
  defaultMonths?: string[];
  onLocationChange?: (location: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface EnhancedFilters {
  location: string;
  trainer: string;
  months: string[];
  searchTerm: string;
  minSessions: string;
  maxSessions: string;
  minRevenue: string;
  maxRevenue: string;
  performanceLevel: string;
  classType: string;
}

export const TrainerFilterSection: React.FC<TrainerFilterSectionProps> = ({
  data,
  onFiltersChange,
  activeLocation,
  activeMonths,
  defaultLocation,
  defaultMonths,
  onLocationChange,
  isCollapsed,
  onToggleCollapse
}) => {
  const [filters, setFilters] = useState<EnhancedFilters>({
    location: 'all',
    trainer: 'all',
    months: [],
    searchTerm: '',
    minSessions: '',
    maxSessions: '',
    minRevenue: '',
    maxRevenue: '',
    performanceLevel: 'all',
    classType: 'all'
  });

  // Extract unique values from data
  const locations = Array.from(new Set(data.map(item => item.location))).filter(Boolean);
  const trainers = Array.from(new Set(data.map(item => item.teacherName))).filter(Boolean);
  const months = sortTrainerMonthsDesc(Array.from(new Set(data.map(item => canonicalizeTrainerMonthLabel(item.monthYear || '')))).filter(Boolean));

  useEffect(() => {
    const normalizedLocation = !activeLocation || activeLocation === 'All Locations' ? 'all' : activeLocation;
    setFilters((prev) => prev.location === normalizedLocation ? prev : { ...prev, location: normalizedLocation });
  }, [activeLocation]);

  useEffect(() => {
    const normalizedMonths = (activeMonths || []).filter(Boolean);
    setFilters((prev) => {
      const prevKey = prev.months.join('|');
      const nextKey = normalizedMonths.join('|');
      return prevKey === nextKey ? prev : { ...prev, months: normalizedMonths };
    });
  }, [activeMonths]);

  // Performance levels for filtering
  const performanceLevels = [
    { value: 'all', label: 'All Performance Levels' },
    { value: 'high', label: 'High Performers (Top 25%)' },
    { value: 'medium', label: 'Medium Performers (25-75%)' },
    { value: 'low', label: 'Low Performers (Bottom 25%)' }
  ];

  // Class types (basic categorization)
  const classTypes = [
    { value: 'all', label: 'All Class Types' },
    { value: 'cycle', label: 'Cycle Classes' },
    { value: 'barre', label: 'Barre Classes' },
    { value: 'strength', label: 'Strength Classes' }
  ];

  // Update filters and notify parent
  const updateFilters = (newFilters: Partial<EnhancedFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Convert to format expected by parent
    const parentFilters = {
      location: updatedFilters.location === 'all' ? '' : updatedFilters.location,
      trainer: updatedFilters.trainer === 'all' ? '' : updatedFilters.trainer,
      month: updatedFilters.months.length === 1 ? updatedFilters.months[0] : '',
      months: updatedFilters.months,
      searchTerm: updatedFilters.searchTerm || '',
      performanceLevel: updatedFilters.performanceLevel === 'all' ? '' : updatedFilters.performanceLevel,
      classType: updatedFilters.classType === 'all' ? '' : updatedFilters.classType,
      minSessions: updatedFilters.minSessions ? Number(updatedFilters.minSessions) : null,
      maxSessions: updatedFilters.maxSessions ? Number(updatedFilters.maxSessions) : null,
      minRevenue: updatedFilters.minRevenue ? Number(updatedFilters.minRevenue) : null,
      maxRevenue: updatedFilters.maxRevenue ? Number(updatedFilters.maxRevenue) : null
    };
    
    onFiltersChange(parentFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const resetLocation = defaultLocation && defaultLocation !== 'All Locations' ? defaultLocation : 'all';
    const resetMonths = defaultMonths || [];
    const clearedFilters: EnhancedFilters = {
      location: resetLocation,
      trainer: 'all',
      months: resetMonths,
      searchTerm: '',
      minSessions: '',
      maxSessions: '',
      minRevenue: '',
      maxRevenue: '',
      performanceLevel: 'all',
      classType: 'all'
    };
    setFilters(clearedFilters);
    updateFilters(clearedFilters);
    onLocationChange?.(resetLocation === 'all' ? 'All Locations' : resetLocation);
  };

  // Check if any filters are active
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'months') {
      return Array.isArray(value) && value.length > 0;
    }
    if (key === 'searchTerm' || key.includes('min') || key.includes('max')) {
      return value !== '';
    }
    return value !== '' && value !== 'all';
  });

  // Get active filter count
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'months') {
      return Array.isArray(value) && value.length > 0;
    }
    if (key === 'searchTerm' || key.includes('min') || key.includes('max')) {
      return value !== '';
    }
    return value !== '' && value !== 'all';
  }).length;

  const toggleMonth = (month: string) => {
    const nextMonths = filters.months.includes(month)
      ? filters.months.filter((item) => item !== month)
      : sortTrainerMonthsDesc([...filters.months, month]);

    updateFilters({ months: nextMonths });
  };

  if (isCollapsed) {
    return (
      <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Enhanced Filters</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs">
                  {activeFilterCount} active
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="text-blue-600 hover:text-blue-700"
            >
              Show Filters
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            Enhanced Trainer Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-slate-600 hover:text-slate-700"
              >
                <X className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="text-blue-600 hover:text-blue-700"
            >
              Hide Filters
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Basic Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-600" />
              Search Trainers
            </Label>
            <Input
              placeholder="Search by name..."
              value={filters.searchTerm}
              onChange={(e) => updateFilters({ searchTerm: e.target.value })}
              className="h-9"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Location
            </Label>
            <Select value={filters.location} onValueChange={(value) => {
              updateFilters({ location: value });
              onLocationChange?.(value === 'all' ? 'All Locations' : value);
            }}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trainer */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Trainer
            </Label>
            <Select value={filters.trainer} onValueChange={(value) => updateFilters({ trainer: value })}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Trainers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trainers</SelectItem>
                {trainers.map((trainer) => (
                  <SelectItem key={trainer} value={trainer}>
                    {trainer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Period
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 w-full justify-between border-slate-200 font-normal text-slate-700 hover:bg-slate-50">
                  <span className="truncate">{formatMonthSelectionLabel(filters.months)}</span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 max-h-96 overflow-y-auto bg-white">
                <DropdownMenuLabel>Choose one or more months</DropdownMenuLabel>
                <div className="flex gap-2 px-2 pb-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => updateFilters({ months: months })}
                  >
                    Select all
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => updateFilters({ months: defaultMonths || [] })}
                  >
                    Previous month
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => updateFilters({ months: [] })}
                  >
                    Clear
                  </Button>
                </div>
                <DropdownMenuSeparator />
                {months.map((month) => (
                  <DropdownMenuCheckboxItem
                    key={month}
                    checked={filters.months.includes(month)}
                    onCheckedChange={() => toggleMonth(month)}
                    onSelect={(event) => event.preventDefault()}
                  >
                    {month}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Advanced Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Performance Level */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              Performance Level
            </Label>
            <Select value={filters.performanceLevel} onValueChange={(value) => updateFilters({ performanceLevel: value })}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Performance Levels" />
              </SelectTrigger>
              <SelectContent>
                {performanceLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Class Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Class Type
            </Label>
            <Select value={filters.classType} onValueChange={(value) => updateFilters({ classType: value })}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Class Types" />
              </SelectTrigger>
              <SelectContent>
                {classTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Range Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sessions Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Sessions Range
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  placeholder="Min sessions"
                  type="number"
                  value={filters.minSessions}
                  onChange={(e) => updateFilters({ minSessions: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <Input
                  placeholder="Max sessions"
                  type="number"
                  value={filters.maxSessions}
                  onChange={(e) => updateFilters({ maxSessions: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {/* Revenue Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              Revenue Range
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  placeholder="Min revenue"
                  type="number"
                  value={filters.minRevenue}
                  onChange={(e) => updateFilters({ minRevenue: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <Input
                  placeholder="Max revenue"
                  type="number"
                  value={filters.maxRevenue}
                  onChange={(e) => updateFilters({ maxRevenue: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-600">Active Filters:</span>
              {Object.entries(filters).map(([key, value]) => {
                // Don't show inactive filters
                if (key === 'months') {
                  if (!Array.isArray(value) || value.length === 0) return null;
                  return (
                    <Badge key={key} variant="secondary" className="text-xs">
                      period: {formatMonthSelectionLabel(value)}
                      <button
                        onClick={() => updateFilters({ months: [] })}
                        className="ml-1 hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                }

                if (key === 'searchTerm' || key.includes('min') || key.includes('max')) {
                  if (!value) return null;
                } else {
                  if (!value || value === 'all') return null;
                }
                
                const displayValue = key.includes('min') || key.includes('max') ? 
                  `${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${value}` : 
                  `${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${value}`;
                return (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {displayValue}
                    <button
                      onClick={() => {
                        const resetValue = (key === 'searchTerm' || key.includes('min') || key.includes('max')) ? '' : 'all';
                        updateFilters({ [key]: resetValue } as Partial<EnhancedFilters>);
                      }}
                      className="ml-1 hover:text-blue-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};