import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LateCancellationsData } from '@/types/dashboard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { AlertTriangle, Clock3, MapPin, Package, Sparkles, Users } from 'lucide-react';

interface EnhancedLateCancellationsTopBottomListsProps {
  data: LateCancellationsData[];
  onItemClick?: (payload: any) => void;
}

type GroupType = 'members' | 'locations' | 'events' | 'memberships' | 'windows';

export const EnhancedLateCancellationsTopBottomLists: React.FC<EnhancedLateCancellationsTopBottomListsProps> = ({ data, onItemClick }) => {
  const [activeType, setActiveType] = useState<GroupType>('members');
  const [showMore, setShowMore] = useState(false);

  const groupedData = useMemo(() => {
    const groups = data.reduce((acc, item) => {
      let key = 'Unknown';
      let label = 'Unknown';

      switch (activeType) {
        case 'members':
          key = item.memberId || item.email || item.customerName || 'Unknown';
          label = item.customerName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown';
          break;
        case 'locations':
          key = item.location || 'Unknown';
          label = item.location || 'Unknown';
          break;
        case 'events':
          key = item.cleanedClass || item.cancelledEvent || 'Unknown';
          label = item.cleanedClass || item.cancelledEvent || 'Unknown';
          break;
        case 'memberships':
          key = item.cleanedProduct || 'Unknown';
          label = item.cleanedProduct || 'Unknown';
          break;
        case 'windows':
          key = item.cancellationWindow || 'Unknown';
          label = item.cancellationWindow || 'Unknown';
          break;
      }

      if (!acc[key]) {
        acc[key] = {
          label,
          count: 0,
          penalties: 0,
          uniqueMembers: new Set<string>(),
          uniqueLocations: new Set<string>(),
          records: [] as LateCancellationsData[],
        };
      }

      acc[key].count += 1;
      acc[key].penalties += item.chargedPenaltyAmount || 0;
      if (item.memberId || item.email) acc[key].uniqueMembers.add(item.memberId || item.email || '');
      if (item.location) acc[key].uniqueLocations.add(item.location);
      acc[key].records.push(item);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groups)
      .map((group: any) => ({
        ...group,
        memberCount: group.uniqueMembers.size,
        locationCount: group.uniqueLocations.size,
      }))
      .sort((a: any, b: any) => b.count - a.count);
  }, [activeType, data]);

  const topItems = groupedData.slice(0, showMore ? 10 : 5);
  const bottomItems = [...groupedData].reverse().slice(0, showMore ? 10 : 5);

  const labels = {
    members: { title: 'Members', icon: Users },
    locations: { title: 'Locations', icon: MapPin },
    events: { title: 'Events', icon: Sparkles },
    memberships: { title: 'Memberships', icon: Package },
    windows: { title: 'Lead-Time Windows', icon: Clock3 },
  } as const;

  if (!data.length) {
    return (
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardContent className="flex h-48 items-center justify-center text-slate-500">
          No cancellation rankings available.
        </CardContent>
      </Card>
    );
  }

  const ActiveIcon = labels[activeType].icon;

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Late Cancellation Rankings
          </CardTitle>
          <p className="mt-2 text-sm text-slate-600">Spot the members, locations, events, and timing windows driving the most cancellations.</p>
        </div>
        <Tabs value={activeType} onValueChange={(value) => setActiveType(value as GroupType)}>
          <TabsList className="grid w-full grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-2 lg:grid-cols-5">
            {Object.entries(labels).map(([key, value]) => {
              const Icon = value.icon;
              return (
                <TabsTrigger key={key} value={key} className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Icon className="mr-2 h-4 w-4" />
                  {value.title}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {[
            { title: `Highest ${labels[activeType].title}`, items: topItems, tone: 'text-red-700 border-red-200 bg-red-50' },
            { title: `Lowest ${labels[activeType].title}`, items: bottomItems, tone: 'text-emerald-700 border-emerald-200 bg-emerald-50' },
          ].map((section) => (
            <div key={section.title} className="space-y-3">
              <div className="flex items-center gap-2">
                <ActiveIcon className="h-4 w-4 text-slate-600" />
                <h3 className="font-semibold text-slate-900">{section.title}</h3>
              </div>
              {section.items.map((item: any, index) => (
                <button
                  key={`${section.title}-${item.label}-${index}`}
                  type="button"
                  onClick={() => onItemClick?.({
                    title: `${section.title}: ${item.label}`,
                    records: item.records,
                    summary: {
                      cancellations: item.count,
                      members: item.memberCount,
                      penalties: item.penalties,
                    }
                  })}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900" title={item.label}>{item.label}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline" className={section.tone}>{formatNumber(item.count)} cancellations</Badge>
                        <Badge variant="outline">{formatNumber(item.memberCount)} members</Badge>
                        <Badge variant="outline">{formatCurrency(item.penalties || 0)} penalties</Badge>
                        <Badge variant="outline" className="border-dashed border-slate-300 text-slate-600">Click for details</Badge>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
        {groupedData.length > 5 && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setShowMore((current) => !current)}>
              {showMore ? 'Show Top 5' : 'Show Top 10'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};