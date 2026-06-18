import { useMemo } from 'react';
import { LeadsData } from '@/types/leads';

interface LeadsDiscrepancyAnalysis {
  totalLeads: number;
  convertedByStatus: number;
  convertedByStage: number;
  inconsistentLeads: number;
  issues: {
    membershipSoldButNotConverted: LeadsData[];
    convertedButNoMembershipStage: LeadsData[];
    allInconsistentLeads: LeadsData[];
  };
  stageValues: string[];
  conversionStatusValues: string[];
}

/**
 * Hook to analyze Supreme HQ leads data discrepancy
 * Investigates inconsistencies between conversionStatus and stage fields
 */
export const useSupremeHQLeadsAnalysis = (leadsData: LeadsData[]): LeadsDiscrepancyAnalysis => {
  return useMemo(() => {
    // Helper function to identify Supreme HQ location
    const isSupremeHQ = (center: string): boolean => {
      if (!center) return false;
      const centerLower = center.toLowerCase();
      return centerLower.includes('supreme') || centerLower.includes('bandra');
    };

    // Helper function to identify conversion-indicating stages
    const isConversionStage = (stage: string): boolean => {
      if (!stage) return false;
      const stageLower = stage.toLowerCase();
      return stageLower.includes('membership sold') || 
             stageLower.includes('converted') ||
             stageLower === 'membership sold' ||
             stageLower === 'converted' ||
             stageLower.includes('member') ||
             stageLower.includes('sale');
    };

    // Filter for Supreme HQ leads only
    const supremeHQLeads = leadsData.filter(lead => isSupremeHQ(lead.center));
    
    // Analysis 1: Leads with conversionStatus === 'Converted'
    const convertedByStatus = supremeHQLeads.filter(lead => lead.conversionStatus === 'Converted');
    
    // Analysis 2: Leads with stage indicating membership sales
    const convertedByStage = supremeHQLeads.filter(lead => isConversionStage(lead.stage));
    
    // Analysis 3: Find inconsistent leads
    const inconsistentLeads = supremeHQLeads.filter(lead => {
      const hasConversionStage = isConversionStage(lead.stage);
      const hasConversionStatus = lead.conversionStatus === 'Converted';
      return hasConversionStage !== hasConversionStatus; // XOR - they should match
    });
    
    // Specific issue patterns
    const membershipSoldButNotConverted = supremeHQLeads.filter(lead => 
      isConversionStage(lead.stage) && lead.conversionStatus !== 'Converted'
    );
    
    const convertedButNoMembershipStage = supremeHQLeads.filter(lead => 
      lead.conversionStatus === 'Converted' && !isConversionStage(lead.stage)
    );

    // Get unique values for debugging
    const stageValues = [...new Set(supremeHQLeads.map(lead => lead.stage).filter(Boolean))];
    const conversionStatusValues = [...new Set(supremeHQLeads.map(lead => lead.conversionStatus).filter(Boolean))];
    
    return {
      totalLeads: supremeHQLeads.length,
      convertedByStatus: convertedByStatus.length,
      convertedByStage: convertedByStage.length,
      inconsistentLeads: inconsistentLeads.length,
      issues: {
        membershipSoldButNotConverted,
        convertedButNoMembershipStage,
        allInconsistentLeads: inconsistentLeads
      },
      stageValues,
      conversionStatusValues
    };
  }, [leadsData]);
};

/**
 * React component to display the Supreme HQ leads discrepancy analysis
 */
export const SupremeHQLeadsDiscrepancyReport: React.FC<{ leadsData: LeadsData[] }> = ({ leadsData }) => {
  const analysis = useSupremeHQLeadsAnalysis(leadsData);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-red-200">
      <h3 className="text-xl font-bold text-red-700 mb-4">
        🚨 Supreme HQ Leads Data Discrepancy Analysis
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-sm text-blue-600">Total Leads</div>
          <div className="text-2xl font-bold text-blue-700">{analysis.totalLeads}</div>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <div className="text-sm text-green-600">Converted (Status)</div>
          <div className="text-2xl font-bold text-green-700">{analysis.convertedByStatus}</div>
        </div>
        <div className="bg-orange-50 p-3 rounded">
          <div className="text-sm text-orange-600">Converted (Stage)</div>
          <div className="text-2xl font-bold text-orange-700">{analysis.convertedByStage}</div>
        </div>
        <div className="bg-red-50 p-3 rounded">
          <div className="text-sm text-red-600">Inconsistencies</div>
          <div className="text-2xl font-bold text-red-700">{analysis.inconsistentLeads}</div>
        </div>
      </div>

      {analysis.inconsistentLeads > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-red-600 mb-3">
            🔍 Data Inconsistencies Found
          </h4>
          <div className="space-y-3">
            {analysis.issues.membershipSoldButNotConverted.length > 0 && (
              <div className="bg-red-50 p-3 rounded border-l-4 border-red-400">
                <div className="font-semibold text-red-700">
                  Stage indicates "Membership Sold" but conversionStatus ≠ "Converted": {analysis.issues.membershipSoldButNotConverted.length}
                </div>
                <div className="mt-2 text-sm">
                  {analysis.issues.membershipSoldButNotConverted.slice(0, 3).map(lead => (
                    <div key={lead.id} className="text-red-600">
                      • {lead.fullName} - Stage: "{lead.stage}", Status: "{lead.conversionStatus}"
                    </div>
                  ))}
                  {analysis.issues.membershipSoldButNotConverted.length > 3 && (
                    <div className="text-red-500 italic">
                      ...and {analysis.issues.membershipSoldButNotConverted.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {analysis.issues.convertedButNoMembershipStage.length > 0 && (
              <div className="bg-orange-50 p-3 rounded border-l-4 border-orange-400">
                <div className="font-semibold text-orange-700">
                  conversionStatus = "Converted" but stage doesn't indicate conversion: {analysis.issues.convertedButNoMembershipStage.length}
                </div>
                <div className="mt-2 text-sm">
                  {analysis.issues.convertedButNoMembershipStage.slice(0, 3).map(lead => (
                    <div key={lead.id} className="text-orange-600">
                      • {lead.fullName} - Stage: "{lead.stage}", Status: "{lead.conversionStatus}"
                    </div>
                  ))}
                  {analysis.issues.convertedButNoMembershipStage.length > 3 && (
                    <div className="text-orange-500 italic">
                      ...and {analysis.issues.convertedButNoMembershipStage.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded">
          <div className="font-semibold text-gray-700 mb-2">Unique Stage Values:</div>
          <div className="text-sm text-gray-600">
            {analysis.stageValues.join(', ') || 'None found'}
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <div className="font-semibold text-gray-700 mb-2">Unique Conversion Status Values:</div>
          <div className="text-sm text-gray-600">
            {analysis.conversionStatusValues.join(', ') || 'None found'}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
        <h5 className="font-semibold text-blue-700 mb-2">💡 Explanation of the Discrepancy:</h5>
        <ul className="text-sm text-blue-600 space-y-1">
          <li>• The <strong>converted metric card</strong> uses <code>conversionStatus === 'Converted'</code></li>
          <li>• The <strong>stages analysis table</strong> counts leads where <code>stage</code> contains "Membership Sold" or similar</li>
          <li>• These two fields are not being kept in sync, causing the 1 vs 5 discrepancy</li>
          <li>• Data entry processes need to be updated to maintain consistency between these fields</li>
        </ul>
      </div>
    </div>
  );
};