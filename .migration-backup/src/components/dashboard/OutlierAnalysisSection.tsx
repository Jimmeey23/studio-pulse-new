import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Calendar, Building2, Sparkles } from 'lucide-react';
import { SalesData, NewClientData } from '@/types/dashboard';
import { CheckinData } from '@/hooks/useCheckinsData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { useOutlierMonthAnalytics } from '@/hooks/useOutlierMonthAnalytics';
import { OutlierMonthDetail } from '@/components/dashboard/OutlierMonthDetail';
import { InfoPopover } from '@/components/ui/InfoSidebar';

interface OutlierAnalysisSectionProps {
  salesData: SalesData[];
  sessionsData?: any[];
  checkinsData?: CheckinData[];
  expirationsData?: any[];
  leadsData?: any[];
  newClientData?: NewClientData[];
}

export const OutlierAnalysisSection: React.FC<OutlierAnalysisSectionProps> = ({
  salesData,
  checkinsData = [],
  newClientData = []
}) => {
  const [activeMonth, setActiveMonth] = useState<'april' | 'august'>('april');
  const [activeLocation, setActiveLocation] = useState<string>('kwality');

  const availableLocations = useMemo(() => {
    const monthConfig = activeMonth === 'april' 
      ? { year: 2025, monthIndex: 3 }
      : { year: 2025, monthIndex: 7 };
    
    const monthData = salesData.filter(item => {
      if (!item.paymentDate) return false;
      const date = new Date(item.paymentDate);
      return date.getFullYear() === monthConfig.year && 
             date.getMonth() === monthConfig.monthIndex &&
             item.paymentStatus === 'succeeded';
    });

    const locations = new Set(monthData.map(item => item.calculatedLocation || 'Unknown'));
    return ['all', ...Array.from(locations).sort()];
  }, [salesData, activeMonth]);

  const aprilAllAnalytics = useOutlierMonthAnalytics(salesData, checkinsData, newClientData, 'april', undefined);
  const augustAllAnalytics = useOutlierMonthAnalytics(salesData, checkinsData, newClientData, 'august', undefined);
  const aprilLocationAnalytics = useOutlierMonthAnalytics(salesData, checkinsData, newClientData, 'april', activeLocation !== 'all' ? activeLocation : undefined);
  const augustLocationAnalytics = useOutlierMonthAnalytics(salesData, checkinsData, newClientData, 'august', activeLocation !== 'all' ? activeLocation : undefined);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  April 2025
                </span>
                <Badge className="bg-blue-100 text-blue-700">
                  {formatNumber(aprilAllAnalytics.totalClients)} Clients
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Revenue</span>
                <span className="text-2xl font-bold text-blue-600">{formatCurrency(aprilAllAnalytics.totalRevenue)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">New Clients</div>
                  <div className="text-lg font-bold text-emerald-600">{formatCurrency(aprilAllAnalytics.newClientRevenue)}</div>
                  <div className="text-xs text-gray-500">{formatPercentage((aprilAllAnalytics.newClientRevenue / aprilAllAnalytics.totalRevenue) * 100)}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Existing</div>
                  <div className="text-lg font-bold text-purple-600">{formatCurrency(aprilAllAnalytics.existingClientRevenue)}</div>
                  <div className="text-xs text-gray-500">{formatPercentage((aprilAllAnalytics.existingClientRevenue / aprilAllAnalytics.totalRevenue) * 100)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200 hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  August 2025
                </span>
                <Badge className="bg-purple-100 text-purple-700">
                  {formatNumber(augustAllAnalytics.totalClients)} Clients
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Revenue</span>
                <span className="text-2xl font-bold text-purple-600">{formatCurrency(augustAllAnalytics.totalRevenue)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">New Clients</div>
                  <div className="text-lg font-bold text-emerald-600">{formatCurrency(augustAllAnalytics.newClientRevenue)}</div>
                  <div className="text-xs text-gray-500">{formatPercentage((augustAllAnalytics.newClientRevenue / augustAllAnalytics.totalRevenue) * 100)}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Existing</div>
                  <div className="text-lg font-bold text-purple-600">{formatCurrency(augustAllAnalytics.existingClientRevenue)}</div>
                  <div className="text-xs text-gray-500">{formatPercentage((augustAllAnalytics.existingClientRevenue / augustAllAnalytics.totalRevenue) * 100)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
            <div>
              <div className="font-semibold text-lg text-gray-900 mb-2">Month-over-Month Comparison</div>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Revenue Difference:</strong> {augustAllAnalytics.totalRevenue > aprilAllAnalytics.totalRevenue ? 'August' : 'April'} generated {formatCurrency(Math.abs(augustAllAnalytics.totalRevenue - aprilAllAnalytics.totalRevenue))} more ({formatPercentage(Math.abs((augustAllAnalytics.totalRevenue - aprilAllAnalytics.totalRevenue) / aprilAllAnalytics.totalRevenue) * 100)} change).</p>
                <p><strong>Client Acquisition:</strong> April brought in {formatNumber(aprilAllAnalytics.newClients)} new clients vs August's {formatNumber(augustAllAnalytics.newClients)}.</p>
                <p><strong>Member Behavior:</strong> April saw {formatNumber(aprilAllAnalytics.renewals + aprilAllAnalytics.upgrades)} renewals/upgrades, while August had {formatNumber(augustAllAnalytics.renewals + augustAllAnalytics.upgrades)}.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeMonth} onValueChange={(value) => setActiveMonth(value as 'april' | 'august')} className="w-full">
        <TabsList className="bg-white/90 backdrop-blur-sm p-2 rounded-2xl shadow-xl border-0 grid grid-cols-2 gap-3 w-full max-w-md mx-auto">
          <TabsTrigger value="april" className="relative rounded-xl px-6 py-3 font-semibold text-base w-full justify-center min-h-[48px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            April 2025
          </TabsTrigger>
          <TabsTrigger value="august" className="relative rounded-xl px-6 py-3 font-semibold text-base w-full justify-center min-h-[48px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            August 2025
          </TabsTrigger>
        </TabsList>

        <TabsContent value="april" className="mt-8 space-y-6">
          <Tabs value={activeLocation} onValueChange={setActiveLocation} className="w-full">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Select Location</h3>
                </div>
                <InfoPopover context="outlier-analysis-overview" locationId={activeLocation === 'all' ? 'all' : activeLocation} />
              </div>
              <TabsList className="bg-gray-100 p-1 rounded-lg inline-flex flex-wrap gap-2">
                {availableLocations.map((location) => (
                  <TabsTrigger key={location} value={location} className="px-4 py-2 rounded-md text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white hover:bg-gray-200">
                    {location === 'all' ? 'All Locations' : location}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {availableLocations.map((location) => (
              <TabsContent key={location} value={location} className="mt-6">
                <OutlierMonthDetail analytics={location === 'all' ? aprilAllAnalytics : aprilLocationAnalytics} monthName="April 2025" locationName={location === 'all' ? 'All Locations' : location} />
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        <TabsContent value="august" className="mt-8 space-y-6">
          <Tabs value={activeLocation} onValueChange={setActiveLocation} className="w-full">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Select Location</h3>
                </div>
                <InfoPopover context="outlier-analysis-overview" locationId={activeLocation === 'all' ? 'all' : activeLocation} />
              </div>
              <TabsList className="bg-gray-100 p-1 rounded-lg inline-flex flex-wrap gap-2">
                {availableLocations.map((location) => (
                  <TabsTrigger key={location} value={location} className="px-4 py-2 rounded-md text-sm font-medium data-[state=active]:bg-purple-600 data-[state=active]:text-white hover:bg-gray-200">
                    {location === 'all' ? 'All Locations' : location}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {availableLocations.map((location) => (
              <TabsContent key={location} value={location} className="mt-6">
                <OutlierMonthDetail analytics={location === 'all' ? augustAllAnalytics : augustLocationAnalytics} monthName="August 2025" locationName={location === 'all' ? 'All Locations' : location} />
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};
