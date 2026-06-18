import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Filter, X, ChevronDown, ChevronUp, Calendar, MapPin, Users, Clock, BarChart3, Building2, Target, Hash, User } from 'lucide-react';
import { useSessionsFilters } from '@/contexts/SessionsFiltersContext';
import { SessionData } from '@/hooks/useSessionsData';
import { Input } from '@/components/ui/input';

interface EnhancedClassAttendanceFilterSectionProps {
  data: SessionData[];
}

export const EnhancedClassAttendanceFilterSection: React.FC<EnhancedClassAttendanceFilterSectionProps> = ({ data }) => {
  const { filters, updateFilters, clearAllFilters } = useSessionsFilters();
  const [isOpen, setIsOpen] = useState(false); // Changed to collapsed by default
  const [minClassesFilter, setMinClassesFilter] = useState(2);

  const filterOptions = useMemo(() => {
    const trainers = [...new Set(data.map(d => d.trainerName))].filter(Boolean).sort();
    const classTypes = [...new Set(data.map(d => d.cleanedClass))].filter(Boolean).sort();
    const dayOfWeek = [...new Set(data.map(d => d.dayOfWeek))].filter(Boolean).sort();
    const timeSlots = [...new Set(data.map(d => d.time))].filter(Boolean).sort();
    const locations = [...new Set(data.map(d => d.location))].filter(Boolean).sort();
    const formats = [...new Set(data.map(d => d.cleanedClass || d.classType))].filter(Boolean).sort();

    return { trainers, classTypes, dayOfWeek, timeSlots, locations, formats };
  }, [data]);

  const hasActiveFilters = filters.trainers.length > 0 || 
    filters.classTypes.length > 0 || 
    filters.dayOfWeek.length > 0 || 
    filters.timeSlots.length > 0 ||
    filters.dateRange.start || 
    filters.dateRange.end ||
    minClassesFilter > 1;

  const activeFilterCount = [
    filters.trainers.length,
    filters.classTypes.length,
    filters.dayOfWeek.length,
    filters.timeSlots.length,
    filters.dateRange.start ? 1 : 0,
    filters.dateRange.end ? 1 : 0,
    minClassesFilter > 1 ? 1 : 0
  ].filter(count => count > 0).length;

  const clearAllFiltersWithMinClasses = () => {
    clearAllFilters();
    setMinClassesFilter(2);
  };

  return (
    <Card className="bg-gradient-to-br from-white/95 to-slate-50/95 backdrop-blur-sm border-red-200 shadow-lg mb-8 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-6 cursor-pointer hover:bg-gradient-to-r hover:from-red-50/50 hover:to-orange-50/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 via-orange-500 to-pink-500 shadow-lg">
                  <Filter className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-900">Advanced Class Analytics Filters</h3>
                  <p className="text-sm text-slate-600 mt-1">Configure comprehensive filters to analyze class performance and attendance patterns</p>
                </div>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="bg-gradient-to-r from-red-100 to-orange-100 text-red-800 border-red-300 px-3 py-1 text-sm font-semibold ml-auto">
                    {activeFilterCount} active filters
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAllFiltersWithMinClasses();
                    }}
                    className="gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors font-medium border-red-200"
                  >
                    <X className="w-4 h-4" />
                    Clear All Filters
                  </Button>
                )}
                <div className="p-2 rounded-lg bg-gradient-to-br from-red-100 to-orange-100 transition-transform duration-200">
                  {isOpen ? <ChevronUp className="w-5 h-5 text-red-600" /> : <ChevronDown className="w-5 h-5 text-red-600" />}
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-6 pb-6 pt-0 border-t border-gray-100 bg-gradient-to-br from-gray-50/30 to-white">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
              
              {/* Date Range Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-bold flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Date Range
                </Label>
                <DatePickerWithRange
                  value={{
                    from: filters.dateRange.start ? new Date(filters.dateRange.start) : undefined,
                    to: filters.dateRange.end ? new Date(filters.dateRange.end) : undefined
                  }}
                  onChange={(range) => 
                    updateFilters({ 
                      dateRange: { 
                        start: range?.from || null, 
                        end: range?.to || null 
                      } 
                    })
                  }
                  className="w-full border-gray-200 hover:border-gray-300 shadow-sm"
                />
              </div>

              {/* Trainers Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-bold flex items-center gap-2 text-gray-700">
                  <Users className="w-4 h-4 text-purple-500" />
                  Trainers ({filters.trainers.length} selected)
                </Label>
                <Select
                  value={filters.trainers.length === 0 ? "all-trainers" : filters.trainers[0]}
                  onValueChange={(value) => 
                    updateFilters({ 
                      trainers: value === 'all-trainers' ? [] : [value]
                    })
                  }
                >
                  <SelectTrigger className="w-full border-gray-200 hover:border-gray-300 shadow-sm">
                    <SelectValue placeholder="Select trainers..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all-trainers">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        All Trainers
                      </div>
                    </SelectItem>
                    {filterOptions.trainers.map(trainer => (
                      <SelectItem key={trainer} value={trainer}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {trainer}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Class Formats Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-bold flex items-center gap-2 text-gray-700">
                  <Target className="w-4 h-4 text-green-500" />
                  Class Formats ({filters.classTypes.length} selected)
                </Label>
                <Select
                  value={filters.classTypes.length === 0 ? "all-formats" : filters.classTypes[0]}
                  onValueChange={(value) => 
                    updateFilters({ 
                      classTypes: value === 'all-formats' ? [] : [value]
                    })
                  }
                >
                  <SelectTrigger className="w-full border-gray-200 hover:border-gray-300 shadow-sm">
                    <SelectValue placeholder="Select class formats..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all-formats">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        All Formats
                      </div>
                    </SelectItem>
                    {filterOptions.formats.map(format => (
                      <SelectItem key={format} value={format}>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          {format}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Day of Week Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-bold flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  Day of Week ({filters.dayOfWeek.length} selected)
                </Label>
                <Select
                  value={filters.dayOfWeek.length === 0 ? "all-days" : filters.dayOfWeek[0]}
                  onValueChange={(value) => 
                    updateFilters({ 
                      dayOfWeek: value === 'all-days' ? [] : [value]
                    })
                  }
                >
                  <SelectTrigger className="w-full border-gray-200 hover:border-gray-300 shadow-sm">
                    <SelectValue placeholder="Select days..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-days">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        All Days
                      </div>
                    </SelectItem>
                    {filterOptions.dayOfWeek.map(day => (
                      <SelectItem key={day} value={day}>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {day}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time Slots Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-bold flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4 text-red-500" />
                  Time Slots ({filters.timeSlots.length} selected)
                </Label>
                <Select
                  value={filters.timeSlots.length === 0 ? "all-times" : filters.timeSlots[0]}
                  onValueChange={(value) => 
                    updateFilters({ 
                      timeSlots: value === 'all-times' ? [] : [value]
                    })
                  }
                >
                  <SelectTrigger className="w-full border-gray-200 hover:border-gray-300 shadow-sm">
                    <SelectValue placeholder="Select time slots..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all-times">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        All Time Slots
                      </div>
                    </SelectItem>
                    {filterOptions.timeSlots.map(time => (
                      <SelectItem key={time} value={time}>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {time}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Minimum Classes Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-bold flex items-center gap-2 text-gray-700">
                  <Hash className="w-4 h-4 text-indigo-500" />
                  Min Classes Criteria
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={minClassesFilter}
                    onChange={(e) => setMinClassesFilter(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max="50"
                    className="w-full border-gray-200 hover:border-gray-300 shadow-sm"
                    placeholder="Minimum sessions"
                  />
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    sessions
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">Classes with fewer sessions will be excluded</p>
              </div>

              {/* Quick Filter Actions */}
              <div className="space-y-3 md:col-span-2 xl:col-span-1">
                <Label className="text-sm font-bold flex items-center gap-2 text-gray-700">
                  <Filter className="w-4 h-4 text-blue-500" />
                  Quick Actions
                </Label>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentDate = new Date();
                      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                      updateFilters({
                        dateRange: {
                          start: startOfMonth,
                          end: currentDate
                        }
                      });
                    }}
                    className="justify-start gap-2 text-xs"
                  >
                    <Calendar className="w-3 h-3" />
                    Current Month
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentDate = new Date();
                      const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
                      const endOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
                      updateFilters({
                        dateRange: {
                          start: lastMonth,
                          end: endOfLastMonth
                        }
                      });
                    }}
                    className="justify-start gap-2 text-xs"
                  >
                    <Calendar className="w-3 h-3" />
                    Last Month
                  </Button>
                </div>
              </div>

            </div>

            {/* Filter Summary */}
            {hasActiveFilters && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Active Filters Summary:</h4>
                <div className="flex flex-wrap gap-2">
                  {filters.dateRange.start && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Date: {filters.dateRange.start.toLocaleDateString()} - {filters.dateRange.end?.toLocaleDateString() || 'Present'}
                    </Badge>
                  )}
                  {filters.trainers.length > 0 && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      Trainers: {filters.trainers.length}
                    </Badge>
                  )}
                  {filters.classTypes.length > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Formats: {filters.classTypes.length}
                    </Badge>
                  )}
                  {filters.dayOfWeek.length > 0 && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Days: {filters.dayOfWeek.length}
                    </Badge>
                  )}
                  {filters.timeSlots.length > 0 && (
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      Times: {filters.timeSlots.length}
                    </Badge>
                  )}
                  {minClassesFilter > 1 && (
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                      Min Classes: {minClassesFilter}+
                    </Badge>
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