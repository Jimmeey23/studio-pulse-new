import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Globe } from 'lucide-react';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';

interface ExecutiveLocationTabsProps {
  availableLocations: string[];
}

// Correct location names matching the data and other tabs
const LOCATION_MAP = [
  { key: 'Kwality House, Kemps Corner', display: 'Kwality House', subtitle: 'Kemps Corner', icon: '🏢' },
  { key: 'Supreme HQ, Bandra', display: 'Supreme HQ', subtitle: 'Bandra', icon: '🏛️' },
  { key: 'Kenkere House, Bengaluru', display: 'Kenkere House', subtitle: 'Bengaluru', icon: '🏰' }
];

export const ExecutiveLocationTabs: React.FC<ExecutiveLocationTabsProps> = ({ 
  availableLocations 
}) => {
  const { filters, updateFilters } = useGlobalFilters();
  
  const selectedLocation = Array.isArray(filters.location) 
    ? filters.location[0] 
    : filters.location;

  const handleLocationChange = (value: string) => {
    if (value === 'all') {
      updateFilters({ location: [] });
    } else {
      updateFilters({ location: [value] });
    }
  };

  // Filter to show only the 3 main locations
  const displayLocations = LOCATION_MAP.filter(loc => 
    availableLocations.some(available => 
      available.includes(loc.key) || 
      available.includes(loc.display) ||
      loc.key.includes(available)
    )
  );

  return (
    <div className="mb-8 w-full flex justify-center">
      <Tabs 
        value={selectedLocation || 'all'} 
        onValueChange={handleLocationChange}
        className="w-full"
      >
        <TabsList className="bg-white/95 backdrop-blur-sm p-2 rounded-2xl shadow-xl border-0 flex justify-center gap-2 h-auto w-full max-w-4xl mx-auto">
          <TabsTrigger 
            value="all"
            className="px-6 py-3 rounded-xl text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 data-[state=active]:shadow-lg flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            All Locations
          </TabsTrigger>
          
          {LOCATION_MAP.map(location => (
            <TabsTrigger 
              key={location.key}
              value={location.key}
              className="px-6 py-3 rounded-xl text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 data-[state=active]:shadow-lg flex flex-col items-center gap-1"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{location.icon}</span>
                <span>{location.display}</span>
              </div>
              <span className="text-xs opacity-75">{location.subtitle}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};
