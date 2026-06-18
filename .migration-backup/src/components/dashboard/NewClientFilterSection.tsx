
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
  Users,
  MapPin,
  Tag,
  Calendar
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
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface NewClientFilterSectionProps {
  filters: import('@/types/dashboard').NewClientFilterOptions;
  onFiltersChange: (filters: import('@/types/dashboard').NewClientFilterOptions) => void;
  data: import('@/types/dashboard').NewClientData[];
}

export const NewClientFilterSection: React.FC<NewClientFilterSectionProps> = ({
  filters,
  onFiltersChange,
  data
}) => {
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Generate options from actual data, with null checks
  const options = React.useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return {
        locations: [],
        trainers: [],
        retentionStatuses: [],
        conversionStatuses: [],
        paymentMethods: [],
        isNewOptions: []
      };
    }

    return {
      locations: [...new Set(data.map(item => item.firstVisitLocation).filter(Boolean))],
      trainers: [...new Set(data.map(item => item.trainerName).filter(Boolean))],
      retentionStatuses: [...new Set(data.map(item => item.retentionStatus).filter(Boolean))],
      conversionStatuses: [...new Set(data.map(item => item.conversionStatus).filter(Boolean))],
      paymentMethods: [...new Set(data.map(item => item.paymentMethod).filter(Boolean))],
      isNewOptions: [...new Set(data.map(item => item.isNew).filter(Boolean))]
    };
  }, [data]);

  const filterConfigs = [
    {
      key: 'location',
      label: 'Locations',
      icon: MapPin,
      options: options.locations,
      values: filters.location,
      description: 'Filter by first visit location'
    },
    {
      key: 'trainer',
      label: 'Trainers',
      icon: Users,
      options: options.trainers,
      values: filters.trainer,
      description: 'Filter by trainer'
    },
    {
      key: 'retentionStatus',
      label: 'Retention Status',
      icon: Users,
      options: options.retentionStatuses,
      values: filters.retentionStatus,
      description: 'Filter by current retention status'
    },
    {
      key: 'conversionStatus',
      label: 'Conversion Status',
      icon: Tag,
      options: options.conversionStatuses,
      values: filters.conversionStatus,
      description: 'Filter by conversion status'
    }
  ];

  const handleFilterChange = (filterKey: string, value: string) => {
    const currentValues = [...(filters[filterKey as keyof typeof filters] as string[])];
    const index = currentValues.indexOf(value);
    
    if (index > -1) {
      currentValues.splice(index, 1);
    } else {
      currentValues.push(value);
    }
    
    onFiltersChange({ 
      ...filters, 
      [filterKey]: currentValues 
    });
  };

  const handleDateRangeChange = (type: 'start' | 'end', dateStr: string) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [type]: dateStr
      }
    });
  };

  const clearFilter = (filterKey: string) => {
    onFiltersChange({
      ...filters,
      [filterKey]: []
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: { start: '', end: '' },
      location: [],
      homeLocation: [],
      trainer: [],
      paymentMethod: [],
      retentionStatus: [],
      conversionStatus: [],
      isNew: []
    });
  };

  const activeFilterCount = filterConfigs.reduce((count, config) => {
    return count + config.values.length;
  }, 0) + (filters.dateRange.start ? 1 : 0) + (filters.dateRange.end ? 1 : 0);

  if (isCollapsed) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-700">Client Conversion Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {activeFilterCount} active
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCollapsed(false)}
              className="gap-2"
            >
              <ChevronDown className="w-4 h-4" />
              Expand Filters
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

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
            New Client Filters
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
              onClick={clearAllFilters}
              disabled={activeFilterCount === 0}
              className="gap-1"
            >
              <X className="h-4 w-4" />
              Clear All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(true)}
              className="gap-1"
            >
              <ChevronDown className="w-4 h-4 rotate-180" />
              Collapse
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    Start Date (First Visit)
                  </label>
                  {filters.dateRange.start && (
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => handleDateRangeChange('start', '')}
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
                       onSelect={(date) => handleDateRangeChange('start', date ? date.toISOString().split('T')[0] : '')}
                       disabled={(date) => 
                         filters.dateRange.end 
                           ? date > new Date(filters.dateRange.end)
                           : false
                       }
                       initialFocus
                     />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-gray-500">Filter by first visit date (start range)</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-sm text-gray-700 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    End Date (First Visit)
                  </label>
                  {filters.dateRange.end && (
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => handleDateRangeChange('end', '')}
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
                       onSelect={(date) => handleDateRangeChange('end', date ? date.toISOString().split('T')[0] : '')}
                       disabled={(date) => 
                         filters.dateRange.start 
                           ? date < new Date(filters.dateRange.start)
                           : false
                       }
                       initialFocus
                     />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-gray-500">Filter by first visit date (end range)</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
