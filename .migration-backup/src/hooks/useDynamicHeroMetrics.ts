import React, { useMemo } from 'react';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { formatCurrency, formatNumber } from '@/utils/formatters';

interface DynamicHeroMetricsProps {
  salesData: any[];
  sessionsData: any[];
  leadsData: any[];
  newClientsData: any[];
}

export const useDynamicHeroMetrics = ({
  salesData,
  sessionsData,
  leadsData,
  newClientsData
}: DynamicHeroMetricsProps) => {
  const { filters } = useGlobalFilters();

  return useMemo(() => {
    const selectedLocation = Array.isArray(filters.location) ? filters.location[0] : filters.location;

    // Filter data by location
    const filterByLocation = (items: any[], locationKey: string) => {
      if (!selectedLocation) return items;
      
      return items.filter(item => {
        const itemLocation = item[locationKey];
        if (!itemLocation) return false;
        
        // Match exact location or partial match for variations
        return itemLocation === selectedLocation || 
               itemLocation.includes(selectedLocation) ||
               selectedLocation.includes(itemLocation);
      });
    };

    const filteredSales = filterByLocation(salesData, 'calculatedLocation');
    const filteredSessions = filterByLocation(sessionsData, 'location');
    const filteredLeads = filterByLocation(leadsData, 'center');
    const filteredNewClients = filterByLocation(newClientsData, 'homeLocation');

    // Calculate metrics from filtered data
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.paymentValue || 0), 0);
    const activeMembers = new Set(filteredSales.map(s => s.memberId)).size;
    const totalAttendance = filteredSessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
    const convertedLeads = filteredLeads.filter(l => l.conversionStatus === 'Converted').length;
    const conversionRate = filteredLeads.length > 0 ? (convertedLeads / filteredLeads.length) * 100 : 0;

    return [
      { label: 'Total Revenue', value: formatCurrency(totalRevenue), trend: null },
      { label: 'Active Members', value: formatNumber(activeMembers), trend: null },
      { label: 'Session Attendance', value: formatNumber(totalAttendance), trend: null },
      { label: 'Lead Conversion', value: `${conversionRate.toFixed(1)}%`, trend: null }
    ];
  }, [salesData, sessionsData, leadsData, newClientsData, filters.location]);
};
