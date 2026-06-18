import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Building2, Globe, Users } from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { cn } from '@/lib/utils';
import { InfoPopover } from '@/components/ui/InfoSidebar';

type SalesContextKey =
  | 'sales-metrics'
  | 'sales-top-bottom'
  | 'sales-mom'
  | 'sales-yoy'
  | 'sales-product'
  | 'sales-category'
  | 'sales-soldby'
  | 'sales-payment'
  | 'sales-customer'
  | 'sales-deep-insights'
  | 'sales-overview'
  | 'patterns-trends-overview'
  | 'patterns-trends-kwality'
  | 'patterns-trends-supreme'
  | 'patterns-trends-kenkere'
  | 'patterns-trends-all'
  | 'client-retention-overview'
  | 'class-formats-overview'
  | 'funnel-leads-overview'
  | 'late-cancellations-overview'
  | 'class-attendance-overview'
  | 'discounts-promotions-overview'
  | 'expiration-analytics-overview'
  | 'sessions-overview';

interface LocationTabsProps {
  data: SessionData[];
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  children: (filteredData: SessionData[]) => React.ReactNode;
  showInfoPopover?: boolean;
  infoPopoverContext?: SalesContextKey;
}

export const LocationTabs: React.FC<LocationTabsProps> = ({
  data,
  selectedLocation,
  onLocationChange,
  children,
  showInfoPopover = false,
  infoPopoverContext = 'class-attendance-overview'
}) => {
  // Get all unique locations with their session counts
  const locationStats = useMemo(() => {
    const stats = new Map<string, { count: number; attendance: number }>();
    
    data.forEach(session => {
      const location = session.location || 'Unknown';
      const current = stats.get(location) || { count: 0, attendance: 0 };
      stats.set(location, {
        count: current.count + 1,
        attendance: current.attendance + (session.checkedInCount || 0)
      });
    });

    const allStats = Array.from(stats.entries()).map(([location, stat]) => ({
      location,
      ...stat
    }));

    // Sort by session count (descending)
    allStats.sort((a, b) => b.count - a.count);

    return allStats;
  }, [data]);

  const totalSessions = data.length;
  const totalAttendance = data.reduce((sum, session) => sum + (session.checkedInCount || 0), 0);

  // Filter data based on selected location
  const filteredData = useMemo(() => {
    if (selectedLocation === 'all') {
      return data;
    }
    return data.filter(session => session.location === selectedLocation);
  }, [data, selectedLocation]);

  const getLocationIcon = (location: string) => {
    if (location === 'all') return <Globe className="w-4 h-4" />;
    if (location.toLowerCase().includes('studio')) return <Building2 className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  const getLocationShortName = (location: string) => {
    if (location.toLowerCase().includes('kwality')) return 'Kwality House';
    if (location.toLowerCase().includes('supreme')) return 'Supreme HQ';
    if (location.toLowerCase().includes('kenkere')) return 'Kenkere House';
    return location.split(',')[0] || location; // Take first part before comma
  };

  return (
    <div className="space-y-6">
      {/* Location Tabs */}
      <div className="rounded-2xl border border-slate-300 bg-white/95 backdrop-blur-md p-6 shadow-xl">
        {/* Enhanced Location Tabs - unified styling (matching Sales) */}
        <div className="flex justify-center mb-6" id="location-tabs">
          <div className="w-full max-w-6xl">
            {/* InfoPopover - positioned next to location tabs */}
            {showInfoPopover && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1"></div>
                <InfoPopover context={infoPopoverContext} locationId={selectedLocation} />
              </div>
            )}
            <div className="grid grid-cols-4 location-tabs gap-3">
              {/* All Locations Tab */}
              <button
                onClick={() => onLocationChange('all')}
                className={cn(
                  "px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex flex-col items-center justify-center min-h-[80px] border-2",
                  selectedLocation === 'all'
                    ? 'bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white border-slate-600 shadow-lg scale-105'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:shadow-md'
                )}
              >
                <span className="font-extrabold text-base">All Locations</span>
                <span className="text-xs opacity-90 mt-1">({totalSessions} sessions)</span>
              </button>

              {/* Individual Location Tabs - Top 3 */}
              {locationStats.slice(0, 3).map((stat) => (
                <button
                  key={stat.location}
                  onClick={() => onLocationChange(stat.location)}
                  className={cn(
                    "px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex flex-col items-center justify-center min-h-[80px] border-2",
                    selectedLocation === stat.location
                      ? 'bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white border-slate-600 shadow-lg scale-105'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:shadow-md'
                  )}
                >
                  <span className="font-extrabold text-base">{getLocationShortName(stat.location)}</span>
                  <span className="text-xs opacity-90 mt-1">({stat.count} sessions)</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="mt-6">
          {children(filteredData)}
        </div>
      </div>

      {/* Additional Location Stats Summary */}
      {selectedLocation !== 'all' && (
        <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl p-4 border border-slate-300 shadow-sm mt-4">
          <div className="flex items-center gap-3">
            {getLocationIcon(selectedLocation)}
            <div>
              <h4 className="font-semibold text-slate-900">{selectedLocation}</h4>
              <p className="text-sm text-slate-600">
                Showing {filteredData.length} sessions with {filteredData.reduce((sum, s) => sum + (s.checkedInCount || 0), 0)} total attendees
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLocationChange('all')}
              className="ml-auto hover:bg-red-50 hover:border-red-400 hover:text-red-700"
            >
              View All Locations
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};