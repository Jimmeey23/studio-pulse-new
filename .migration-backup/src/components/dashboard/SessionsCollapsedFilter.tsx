
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SessionsCollapsedFilterProps {
  onFiltersChange?: (filters: any) => void;
}

export const SessionsCollapsedFilter: React.FC<SessionsCollapsedFilterProps> = ({
  onFiltersChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);

  const clearFilters = () => {
    setActiveFilters(0);
    onFiltersChange?.({});
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-4 cursor-pointer hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                Session Filters
                {activeFilters > 0 && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                    {activeFilters} active
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {activeFilters > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFilters();
                    }}
                    className="text-slate-600 hover:text-slate-700"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                )}
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="text-center py-8 text-slate-500">
              <Filter className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>Session filters will be available here</p>
              <p className="text-sm mt-2">Expand to configure advanced filtering options</p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
