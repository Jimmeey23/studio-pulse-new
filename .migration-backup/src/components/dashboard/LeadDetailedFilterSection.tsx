
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CalendarIcon, 
  Filter, 
  X, 
  ChevronDown, 
  Search,
  Tag,
  Users,
  Building,
  Activity,
  Clock
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface LeadFilters {
  source: string[];
  associate: string[];
  center: string[];
  stage: string[];
  status: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

interface LeadDetailedFilterSectionProps {
  filters?: LeadFilters;
  onFiltersChange?: (filters: LeadFilters) => void;
  onClearFilters?: () => void;
  uniqueValues?: {
    sources: string[];
    associates: string[];
    centers: string[];
    stages: string[];
    statuses: string[];
  };
}

export const LeadDetailedFilterSection: React.FC<LeadDetailedFilterSectionProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  uniqueValues
}) => {
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  // Default values if props are not provided
  const defaultFilters: LeadFilters = {
    source: [],
    associate: [],
    center: [],
    stage: [],
    status: [],
    dateRange: {
      start: null,
      end: null
    }
  };

  const currentFilters = filters || defaultFilters;
  const defaultUniqueValues = {
    sources: [],
    associates: [],
    centers: [],
    stages: [],
    statuses: []
  };
  const currentUniqueValues = uniqueValues || defaultUniqueValues;

  const filterConfigs = [
    {
      key: 'source',
      label: 'Lead Sources',
      icon: Tag,
      options: currentUniqueValues.sources,
      values: currentFilters.source as string[],
      description: 'Filter by lead generation sources'
    },
    {
      key: 'associate',
      label: 'Associates',
      icon: Users,
      options: currentUniqueValues.associates,
      values: currentFilters.associate as string[],
      description: 'Filter by sales associates'
    },
    {
      key: 'center',
      label: 'Centers',
      icon: Building,
      options: currentUniqueValues.centers,
      values: currentFilters.center as string[],
      description: 'Filter by business centers'
    },
    {
      key: 'stage',
      label: 'Lead Stages',
      icon: Activity,
      options: currentUniqueValues.stages,
      values: currentFilters.stage as string[],
      description: 'Filter by lead pipeline stages'
    },
    {
      key: 'status',
      label: 'Status',
      icon: Clock,
      options: currentUniqueValues.statuses,
      values: currentFilters.status as string[],
      description: 'Filter by lead status'
    }
  ];

  const handleFilterChange = (filterKey: string, value: string) => {
    if (!onFiltersChange) return;

    const currentValues = [...(currentFilters[filterKey as keyof typeof currentFilters] as string[])];
    const index = currentValues.indexOf(value);
    
    if (index > -1) {
      currentValues.splice(index, 1);
    } else {
      currentValues.push(value);
    }
    
    onFiltersChange({ 
      ...currentFilters, 
      [filterKey]: currentValues 
    });
  };

  const handleDateRangeChange = (type: 'start' | 'end', date: Date | null) => {
    if (!onFiltersChange) return;

    onFiltersChange({
      ...currentFilters,
      dateRange: {
        ...currentFilters.dateRange,
        [type]: date
      }
    });
  };

  const clearFilter = (filterKey: string) => {
    if (!onFiltersChange) return;

    onFiltersChange({
      ...currentFilters,
      [filterKey]: []
    });
  };

  const clearDateRange = () => {
    if (!onFiltersChange) return;

    onFiltersChange({
      ...currentFilters,
      dateRange: { start: null, end: null }
    });
  };

  const activeFilterCount = filterConfigs.reduce((count, config) => {
    return count + config.values.length;
  }, 0) + (currentFilters.dateRange.start ? 1 : 0) + (currentFilters.dateRange.end ? 1 : 0);

  const handleClearAll = () => {
    if (onClearFilters) {
      onClearFilters();
    } else if (onFiltersChange) {
      onFiltersChange(defaultFilters);
    }
  };

  const MultiSelectFilter = ({ config }: { config: typeof filterConfigs[0] }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <config.icon className="w-4 h-4 text-gray-600" />
          <label className="font-medium text-sm text-gray-700">{config.label}</label>
          {config.values.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {config.values.length}
            </Badge>
          )}
        </div>
        {config.values.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearFilter(config.key)}
            className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </Button>
        )}
      </div>
      
      <Popover 
        open={openPopover === config.key} 
        onOpenChange={(open) => setOpenPopover(open ? config.key : null)}
      >
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between text-left font-normal"
            size="sm"
          >
            <span className="truncate">
              {config.values.length > 0 
                ? `${config.values.length} selected`
                : `Select ${config.label.toLowerCase()}`
              }
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder={`Search ${config.label.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>No {config.label.toLowerCase()} found.</CommandEmpty>
              <CommandGroup>
                {config.options.map((option) => (
                  <CommandItem
                    key={option}
                    onSelect={() => handleFilterChange(config.key, option)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        config.values.includes(option)
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}>
                        <Search className="h-3 w-3" />
                      </div>
                      <span>{option}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {config.values.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {config.values.slice(0, 3).map((value) => (
            <Badge 
              key={value} 
              variant="secondary" 
              className="text-xs cursor-pointer hover:bg-red-100"
              onClick={() => handleFilterChange(config.key, value)}
            >
              {value}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          {config.values.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{config.values.length - 3} more
            </Badge>
          )}
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-1">{config.description}</p>
    </div>
  );

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            Advanced Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Badge className="bg-blue-600 text-white">
                {activeFilterCount} Active
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearAll}
              disabled={activeFilterCount === 0}
              className="gap-1"
            >
              <X className="h-4 w-4" />
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <Tabs defaultValue="filters" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="filters">Filter Options</TabsTrigger>
            <TabsTrigger value="dateRange">Date Range</TabsTrigger>
          </TabsList>
          
          <TabsContent value="filters" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterConfigs.map((config) => (
                <MultiSelectFilter key={config.key} config={config} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="dateRange" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-sm text-gray-700 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Start Date
                  </label>
                  {currentFilters.dateRange.start && (
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
                      {currentFilters.dateRange.start 
                        ? format(currentFilters.dateRange.start, 'PPP')
                        : 'Select start date'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={currentFilters.dateRange.start || undefined}
                      onSelect={(date) => handleDateRangeChange('start', date || null)}
                      disabled={(date) => 
                        currentFilters.dateRange.end 
                          ? date > currentFilters.dateRange.end 
                          : false
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-sm text-gray-700 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    End Date
                  </label>
                  {currentFilters.dateRange.end && (
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
                      {currentFilters.dateRange.end 
                        ? format(currentFilters.dateRange.end, 'PPP')
                        : 'Select end date'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={currentFilters.dateRange.end || undefined}
                      onSelect={(date) => handleDateRangeChange('end', date || null)}
                      disabled={(date) => 
                        currentFilters.dateRange.start 
                          ? date < currentFilters.dateRange.start 
                          : false
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {(currentFilters.dateRange.start || currentFilters.dateRange.end) && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Selected Range:</strong> {' '}
                  {currentFilters.dateRange.start && format(currentFilters.dateRange.start, 'MMM d, yyyy')}
                  {currentFilters.dateRange.start && currentFilters.dateRange.end && ' to '}
                  {currentFilters.dateRange.end && format(currentFilters.dateRange.end, 'MMM d, yyyy')}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearDateRange}
                  className="text-blue-600 border-blue-600 hover:bg-blue-100"
                >
                  Clear Range
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
