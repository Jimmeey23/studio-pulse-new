import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LateCancellationsData } from '@/types/dashboard';
import { MapPin, User, Calendar, Package, Users } from 'lucide-react';

interface LateCancellationsSectionProps {
  data: LateCancellationsData[];
}

export const LateCancellationsSection: React.FC<LateCancellationsSectionProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState('by-location');

  // Group data by table type
  const groupedData = useMemo(() => {
    const groups: Record<string, LateCancellationsData[]> = {
      'by-location': [],
      'by-class': [],
      'by-trainer': [],
      'by-product': [],
      'members-multiple-cancellations': [],
      'members-multiple-checkins': []
    };

    data.forEach(item => {
      if (item.tableType && groups[item.tableType]) {
        groups[item.tableType].push(item);
      }
    });

    return groups;
  }, [data]);

  // Get month columns from the data (excluding location and type-specific columns)
  const monthColumns = useMemo(() => {
    if (data.length === 0) return [];
    
    const firstItem = data[0];
    const excludeKeys = ['location', 'tableType', 'cleanedClass', 'trainerName', 'cleanedProduct'];
    
    return Object.keys(firstItem).filter(key => 
      !excludeKeys.includes(key) && 
      typeof firstItem[key] === 'number'
    );
  }, [data]);

  const formatNumber = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0' : num.toLocaleString();
  };

  const renderDataTable = (tableData: LateCancellationsData[], tableType: string) => {
    if (tableData.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No data available for this category
        </div>
      );
    }

    const getSecondaryColumnHeader = () => {
      switch (tableType) {
        case 'by-class': return 'Class Type';
        case 'by-trainer': return 'Trainer Name';
        case 'by-product': return 'Product Type';
        default: return '';
      }
    };

    const getSecondaryColumnValue = (item: LateCancellationsData) => {
      switch (tableType) {
        case 'by-class': return item.cleanedClass;
        case 'by-trainer': return item.trainerName;
        case 'by-product': return item.cleanedProduct;
        default: return '';
      }
    };

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-semibold text-gray-700 sticky left-0 bg-white">Location</th>
              {tableType !== 'by-location' && (
                <th className="text-left py-3 px-2 font-semibold text-gray-700">{getSecondaryColumnHeader()}</th>
              )}
              {monthColumns.map(month => (
                <th key={month} className="text-right py-3 px-2 font-semibold text-gray-700 min-w-[80px]">
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((item, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-2 font-medium text-gray-900 sticky left-0 bg-white">{item.location}</td>
                {tableType !== 'by-location' && (
                  <td className="py-2 px-2 text-gray-700">{getSecondaryColumnValue(item)}</td>
                )}
                {monthColumns.map(month => (
                  <td key={month} className="py-2 px-2 text-right text-gray-700">
                    {formatNumber(item[month])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const locationData = groupedData['by-location'];
    if (locationData.length === 0) return null;

    let totalCancellations = 0;
    let totalLocations = locationData.length;

    locationData.forEach(item => {
      monthColumns.forEach(month => {
        const value = item[month];
        if (typeof value === 'number') {
          totalCancellations += value;
        }
      });
    });

    const avgCancellationsPerLocation = totalLocations > 0 ? totalCancellations / totalLocations : 0;

    return {
      totalCancellations,
      totalLocations,
      avgCancellationsPerLocation
    };
  }, [groupedData, monthColumns]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summaryMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-red-50 to-red-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Total Late Cancellations</p>
                  <p className="text-2xl font-bold text-red-700">{formatNumber(summaryMetrics.totalCancellations)}</p>
                </div>
                <Calendar className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Active Locations</p>
                  <p className="text-2xl font-bold text-blue-700">{summaryMetrics.totalLocations}</p>
                </div>
                <MapPin className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Avg per Location</p>
                  <p className="text-2xl font-bold text-purple-700">{formatNumber(Math.round(summaryMetrics.avgCancellationsPerLocation))}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Tables */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">Late Cancellations Analysis</CardTitle>
          <p className="text-gray-600">Detailed breakdown of late cancellation patterns across different dimensions</p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full mb-6">
              <TabsTrigger value="by-location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                By Location
              </TabsTrigger>
              <TabsTrigger value="by-class" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                By Class
              </TabsTrigger>
              <TabsTrigger value="by-trainer" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                By Trainer
              </TabsTrigger>
              <TabsTrigger value="by-product" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                By Product
              </TabsTrigger>
              <TabsTrigger value="members-multiple-cancellations" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Members (&gt;1/day)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="by-location" className="mt-6">
              <div className="mb-4">
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  {groupedData['by-location'].length} locations
                </Badge>
              </div>
              {renderDataTable(groupedData['by-location'], 'by-location')}
            </TabsContent>

            <TabsContent value="by-class" className="mt-6">
              <div className="mb-4">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {groupedData['by-class'].length} class entries
                </Badge>
              </div>
              {renderDataTable(groupedData['by-class'], 'by-class')}
            </TabsContent>

            <TabsContent value="by-trainer" className="mt-6">
              <div className="mb-4">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {groupedData['by-trainer'].length} trainer entries
                </Badge>
              </div>
              {renderDataTable(groupedData['by-trainer'], 'by-trainer')}
            </TabsContent>

            <TabsContent value="by-product" className="mt-6">
              <div className="mb-4">
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  {groupedData['by-product'].length} product entries
                </Badge>
              </div>
              {renderDataTable(groupedData['by-product'], 'by-product')}
            </TabsContent>

            <TabsContent value="members-multiple-cancellations" className="mt-6">
              <div className="mb-4">
                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                  Members with Multiple Cancellations per Day
                </Badge>
              </div>
              {renderDataTable(groupedData['members-multiple-cancellations'], 'members-multiple-cancellations')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};