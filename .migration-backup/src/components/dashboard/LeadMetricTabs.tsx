
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeadsMetricType } from '@/types/leads';

interface LeadMetricTabsProps {
  value: LeadsMetricType;
  onValueChange: (value: LeadsMetricType) => void;
  className?: string;
}

export const LeadMetricTabs: React.FC<LeadMetricTabsProps> = ({
  value,
  onValueChange,
  className = ""
}) => {
  return (
    <Tabs value={value} onValueChange={onValueChange} className={className}>
      <TabsList className="modern-tabs grid w-full grid-cols-6 h-16">
        <TabsTrigger
          value="totalLeads"
          className="modern-tab-trigger tab-variant-blue"
        >
          Total Leads
        </TabsTrigger>
        <TabsTrigger
          value="leadToTrialConversion"
          className="modern-tab-trigger tab-variant-purple"
        >
          Lead to Trial %
        </TabsTrigger>
        <TabsTrigger
          value="trialToMembershipConversion"
          className="modern-tab-trigger tab-variant-emerald"
        >
          Trial to Member %
        </TabsTrigger>
        <TabsTrigger
          value="ltv"
          className="modern-tab-trigger tab-variant-blue"
        >
          Average LTV
        </TabsTrigger>
        <TabsTrigger
          value="totalRevenue"
          className="modern-tab-trigger tab-variant-rose"
        >
          Total Revenue
        </TabsTrigger>
        <TabsTrigger
          value="visitFrequency"
          className="modern-tab-trigger tab-variant-purple"
        >
          Visit Frequency
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
