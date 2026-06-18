import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExpirationData } from '@/types/dashboard';
import { formatNumber, formatCurrency } from '@/utils/formatters';
import { Search, SortAsc, SortDesc, Users, AlertTriangle, Calendar, MapPin, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChurnedMembersDetailedTableProps {
  data: ExpirationData[];
  onRowClick?: (item: ExpirationData) => void;
}

type SortField = 'firstName' | 'membershipName' | 'endDate' | 'homeLocation' | 'paid' | 'soldBy';
type SortDirection = 'asc' | 'desc';

export const ChurnedMembersDetailedTable: React.FC<ChurnedMembersDetailedTableProps> = ({ 
  data, 
  onRowClick 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('endDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [locationFilter, setLocationFilter] = useState('all');
  const [membershipFilter, setMembershipFilter] = useState('all');

  // Filter for churned members only
  const churnedData = useMemo(() => {
    return data.filter(item => item.status === 'Churned');
  }, [data]);

  // Get unique values for filters
  const uniqueLocations = useMemo(() => {
    const locations = new Set(churnedData.map(item => item.homeLocation).filter(Boolean));
    return Array.from(locations);
  }, [churnedData]);

  const uniqueMemberships = useMemo(() => {
    const memberships = new Set(churnedData.map(item => item.membershipName).filter(Boolean));
    return Array.from(memberships);
  }, [churnedData]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    return churnedData
      .filter(item => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
          item.firstName?.toLowerCase().includes(searchLower) ||
          item.lastName?.toLowerCase().includes(searchLower) ||
          item.email?.toLowerCase().includes(searchLower) ||
          item.membershipName?.toLowerCase().includes(searchLower) ||
          item.soldBy?.toLowerCase().includes(searchLower)
        );

        const matchesLocation = locationFilter === 'all' || item.homeLocation === locationFilter;
        const matchesMembership = membershipFilter === 'all' || item.membershipName === membershipFilter;

        return matchesSearch && matchesLocation && matchesMembership;
      })
      .sort((a, b) => {
        let aVal: any = a[sortField] || '';
        let bVal: any = b[sortField] || '';
        
        // Handle different data types
        if (sortField === 'endDate') {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        } else if (sortField === 'paid') {
          aVal = parseFloat(aVal?.toString().replace(/[^0-9.-]/g, '') || '0');
          bVal = parseFloat(bVal?.toString().replace(/[^0-9.-]/g, '') || '0');
        }

        const multiplier = sortDirection === 'asc' ? 1 : -1;
        
        if (aVal < bVal) return -1 * multiplier;
        if (aVal > bVal) return 1 * multiplier;
        return 0;
      });
  }, [churnedData, searchTerm, sortField, sortDirection, locationFilter, membershipFilter]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalRevenueLoss = filteredAndSortedData.reduce((sum, member) => {
      const paid = parseFloat(member.paid?.toString().replace(/[^0-9.-]/g, '') || '0');
      return sum + (isNaN(paid) ? 0 : paid);
    }, 0);

    const membershipBreakdown = filteredAndSortedData.reduce((acc, member) => {
      const membership = member.membershipName || 'Unknown';
      acc[membership] = (acc[membership] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCount: filteredAndSortedData.length,
      totalRevenueLoss,
      membershipBreakdown
    };
  }, [filteredAndSortedData]);

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-1 font-medium text-white hover:text-gray-200 hover:bg-white/10"
    >
      {children}
      {sortField === field && (
        sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
      )}
    </Button>
  );

  const formatPaidAmount = (paid: string) => {
    if (!paid || paid === '-') return '-';
    const amount = parseFloat(paid.toString().replace(/[^0-9.-]/g, '') || '0');
    return isNaN(amount) ? '-' : formatCurrency(amount);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8" />
              <div>
                <div className="text-2xl font-bold">{formatNumber(summaryStats.totalCount)}</div>
                <div className="text-red-100">Churned Members</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8" />
              <div>
                <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalRevenueLoss)}</div>
                <div className="text-orange-100">Revenue Impact</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8" />
              <div>
                <div className="text-2xl font-bold">{Object.keys(summaryStats.membershipBreakdown).length}</div>
                <div className="text-purple-100">Membership Types</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white/90 backdrop-blur-sm border-slate-200/50 shadow-lg">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {uniqueLocations.map(location => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={membershipFilter} onValueChange={setMembershipFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by membership" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Memberships</SelectItem>
                {uniqueMemberships.map(membership => (
                  <SelectItem key={membership} value={membership}>{membership}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-slate-600 flex items-center">
              Showing {formatNumber(filteredAndSortedData.length)} of {formatNumber(churnedData.length)} churned members
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card className="bg-white/90 backdrop-blur-sm border-slate-200/50 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Churned Members - Detailed Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white">
                <tr>
                  <th className="text-left py-3 px-4 min-w-[150px]">
                    <SortButton field="firstName">Member Details</SortButton>
                  </th>
                  <th className="text-left py-3 px-4 min-w-[200px]">
                    <SortButton field="membershipName">Membership</SortButton>
                  </th>
                  <th className="text-left py-3 px-4 min-w-[120px]">
                    <SortButton field="endDate">End Date</SortButton>
                  </th>
                  <th className="text-left py-3 px-4 min-w-[150px]">
                    <SortButton field="homeLocation">Location</SortButton>
                  </th>
                  <th className="text-right py-3 px-4 min-w-[100px]">
                    <SortButton field="paid">Paid Amount</SortButton>
                  </th>
                  <th className="text-left py-3 px-4 min-w-[120px]">
                    <SortButton field="soldBy">Sold By</SortButton>
                  </th>
                  <th className="text-center py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((item, index) => (
                  <tr 
                    key={item.uniqueId || index} 
                    className="border-b border-slate-100 hover:bg-red-50/50 cursor-pointer transition-colors"
                    onClick={() => onRowClick?.(item)}
                  >
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="font-medium text-slate-900">
                          {`${item.firstName} ${item.lastName}`}
                        </div>
                        <div className="text-xs text-slate-500">{item.email}</div>
                        <div className="text-xs text-slate-400">ID: {item.memberId}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="font-medium text-slate-700">{item.membershipName}</div>
                        <div className="text-xs text-slate-500">
                          Membership ID: {item.membershipId}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(item.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3 h-3" />
                        <span className="text-sm">{item.homeLocation}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatPaidAmount(item.paid)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-sm">
                      {item.soldBy && item.soldBy !== '-' ? item.soldBy : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant="outline"
                        className="border-red-200 bg-red-50 text-red-700"
                      >
                        Churned
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};