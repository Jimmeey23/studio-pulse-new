import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SortAsc, SortDesc, ArrowUpDown, Calendar, MapPin, Users, DollarSign, Activity } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface IndividualSessionsTableProps {
  sessions: any[];
  trainerName: string;
}

export const IndividualSessionsTable: React.FC<IndividualSessionsTableProps> = ({
  sessions,
  trainerName
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'date',
    direction: 'desc'
  });

  const sortedSessions = useMemo(() => {
    if (!sessions || sessions.length === 0) return [];

    return [...sessions].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle different data types
      if (sortConfig.key === 'date' || sortConfig.key === 'monthYear') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      } else {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }

      if (sortConfig.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [sessions, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <SortAsc className="w-4 h-4 text-blue-600" /> : 
      <SortDesc className="w-4 h-4 text-blue-600" />;
  };

  const getPerformanceBadge = (checkedIn: number, capacity: number) => {
    const fillRate = capacity > 0 ? (checkedIn / capacity) * 100 : 0;
    
    if (fillRate >= 90) return <Badge className="bg-emerald-100 text-emerald-800">Excellent</Badge>;
    if (fillRate >= 70) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (fillRate >= 50) return <Badge className="bg-amber-100 text-amber-800">Average</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low</Badge>;
  };

  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No individual session data available for {trainerName}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Individual Sessions for {trainerName}
        </CardTitle>
        <p className="text-sm text-gray-600">
          {sessions.length} sessions • Total Revenue: {formatCurrency(sessions.reduce((sum, s) => sum + (s.totalPaid || 0), 0))}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead 
                  className="cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('monthYear')}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Month/Year
                    {getSortIcon('monthYear')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('location')}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                    {getSortIcon('location')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-100 transition-colors text-right"
                  onClick={() => handleSort('totalSessions')}
                >
                  <div className="flex items-center gap-2 justify-end">
                    Sessions
                    {getSortIcon('totalSessions')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-100 transition-colors text-right"
                  onClick={() => handleSort('totalCustomers')}
                >
                  <div className="flex items-center gap-2 justify-end">
                    <Users className="w-4 h-4" />
                    Customers
                    {getSortIcon('totalCustomers')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-100 transition-colors text-right"
                  onClick={() => handleSort('totalPaid')}
                >
                  <div className="flex items-center gap-2 justify-end">
                    <DollarSign className="w-4 h-4" />
                    Revenue
                    {getSortIcon('totalPaid')}
                  </div>
                </TableHead>
                <TableHead className="text-center">Performance</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-100 transition-colors text-right"
                  onClick={() => handleSort('avgClassSize')}
                >
                  <div className="flex items-center gap-2 justify-end">
                    Avg Size
                    {getSortIcon('avgClassSize')}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSessions.map((session, index) => {
                const avgSize = session.totalSessions > 0 ? session.totalCustomers / session.totalSessions : 0;
                const revenuePerSession = session.totalSessions > 0 ? session.totalPaid / session.totalSessions : 0;
                
                return (
                  <TableRow 
                    key={index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="font-medium">
                      {session.monthYear || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="truncate">{session.location || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatNumber(session.totalSessions || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-medium">{formatNumber(session.totalCustomers || 0)}</span>
                        <span className="text-xs text-gray-500">{avgSize.toFixed(1)} avg</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-medium">{formatCurrency(session.totalPaid || 0)}</span>
                        <span className="text-xs text-gray-500">{formatCurrency(revenuePerSession)}/session</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getPerformanceBadge(session.totalCustomers || 0, (session.totalSessions || 0) * 12)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-medium">{avgSize.toFixed(1)}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((avgSize / 15) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};