import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from '@/components/ui/button';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  SalesData,
  FilterOptions,
  NewClientData,
  NewClientFilterOptions
} from '@/types/dashboard';

interface FilterSectionProps {
  data: SalesData[] | NewClientData[];
  filters: FilterOptions | NewClientFilterOptions;
  onFiltersChange: (filters: FilterOptions | NewClientFilterOptions) => void;
  type?: 'sales' | 'newClient';
}

export const FilterSection: React.FC<FilterSectionProps> = ({ 
  data, 
  filters, 
  onFiltersChange,
  type = 'sales'
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const isNewClientType = type === 'newClient';
  const newClientData = isNewClientType ? data as NewClientData[] : [];
  const salesData = !isNewClientType ? data as SalesData[] : [];

  const getUniqueValues = (field: keyof SalesData): string[] => {
    return Array.from(new Set(salesData.map(item => String(item[field] || ''))))
      .filter(value => value !== '')
      .sort();
  };

  const getNewClientUniqueValues = (field: keyof NewClientData): string[] => {
    return Array.from(new Set(newClientData.map(item => String(item[field] || ''))))
      .filter(value => value !== '')
      .sort();
  };

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleMultiSelectChange = (key: string, value: string, checked: boolean) => {
    const currentValues = (filters as any)[key] || [];
    const newValues = checked 
      ? [...currentValues, value]
      : currentValues.filter((v: string) => v !== value);
    
    handleFilterChange(key, newValues);
  };

  const clearAllFilters = () => {
    if (isNewClientType) {
      onFiltersChange({
        dateRange: { start: '', end: '' },
        location: [],
        homeLocation: [],
        trainer: [],
        paymentMethod: [],
        retentionStatus: [],
        conversionStatus: [],
        isNew: [],
        minLTV: undefined,
        maxLTV: undefined,
      });
    } else {
      onFiltersChange({
        dateRange: { start: '', end: '' },
        location: [],
        category: [],
        product: [],
        soldBy: [],
        paymentMethod: [],
        minAmount: undefined,
        maxAmount: undefined,
      });
    }
  };

  const renderNewClientFilters = () => {
    const newClientFilters = filters as NewClientFilterOptions;
    
    return (
      <>
        {/* Date Range */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">Date Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={newClientFilters.dateRange.start}
              onChange={(e) => handleFilterChange('dateRange', {
                ...newClientFilters.dateRange,
                start: e.target.value
              })}
              className="text-sm"
            />
            <Input
              type="date"
              value={newClientFilters.dateRange.end}
              onChange={(e) => handleFilterChange('dateRange', {
                ...newClientFilters.dateRange,
                end: e.target.value
              })}
              className="text-sm"
            />
          </div>
        </div>

        {/* First Visit Location */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">First Visit Location</Label>
          <ScrollArea className="h-32 w-full rounded-md border p-2">
            {getNewClientUniqueValues('firstVisitLocation').map(location => (
              <div key={location} className="flex items-center space-x-2 py-1">
                <Checkbox
                  id={`location-${location}`}
                  checked={newClientFilters.location.includes(location)}
                  onCheckedChange={(checked) => 
                    handleMultiSelectChange('location', location, !!checked)
                  }
                />
                <Label htmlFor={`location-${location}`} className="text-xs">
                  {location}
                </Label>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Home Location */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">Home Location</Label>
          <ScrollArea className="h-32 w-full rounded-md border p-2">
            {getNewClientUniqueValues('homeLocation').map(location => (
              <div key={location} className="flex items-center space-x-2 py-1">
                <Checkbox
                  id={`home-${location}`}
                  checked={newClientFilters.homeLocation.includes(location)}
                  onCheckedChange={(checked) => 
                    handleMultiSelectChange('homeLocation', location, !!checked)
                  }
                />
                <Label htmlFor={`home-${location}`} className="text-xs">
                  {location}
                </Label>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Trainer */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">Trainer</Label>
          <ScrollArea className="h-32 w-full rounded-md border p-2">
            {getNewClientUniqueValues('trainerName').map(trainer => (
              <div key={trainer} className="flex items-center space-x-2 py-1">
                <Checkbox
                  id={`trainer-${trainer}`}
                  checked={newClientFilters.trainer.includes(trainer)}
                  onCheckedChange={(checked) => 
                    handleMultiSelectChange('trainer', trainer, !!checked)
                  }
                />
                <Label htmlFor={`trainer-${trainer}`} className="text-xs">
                  {trainer}
                </Label>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">Payment Method</Label>
          <ScrollArea className="h-32 w-full rounded-md border p-2">
            {getNewClientUniqueValues('paymentMethod').map(method => (
              <div key={method} className="flex items-center space-x-2 py-1">
                <Checkbox
                  id={`payment-${method}`}
                  checked={newClientFilters.paymentMethod.includes(method)}
                  onCheckedChange={(checked) => 
                    handleMultiSelectChange('paymentMethod', method, !!checked)
                  }
                />
                <Label htmlFor={`payment-${method}`} className="text-xs">
                  {method}
                </Label>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Retention Status */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">Retention Status</Label>
          <ScrollArea className="h-32 w-full rounded-md border p-2">
            {getNewClientUniqueValues('retentionStatus').map(status => (
              <div key={status} className="flex items-center space-x-2 py-1">
                <Checkbox
                  id={`retention-${status}`}
                  checked={newClientFilters.retentionStatus.includes(status)}
                  onCheckedChange={(checked) => 
                    handleMultiSelectChange('retentionStatus', status, !!checked)
                  }
                />
                <Label htmlFor={`retention-${status}`} className="text-xs">
                  {status}
                </Label>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* LTV Range */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">LTV Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min LTV"
              value={newClientFilters.minLTV || ''}
              onChange={(e) => handleFilterChange('minLTV', 
                e.target.value ? parseFloat(e.target.value) : undefined
              )}
              className="text-sm"
            />
            <Input
              type="number"
              placeholder="Max LTV"
              value={newClientFilters.maxLTV || ''}
              onChange={(e) => handleFilterChange('maxLTV', 
                e.target.value ? parseFloat(e.target.value) : undefined
              )}
              className="text-sm"
            />
          </div>
        </div>
      </>
    );
  };

  const renderSalesFilters = () => {
    const salesFilters = filters as FilterOptions;
    
    return (
      <>
        {/* Date Range */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">Date Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={salesFilters.dateRange.start}
              onChange={(e) => handleFilterChange('dateRange', {
                ...salesFilters.dateRange,
                start: e.target.value
              })}
              className="text-sm"
            />
            <Input
              type="date"
              value={salesFilters.dateRange.end}
              onChange={(e) => handleFilterChange('dateRange', {
                ...salesFilters.dateRange,
                end: e.target.value
              })}
              className="text-sm"
            />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">Location</Label>
          <ScrollArea className="h-32 w-full rounded-md border p-2">
            {getUniqueValues('calculatedLocation').map(location => (
              <div key={location} className="flex items-center space-x-2 py-1">
                <Checkbox
                  id={`location-${location}`}
                  checked={salesFilters.location.includes(location)}
                  onCheckedChange={(checked) => 
                    handleMultiSelectChange('location', location, !!checked)
                  }
                />
                <Label htmlFor={`location-${location}`} className="text-xs">
                  {location}
                </Label>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">Category</Label>
          <ScrollArea className="h-32 w-full rounded-md border p-2">
            {getUniqueValues('cleanedCategory').map(category => (
              <div key={category} className="flex items-center space-x-2 py-1">
                <Checkbox
                  id={`category-${category}`}
                  checked={salesFilters.category.includes(category)}
                  onCheckedChange={(checked) => 
                    handleMultiSelectChange('category', category, !!checked)
                  }
                />
                <Label htmlFor={`category-${category}`} className="text-xs">
                  {category}
                </Label>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Product */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">Product</Label>
          <ScrollArea className="h-32 w-full rounded-md border p-2">
            {getUniqueValues('cleanedProduct').map(product => (
              <div key={product} className="flex items-center space-x-2 py-1">
                <Checkbox
                  id={`product-${product}`}
                  checked={salesFilters.product.includes(product)}
                  onCheckedChange={(checked) => 
                    handleMultiSelectChange('product', product, !!checked)
                  }
                />
                <Label htmlFor={`product-${product}`} className="text-xs">
                  {product}
                </Label>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Sold By */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">Sold By</Label>
          <ScrollArea className="h-32 w-full rounded-md border p-2">
            {getUniqueValues('soldBy').map(seller => (
              <div key={seller} className="flex items-center space-x-2 py-1">
                <Checkbox
                  id={`seller-${seller}`}
                  checked={salesFilters.soldBy.includes(seller)}
                  onCheckedChange={(checked) => 
                    handleMultiSelectChange('soldBy', seller, !!checked)
                  }
                />
                <Label htmlFor={`seller-${seller}`} className="text-xs">
                  {seller}
                </Label>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">Payment Method</Label>
          <ScrollArea className="h-32 w-full rounded-md border p-2">
            {getUniqueValues('paymentMethod').map(method => (
              <div key={method} className="flex items-center space-x-2 py-1">
                <Checkbox
                  id={`payment-${method}`}
                  checked={salesFilters.paymentMethod.includes(method)}
                  onCheckedChange={(checked) => 
                    handleMultiSelectChange('paymentMethod', method, !!checked)
                  }
                />
                <Label htmlFor={`payment-${method}`} className="text-xs">
                  {method}
                </Label>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Amount Range */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">Amount Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min Amount"
              value={salesFilters.minAmount || ''}
              onChange={(e) => handleFilterChange('minAmount', 
                e.target.value ? parseFloat(e.target.value) : undefined
              )}
              className="text-sm"
            />
            <Input
              type="number"
              placeholder="Max Amount"
              value={salesFilters.maxAmount || ''}
              onChange={(e) => handleFilterChange('maxAmount', 
                e.target.value ? parseFloat(e.target.value) : undefined
              )}
              className="text-sm"
            />
          </div>
        </div>
      </>
    );
  };

  return (
    <Card className="bg-gradient-to-br from-white via-blue-50/30 to-white border-0 shadow-lg">
      <CardHeader 
        className="pb-4 cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
            Advanced Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                clearAllFilters();
              }}
              className="gap-1"
            >
              <X className="w-3 h-3" />
              Clear All
            </Button>
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </CardHeader>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {isNewClientType ? renderNewClientFilters() : renderSalesFilters()}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
