
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Target, Star, Award, Crown, MapPin, UserCheck } from 'lucide-react';
import { LeadsData } from '@/types/leads';
import { formatCurrency, formatNumber } from '@/utils/formatters';

interface ImprovedLeadTopListsProps {
  data: LeadsData[];
}

export const ImprovedLeadTopLists: React.FC<ImprovedLeadTopListsProps> = ({ data }) => {
  // Calculate source stats
  const sourceStats = data.reduce((acc, lead) => {
    const source = lead.source || 'Unknown';
    if (!acc[source]) {
      acc[source] = {
        leads: 0,
        conversions: 0,
        ltv: 0
      };
    }
    acc[source].leads += 1;
    if (lead.conversionStatus === 'Converted') {
      acc[source].conversions += 1;
    }
    acc[source].ltv += lead.ltv || 0;
    return acc;
  }, {} as Record<string, any>);

  // Calculate associate stats
  const associateStats = data.reduce((acc, lead) => {
    const associate = lead.associate || 'Unknown';
    if (!acc[associate]) {
      acc[associate] = {
        leads: 0,
        conversions: 0,
        ltv: 0
      };
    }
    acc[associate].leads += 1;
    if (lead.conversionStatus === 'Converted') {
      acc[associate].conversions += 1;
    }
    acc[associate].ltv += lead.ltv || 0;
    return acc;
  }, {} as Record<string, any>);

  const topSources = Object.entries(sourceStats)
    .map(([source, stats]) => ({
      name: source,
      leads: stats.leads,
      conversions: stats.conversions,
      conversionRate: stats.leads > 0 ? (stats.conversions / stats.leads * 100) : 0,
      avgLTV: stats.leads > 0 ? stats.ltv / stats.leads : 0,
      totalRevenue: stats.ltv
    }))
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 5);

  const topAssociates = Object.entries(associateStats)
    .map(([associate, stats]) => ({
      name: associate,
      leads: stats.leads,
      conversions: stats.conversions,
      conversionRate: stats.leads > 0 ? (stats.conversions / stats.leads * 100) : 0,
      avgLTV: stats.leads > 0 ? stats.ltv / stats.leads : 0,
      totalRevenue: stats.ltv
    }))
    .sort((a, b) => b.conversions - a.conversions)
    .slice(0, 5);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-5 h-5 text-amber-500" />;
      case 1: return <Award className="w-5 h-5 text-gray-400" />;
      case 2: return <Star className="w-5 h-5 text-amber-600" />;
      default: return <Target className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 25) return { label: 'Excellent', class: 'bg-green-100 text-green-800 border-green-200' };
    if (rate >= 15) return { label: 'Good', class: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (rate >= 8) return { label: 'Average', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    return { label: 'Improving', class: 'bg-orange-100 text-orange-800 border-orange-200' };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Top Sources */}
      <Card className="bg-white shadow-xl border-0 overflow-hidden rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 border-b">
          <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
            <MapPin className="w-5 h-5" />
            Top Performing Sources
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {topSources.map((source, index) => {
            const badge = getPerformanceBadge(source.conversionRate);
            return (
              <div key={source.name} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600">
                    {getRankIcon(index)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{source.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600">{formatNumber(source.leads)} leads</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-green-600 font-medium">{formatNumber(source.conversions)} converted</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{source.conversionRate.toFixed(1)}%</div>
                  <Badge className={`text-xs ${badge.class} mt-1`}>
                    {badge.label}
                  </Badge>
                </div>
              </div>
            );
          })}
          
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl border border-blue-200">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-700">
                  {formatNumber(topSources.reduce((sum, s) => sum + s.leads, 0))}
                </div>
                <div className="text-xs text-blue-600">Total Leads</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-700">
                  {formatCurrency(topSources.reduce((sum, s) => sum + s.totalRevenue, 0))}
                </div>
                <div className="text-xs text-green-600">Revenue Generated</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Associates */}
      <Card className="bg-white shadow-xl border-0 overflow-hidden rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-700 border-b">
          <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
            <UserCheck className="w-5 h-5" />
            Top Performing Associates
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {topAssociates.map((associate, index) => {
            const badge = getPerformanceBadge(associate.conversionRate);
            return (
              <div key={associate.name} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600">
                    {getRankIcon(index)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{associate.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600">{formatNumber(associate.leads)} leads</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-green-600 font-medium">{formatNumber(associate.conversions)} converted</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-600">{associate.conversionRate.toFixed(1)}%</div>
                  <Badge className={`text-xs ${badge.class} mt-1`}>
                    {badge.label}
                  </Badge>
                </div>
              </div>
            );
          })}
          
          <div className="mt-6 p-4 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl border border-emerald-200">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-emerald-700">
                  {(() => {
                    const totalLeads = topAssociates.reduce((sum, a) => sum + a.leads, 0);
                    const totalConversions = topAssociates.reduce((sum, a) => sum + a.conversions, 0);
                    return `${totalLeads > 0 ? (totalConversions / totalLeads * 100).toFixed(1) : '0.0'}%`;
                  })()}
                </div>
                <div className="text-xs text-emerald-600">Avg Conversion</div>
              </div>
              <div>
                <div className="text-lg font-bold text-teal-700">
                  {formatCurrency(topAssociates.reduce((sum, a) => sum + a.avgLTV, 0) / topAssociates.length)}
                </div>
                <div className="text-xs text-teal-600">Avg LTV</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
