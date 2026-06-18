import React, { useState } from 'react';
import { 
  Check, 
  ChevronDown, 
  Calendar as CalendarIcon, 
  X,
  Tag
} from 'lucide-react';
import { useLeads } from '@/contexts/LeadContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function FilterPanel() {
  const { 
    filters, 
    setFilters, 
    clearFilters, 
    sourceOptions, 
    associateOptions, 
    centerOptions, 
    stageOptions, 
    statusOptions 
  } = useLeads();
  
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [associateOpen, setAssociateOpen] = useState(false);
  const [centerOpen, setCenterOpen] = useState(false);
  const [stageOpen, setStageOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  
  const handleSourceChange = (value: string) => {
    const currentValues = [...filters.source];
    const index = currentValues.indexOf(value);
    
    if (index > -1) {
      currentValues.splice(index, 1);
    } else {
      currentValues.push(value);
    }
    
    setFilters({ ...filters, source: currentValues });
  };
  
  const handleAssociateChange = (value: string) => {
    const currentValues = [...filters.associate];
    const index = currentValues.indexOf(value);
    
    if (index > -1) {
      currentValues.splice(index, 1);
    } else {
      currentValues.push(value);
    }
    
    setFilters({ ...filters, associate: currentValues });
  };
  
  const handleCenterChange = (value: string) => {
    const currentValues = [...filters.center];
    const index = currentValues.indexOf(value);
    
    if (index > -1) {
      currentValues.splice(index, 1);
    } else {
      currentValues.push(value);
    }
    
    setFilters({ ...filters, center: currentValues });
  };
  
  const handleStageChange = (value: string) => {
    const currentValues = [...filters.stage];
    const index = currentValues.indexOf(value);
    
    if (index > -1) {
      currentValues.splice(index, 1);
    } else {
      currentValues.push(value);
    }
    
    setFilters({ ...filters, stage: currentValues });
  };
  
  const handleStatusChange = (value: string) => {
    const currentValues = [...filters.status];
    const index = currentValues.indexOf(value);
    
    if (index > -1) {
      currentValues.splice(index, 1);
    } else {
      currentValues.push(value);
    }
    
    setFilters({ ...filters, status: currentValues });
  };
  
  const handleStartDateChange = (date: Date | null) => {
    setFilters({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        start: date
      }
    });
  };
  
  const handleEndDateChange = (date: Date | null) => {
    setFilters({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        end: date
      }
    });
  };
  
  const handleClearDateRange = () => {
    setFilters({
      ...filters,
      dateRange: {
        start: null,
        end: null
      }
    });
    setDatePopoverOpen(false);
  };
  
  // Count active filters
  const activeFilterCount = 
    filters.source.length + 
    filters.associate.length + 
    filters.center.length + 
    filters.stage.length + 
    filters.status.length + 
    (filters.dateRange.start ? 1 : 0) + 
    (filters.dateRange.end ? 1 : 0);
  
  const renderFilterBadge = (label: string, count: number) => {
    if (count === 0) return null;
    
    return (
      <Badge variant="outline" className="bg-primary/10 hover:bg-primary/20 ml-2 gap-1">
        {label}: {count} <X className="h-3 w-3 cursor-pointer" />
      </Badge>
    );
  };
  
  const MultiSelectFilter = ({ 
    title, 
    options, 
    selectedValues, 
    onValueChange, 
    open, 
    setOpen,
    icon 
  }: {
    title: string;
    options: string[];
    selectedValues: string[];
    onValueChange: (value: string) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
    icon?: React.ReactNode;
  }) => (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2 h-9">
          {icon}
          {title}
          {selectedValues.length > 0 && (
            <Badge className="ml-1 bg-primary">{selectedValues.length}</Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${title.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No {title.toLowerCase()} found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  onSelect={() => onValueChange(option)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <div className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      selectedValues.includes(option)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}>
                      <Check className="h-3 w-3" />
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
  );
  
  return (
    <Card className="p-4 shadow-md border-border/30 animate-fade-in bg-white">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center">
            <h3 className="font-medium text-base">Active Filters</h3>
            {activeFilterCount > 0 ? (
              <Badge className="ml-2 bg-primary">{activeFilterCount}</Badge>
            ) : (
              <span className="ml-2 text-sm text-muted-foreground">No active filters</span>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearFilters}
            disabled={activeFilterCount === 0}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear All
          </Button>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {/* Source Filter */}
          <MultiSelectFilter
            title="Source"
            options={sourceOptions}
            selectedValues={filters.source}
            onValueChange={handleSourceChange}
            open={sourceOpen}
            setOpen={setSourceOpen}
            icon={<Tag className="h-4 w-4" />}
          />
          
          {/* Associate Filter */}
          <MultiSelectFilter
            title="Associate"
            options={associateOptions}
            selectedValues={filters.associate}
            onValueChange={handleAssociateChange}
            open={associateOpen}
            setOpen={setAssociateOpen}
          />
          
          {/* Center Filter */}
          <MultiSelectFilter
            title="Center"
            options={centerOptions}
            selectedValues={filters.center}
            onValueChange={handleCenterChange}
            open={centerOpen}
            setOpen={setCenterOpen}
          />
          
          {/* Status Filter */}
          <MultiSelectFilter
            title="Status"
            options={statusOptions}
            selectedValues={filters.status}
            onValueChange={handleStatusChange}
            open={statusOpen}
            setOpen={setStatusOpen}
          />
          
          {/* Stage Filter */}
          <MultiSelectFilter
            title="Stage"
            options={stageOptions}
            selectedValues={filters.stage}
            onValueChange={handleStageChange}
            open={stageOpen}
            setOpen={setStageOpen}
          />
          
          {/* Date Range Filter */}
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Date Range
                {(filters.dateRange.start || filters.dateRange.end) && (
                  <Badge className="ml-1 bg-primary">
                    {filters.dateRange.start && filters.dateRange.end ? '2' : '1'}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex flex-col space-y-2 p-2">
                <div className="flex flex-col gap-2 pb-4">
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium">Start Date</label>
                      {filters.dateRange.start && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleStartDateChange(null)}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Clear</span>
                        </Button>
                      )}
                    </div>
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.start || undefined}
                      onSelect={handleStartDateChange}
                      initialFocus
                      disabled={(date) => 
                        filters.dateRange.end 
                          ? date > filters.dateRange.end 
                          : false
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium">End Date</label>
                      {filters.dateRange.end && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleEndDateChange(null)}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Clear</span>
                        </Button>
                      )}
                    </div>
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.end || undefined}
                      onSelect={handleEndDateChange}
                      initialFocus
                      disabled={(date) => 
                        filters.dateRange.start 
                          ? date < filters.dateRange.start 
                          : false
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClearDateRange}
                  >
                    Clear Range
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => setDatePopoverOpen(false)}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 text-sm">
            <span className="font-medium text-muted-foreground">Active:</span>
            {filters.source.length > 0 && renderFilterBadge('Source', filters.source.length)}
            {filters.associate.length > 0 && renderFilterBadge('Associate', filters.associate.length)}
            {filters.center.length > 0 && renderFilterBadge('Center', filters.center.length)}
            {filters.stage.length > 0 && renderFilterBadge('Stage', filters.stage.length)}
            {filters.status.length > 0 && renderFilterBadge('Status', filters.status.length)}
            {(filters.dateRange.start || filters.dateRange.end) && (
              <Badge variant="outline" className="bg-primary/10 hover:bg-primary/20 gap-1">
                Date: {filters.dateRange.start && format(filters.dateRange.start, 'MMM d')}
                {filters.dateRange.start && filters.dateRange.end && ' to '}
                {filters.dateRange.end && format(filters.dateRange.end, 'MMM d')}
                <X className="h-3 w-3 cursor-pointer" onClick={handleClearDateRange} />
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
