import { LeadsData } from '@/types/leads';

/**
 * Determines if a lead is converted based on both stage and conversionStatus fields
 * This unified logic addresses the discrepancy between different data fields
 */
export const isLeadConverted = (lead: LeadsData): boolean => {
  // Check conversionStatus first (explicit conversion status)
  if (lead.conversionStatus === 'Converted') {
    return true;
  }
  
  // Check stage field for conversion indicators
  const stage = (lead.stage || '').toLowerCase();
  const conversionStages = [
    'membership sold',
    'converted', 
    'conversion',
    'member',
    'membership',
    'sold'
  ];
  
  return conversionStages.some(indicator => stage.includes(indicator));
};

/**
 * Counts converted leads using unified logic
 */
export const countConvertedLeads = (leads: LeadsData[]): number => {
  return leads.filter(isLeadConverted).length;
};

/**
 * Calculates conversion rate using unified logic
 */
export const calculateConversionRate = (leads: LeadsData[]): number => {
  if (leads.length === 0) return 0;
  return (countConvertedLeads(leads) / leads.length) * 100;
};

/**
 * Gets conversion status for display - attempts to normalize inconsistent data
 */
export const getConversionDisplayStatus = (lead: LeadsData): string => {
  if (isLeadConverted(lead)) {
    return 'Converted';
  }
  
  // Check for explicit lost status
  if (lead.conversionStatus === 'Lost' || (lead.stage || '').toLowerCase().includes('lost')) {
    return 'Lost';
  }
  
  // Return the actual stage if available, otherwise 'In Progress'
  return lead.stage || 'In Progress';
};

/**
 * Debug function to identify data inconsistencies
 */
export const identifyConversionInconsistencies = (leads: LeadsData[]) => {
  const inconsistencies = leads.filter(lead => {
    const hasConvertedStatus = lead.conversionStatus === 'Converted';
    const hasConvertedStage = isLeadConverted(lead) && lead.conversionStatus !== 'Converted';
    return hasConvertedStage && !hasConvertedStatus;
  });
  
  return inconsistencies.map(lead => ({
    id: lead.id,
    fullName: lead.fullName,
    stage: lead.stage,
    conversionStatus: lead.conversionStatus,
    issue: 'Stage indicates conversion but conversionStatus is not "Converted"'
  }));
};