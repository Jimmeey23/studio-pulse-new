
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { countConvertedLeads, calculateConversionRate } from '@/utils/leadConversions';
import { 
  Users, 
  Target, 
  Calendar, 
  MapPin, 
  TrendingUp,
  TrendingDown,
  DollarSign, 
  Activity, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Zap
} from 'lucide-react';
import { LeadsData } from '@/types/leads';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface FunnelMetricCardsProps {
  data: LeadsData[];
  onCardClick?: (title: string, data: LeadsData[], metricType: string) => void;
}

export const FunnelMetricCards: React.FC<FunnelMetricCardsProps> = ({ data, onCardClick }) => {
  const metrics = useMemo(() => {
    if (!data || !data.length) {
      return {
        leadsReceived: 0,
        trialsCompleted: 0,
        trialsScheduled: 0,
        proximityIssues: 0,
        convertedLeads: 0,
        trialToMemberConversion: 0,
        leadToTrialConversion: 0,
        leadToMemberConversion: 0,
        avgLTV: 0,
        avgVisitsPerLead: 0,
        pipelineHealth: 0
      };
    }

    const leadsReceived = data.length;
    // Prefer trialStatus over stage to avoid double-counting
    const trialsCompleted = data.filter(
      lead => lead.trialStatus === 'Trial Completed' || lead.stage === 'Trial Completed'
    ).length;
    const trialsScheduled = data.filter(lead => {
      const ts = (lead.trialStatus || '').toLowerCase();
      const st = (lead.stage || '').toLowerCase();
      // Count scheduled/booked trials but exclude completed
      const statusSuggestsTrial = ts.includes('trial') && !ts.includes('completed');
      const stageSuggestsTrial = st.includes('trial') && !st.includes('completed');
      return statusSuggestsTrial || stageSuggestsTrial;
    }).length;
    const proximityIssues = data.filter(lead => lead.stage?.includes('Proximity') || lead.remarks?.toLowerCase().includes('proximity')).length;
    const convertedLeads = countConvertedLeads(data); // Use unified conversion logic
    
    const trialToMemberConversion = trialsCompleted > 0 ? (convertedLeads / trialsCompleted) * 100 : 0;
    const leadToTrialConversion = leadsReceived > 0 ? (trialsScheduled / leadsReceived) * 100 : 0;
    const leadToMemberConversion = calculateConversionRate(data); // Use unified conversion rate calculation
    
    const totalLTV = data.reduce((sum, lead) => sum + (lead.ltv || 0), 0);
    const avgLTV = leadsReceived > 0 ? totalLTV / leadsReceived : 0;
    
    const totalVisits = data.reduce((sum, lead) => sum + (lead.visits || 0), 0);
    const avgVisitsPerLead = leadsReceived > 0 ? totalVisits / leadsReceived : 0;
    
    const pipelineHealth = Math.min(100, Math.round(
      (leadToTrialConversion * 0.3) + 
      (trialToMemberConversion * 0.4) + 
      (avgVisitsPerLead * 10 * 0.2) + 
      ((leadsReceived - proximityIssues) / leadsReceived * 100 * 0.1)
    ));

    return {
      leadsReceived,
      trialsCompleted,
      trialsScheduled,
      proximityIssues,
      convertedLeads,
      trialToMemberConversion,
      leadToTrialConversion,
      leadToMemberConversion,
      avgLTV,
      avgVisitsPerLead,
      pipelineHealth
    };
  }, [data]);

  const MetricCard = ({ 
    id,
    title, 
    value, 
    icon: Icon, 
    colorIndex,
    subtitle, 
    format = 'number',
    description
  }: {
    id: string;
    title: string;
    value: number;
    icon: React.ElementType;
    colorIndex: number;
    subtitle?: string;
    format?: 'number' | 'currency' | 'percentage';
    description: string;
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency': return formatCurrency(val);
        case 'percentage': return `${val.toFixed(1)}%`;
        default: return val.toLocaleString('en-IN');
      }
    };

    return (
      <Card
        className={cn(
          "group relative overflow-hidden cursor-pointer transition-all duration-700",
          "bg-white hover:bg-gradient-to-br hover:from-gray-900 hover:via-slate-900 hover:to-slate-900",
          colorIndex % 4 === 0 && "border-t-4 border-green-700 hover:border-green-700 shadow-lg",
          colorIndex % 4 === 1 && "border-t-4 border-blue-700 hover:border-blue-700 shadow-lg",
          colorIndex % 4 === 2 && "border-t-4 border-pink-700 hover:border-pink-700 shadow-lg", 
          colorIndex % 4 === 3 && "border-t-4 border-red-700 hover:border-red-700 shadow-lg",
          "hover:shadow-2xl hover:shadow-slate-900/30",
          "hover:-translate-y-2 hover:scale-[1.02]"
        )}
        onClick={() => onCardClick?.(title, data, id)}
      >
        <CardContent className="p-6 relative">
          <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-all duration-700">
            <Icon className={cn(
              "w-12 h-12 transition-all duration-700",
              colorIndex % 4 === 0 && "text-green-700",
              colorIndex % 4 === 1 && "text-blue-700",
              colorIndex % 4 === 2 && "text-pink-700",
              colorIndex % 4 === 3 && "text-red-700",
              "group-hover:text-white/40"
            )} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-6">
                <div className={cn(
                  "p-4 rounded-2xl transition-all duration-700 border-1 shadow-md",
                  colorIndex % 4 === 0 && "bg-gradient-to-br from-green-700 to-green-600 border-green-900 text-white shadow-green-200",
                  colorIndex % 4 === 1 && "bg-gradient-to-br from-blue-700 to-blue-600 border-blue-900 text-white shadow-blue-200",
                  colorIndex % 4 === 2 && "bg-gradient-to-br from-pink-700 to-pink-600 border-pink-900 text-white shadow-pink-200",
                  colorIndex % 4 === 3 && "bg-gradient-to-br from-red-700 to-red-600 border-red-900 text-white shadow-red-200",
                  "group-hover:bg-white/20 group-hover:border-white/40 group-hover:text-white group-hover:shadow-white/20"
                )}>
                  <Icon className="w-6 h-6 drop-shadow-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg text-slate-900 group-hover:text-white/95 transition-colors duration-700">
                    {title}
                  </h3>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className={cn(
                "text-4xl font-bold transition-all duration-700 text-slate-900 group-hover:text-white"
              )}>
                {formatValue(value)}
              </p>
              <p className={cn(
                "text-xs text-slate-500 group-hover:text-slate-200 transition-colors"
              )}>
                {subtitle}
              </p>
            </div>
          </div>
          
          <div className={cn(
            "mt-4 p-3 border-t border-l-4 transition-all duration-700",
            "bg-slate-50 group-hover:bg-slate-800/50 border-t-slate-200 group-hover:border-t-white/10",
            colorIndex % 4 === 0 && "border-l-green-700",
            colorIndex % 4 === 1 && "border-l-blue-700",
            colorIndex % 4 === 2 && "border-l-pink-700",
            colorIndex % 4 === 3 && "border-l-red-700"
          )}>
            <p className="text-xs text-slate-900 group-hover:text-white transition-colors duration-700">
              {description}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        id="leadsReceived"
        title="Leads Received"
        value={metrics.leadsReceived}
        icon={Users}
        colorIndex={0}
        subtitle="Total incoming leads"
        description="Total number of leads received in the selected period"
      />
      
      <MetricCard
        id="trialsCompleted"
        title="Trials Completed"
        value={metrics.trialsCompleted}
        icon={CheckCircle}
        colorIndex={1}
        subtitle="Successful trial sessions"
        description="Number of trial sessions that were successfully completed"
      />
      
      <MetricCard
        id="convertedLeads"
        title="Converted Leads"
        value={metrics.convertedLeads}
        icon={Target}
        colorIndex={2}
        subtitle="Successfully converted"
        description="Number of leads successfully converted to paying members"
      />
      
      <MetricCard
        id="trialToMemberRate"
        title="Trial → Member %"
        value={metrics.trialToMemberConversion}
        icon={TrendingUp}
        colorIndex={3}
        subtitle="Trial conversion efficiency"
        format="percentage"
        description="Percentage of completed trials that converted to memberships"
      />
      
      <MetricCard
        id="leadToMemberRate"
        title="Lead → Member %"
        value={metrics.leadToMemberConversion}
        icon={Zap}
        colorIndex={0}
        subtitle="Overall conversion rate"
        format="percentage"
        description="Overall percentage of leads converted to paying members"
      />
      
      <MetricCard
        id="avgLTV"
        title="Average LTV"
        value={metrics.avgLTV}
        icon={DollarSign}
        colorIndex={1}
        subtitle="Lifetime value per lead"
        format="currency"
        description="Average lifetime value generated per lead"
      />
      
      <MetricCard
        id="avgVisitsPerLead"
        title="Avg Visits/Lead"
        value={metrics.avgVisitsPerLead}
        icon={Eye}
        colorIndex={2}
        subtitle="Engagement frequency"
        description="Average number of visits per lead during the funnel process"
      />
      
      <MetricCard
        id="pipelineHealth"
        title="Pipeline Health"
        value={metrics.pipelineHealth}
        icon={metrics.pipelineHealth >= 70 ? CheckCircle : metrics.pipelineHealth >= 50 ? Clock : AlertTriangle}
        colorIndex={3}
        subtitle="Overall funnel performance"
        format="percentage"
        description="Composite score based on conversion rates, engagement, and lead quality"
      />
    </div>
  );
};
