
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, RotateCcw, MapPin, Users, Target, ChevronDown, ChevronUp, CreditCard, Package } from 'lucide-react';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { NewClientFilterOptions } from '@/types/dashboard';

interface ClientConversionFilterSectionProps {
  filters: NewClientFilterOptions;
  onFiltersChange: (filters: NewClientFilterOptions) => void;
  locations: string[];
  trainers: string[];
  membershipTypes: string[];
}

export const ClientConversionFilterSection: React.FC<ClientConversionFilterSectionProps> = ({
  filters,
  onFiltersChange,
  locations,
  trainers,
  membershipTypes
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLocationChange = (location: string) => {
    const newLocations = filters.location.includes(location)
      ? filters.location.filter(l => l !== location)
      : [...filters.location, location];
    onFiltersChange({ ...filters, location: newLocations });
  };

  const handleTrainerChange = (trainer: string) => {
    const newTrainers = filters.trainer.includes(trainer)
      ? filters.trainer.filter(t => t !== trainer)
      : [...filters.trainer, trainer];
    onFiltersChange({ ...filters, trainer: newTrainers });
  };

  const handleRetentionStatusChange = (status: string) => {
    const newStatuses = filters.retentionStatus.includes(status)
      ? filters.retentionStatus.filter(s => s !== status)
      : [...filters.retentionStatus, status];
    onFiltersChange({ ...filters, retentionStatus: newStatuses });
  };

  const handleConversionStatusChange = (status: string) => {
    const newStatuses = filters.conversionStatus.includes(status)
      ? filters.conversionStatus.filter(s => s !== status)
      : [...filters.conversionStatus, status];
    onFiltersChange({ ...filters, conversionStatus: newStatuses });
  };

  const handlePaymentMethodChange = (method: string) => {
    const newMethods = filters.paymentMethod.includes(method)
      ? filters.paymentMethod.filter(m => m !== method)
      : [...filters.paymentMethod, method];
    onFiltersChange({ ...filters, paymentMethod: newMethods });
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        start: range.from ? range.from.toISOString().split('T')[0] : '',
        end: range.to ? range.to.toISOString().split('T')[0] : ''
      }
    });
  };

  const resetFilters = () => {
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

  const activeFiltersCount = filters.location.length + filters.trainer.length + 
    filters.retentionStatus.length + filters.conversionStatus.length + 
    filters.paymentMethod.length + (filters.dateRange.start || filters.dateRange.end ? 1 : 0);

  // Use only 3 main locations as in sales tab
  const mainLocations = ['Kwality House, Kemps Corner', 'Bandra West', 'Juhu'];
  const availableLocations = locations.filter(loc => mainLocations.includes(loc));

  if (!isExpanded) {
    return (
      <Card className="bg-white shadow-lg border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-700">Client Conversion Filters</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {activeFiltersCount} active
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(true)}
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

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Client Conversion Filters
            <Badge variant="secondary" className="bg-white/20 text-white">
              Active Filters: {activeFiltersCount}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-white hover:bg-white/20"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Date Range
            </label>
            <DatePickerWithRange
              value={{
                from: filters.dateRange.start ? new Date(filters.dateRange.start) : undefined,
                to: filters.dateRange.end ? new Date(filters.dateRange.end) : undefined
              }}
              onChange={handleDateRangeChange}
            />
          </div>

          {/* Location Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Locations
            </label>
            <div className="flex flex-wrap gap-1">
              {availableLocations.map(location => (
                <Button
                  key={location}
                  variant={filters.location.includes(location) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleLocationChange(location)}
                  className="text-xs"
                >
                  {location.split(',')[0]}
                </Button>
              ))}
            </div>
          </div>

          {/* Trainer Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Users className="w-4 h-4" />
              Trainers
            </label>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
              {trainers.slice(0, 6).map(trainer => (
                <Button
                  key={trainer}
                  variant={filters.trainer.includes(trainer) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTrainerChange(trainer)}
                  className="text-xs"
                >
                  {trainer}
                </Button>
              ))}
            </div>
          </div>

          {/* Conversion Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Target className="w-4 h-4" />
              Conversion Status
            </label>
            <div className="flex flex-wrap gap-1">
              {['Converted', 'Not Converted'].map(status => (
                <Button
                  key={status}
                  variant={filters.conversionStatus.includes(status) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleConversionStatusChange(status)}
                  className="text-xs"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          {/* Retention Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Target className="w-4 h-4" />
              Retention Status
            </label>
            <div className="flex flex-wrap gap-1">
              {['Retained', 'Not Retained'].map(status => (
                <Button
                  key={status}
                  variant={filters.retentionStatus.includes(status) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleRetentionStatusChange(status)}
                  className="text-xs"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Method Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <CreditCard className="w-4 h-4" />
              Payment Method
            </label>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
              {['Online', 'Cash', 'Card', 'UPI'].map(method => (
                <Button
                  key={method}
                  variant={filters.paymentMethod.includes(method) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePaymentMethodChange(method)}
                  className="text-xs"
                >
                  {method}
                </Button>
              ))}
            </div>
          </div>

          {/* Membership Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Package className="w-4 h-4" />
              Membership Type
            </label>
            <Select>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Select membership" />
              </SelectTrigger>
              <SelectContent>
                {membershipTypes.slice(0, 10).map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset Button */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <RotateCcw className="w-4 h-4" />
              Actions
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="w-full text-xs"
            >
              Reset All Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
