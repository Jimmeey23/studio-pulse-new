import React, { useState, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useNewCsvData, NewClientData } from '@/hooks/useNewCsvData';
import { Users, Target, TrendingUp } from 'lucide-react';
import { formatNumber } from '@/utils/formatters';
import { OptimizedTable } from '@/components/ui/OptimizedTable';
import { designTokens } from '@/utils/designTokens';

// Memoized overview card component
const OverviewCard = memo(({
  locationData
}: {
  locationData: NewClientData;
}) => <Card className={`bg-gradient-to-br from-white to-blue-50 ${designTokens.card.shadow}`}>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg font-bold text-blue-800">
        {locationData.location.replace('Kwality House, Kemps Corner', 'Kwality House').replace('Supreme HQ, Bandra', 'Supreme HQ')}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-white rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{formatNumber(locationData.newMembers.reduce((a, b) => a + b, 0))}</div>
          <div className="text-xs text-blue-500">Total New Members</div>
        </div>
        <div className="text-center p-3 bg-white rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-green-600">{formatNumber(locationData.retained.reduce((a, b) => a + b, 0))}</div>
          <div className="text-xs text-green-500">Total Retained</div>
        </div>
        <div className="text-center p-3 bg-white rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-purple-600">{formatNumber(locationData.converted.reduce((a, b) => a + b, 0))}</div>
          <div className="text-xs text-purple-500">Total Converted</div>
        </div>
        <div className="text-center p-3 bg-white rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-orange-600">{formatNumber(locationData.ltv.reduce((a, b) => a + b, 0))}</div>
          <div className="text-xs text-orange-500">Total LTV</div>
        </div>
      </div>
    </CardContent>
  </Card>);
export const NewCsvDataTable: React.FC = () => {
  const {
    data,
    loading,
    error
  } = useNewCsvData();
  const [selectedMetric, setSelectedMetric] = useState<string>('overview');

  // Memoized table columns for performance
  const tableColumns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [{
      key: 'location' as keyof NewClientData,
      header: 'Location',
      render: (value: string) => <span className="font-medium">
            {value.replace('Kwality House, Kemps Corner', 'Kwality House').replace('Supreme HQ, Bandra', 'Supreme HQ')}
          </span>,
      className: 'sticky left-0 bg-white z-10 border-r'
    }, ...data[0].months.map((month, index) => ({
      key: `month_${index}` as keyof NewClientData,
      header: month.replace('2025-', '').replace('2024-', ''),
      render: (value: any, item: NewClientData) => {
        const metricData = item[selectedMetric as keyof NewClientData] as any[];
        const cellValue = metricData?.[index] || 0;
        if (selectedMetric === 'ltv') {
          return `₹${formatNumber(cellValue)}`;
        }
        return selectedMetric.includes('retention') || selectedMetric.includes('conversion') ? cellValue : formatNumber(cellValue);
      },
      className: 'text-center'
    }))];
  }, [data, selectedMetric]);
  if (loading) {
    return null; // Parent component will handle loading
  }
  if (error) {
    return <Card className={`${designTokens.card.background} ${designTokens.card.shadow}`}>
        <CardContent className="text-center p-12">
          <p className="text-red-600">Error loading data: {error}</p>
        </CardContent>
      </Card>;
  }
  const renderOverviewTable = () => <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {data.map(locationData => <OverviewCard key={locationData.location} locationData={locationData} />)}
    </div>;
  const renderMetricTable = (formatValue?: (value: any) => string) => <OptimizedTable data={data} columns={tableColumns} loading={loading} maxHeight="500px" stickyHeader={true} />;
  return <Card className={`${designTokens.card.background} ${designTokens.card.shadow} ${designTokens.card.border}`}>
      
      <CardContent className={designTokens.card.padding}>
        <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-gradient-to-r from-blue-50 to-blue-100 mb-6">
            <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
            <TabsTrigger value="newMembers" className="text-sm">New Members</TabsTrigger>
            <TabsTrigger value="retained" className="text-sm">Retained</TabsTrigger>
            <TabsTrigger value="converted" className="text-sm">Converted</TabsTrigger>
            <TabsTrigger value="retention" className="text-sm">Retention %</TabsTrigger>
            <TabsTrigger value="conversion" className="text-sm">Conversion %</TabsTrigger>
            <TabsTrigger value="ltv" className="text-sm">LTV</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {renderOverviewTable()}
          </TabsContent>

          <TabsContent value="newMembers" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">New Members by Month</h3>
            </div>
            {renderMetricTable(value => formatNumber(value))}
          </TabsContent>

          <TabsContent value="retained" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">Retained Members by Month</h3>
            </div>
            {renderMetricTable(value => formatNumber(value))}
          </TabsContent>

          <TabsContent value="converted" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-purple-800">Converted Members by Month</h3>
            </div>
            {renderMetricTable(value => formatNumber(value))}
          </TabsContent>

          <TabsContent value="retention" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-green-100 text-green-800">Retention Rate</Badge>
              <h3 className="text-lg font-semibold text-green-800">Monthly Retention Percentage</h3>
            </div>
            {renderMetricTable()}
          </TabsContent>

          <TabsContent value="conversion" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-blue-100 text-blue-800">Conversion Rate</Badge>
              <h3 className="text-lg font-semibold text-blue-800">Monthly Conversion Percentage</h3>
            </div>
            {renderMetricTable()}
          </TabsContent>

          <TabsContent value="ltv" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-orange-100 text-orange-800">Lifetime Value</Badge>
              <h3 className="text-lg font-semibold text-orange-800">Customer Lifetime Value by Month</h3>
            </div>
            {renderMetricTable(value => `₹${formatNumber(value)}`)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>;
};