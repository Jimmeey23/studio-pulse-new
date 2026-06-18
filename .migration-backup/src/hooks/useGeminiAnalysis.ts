import { useState, useCallback } from 'react';
import { geminiService, type TableSummaryOptions, type GeminiSummaryResult, type TableColumn } from '@/services/geminiService';

interface UseGeminiAnalysisState {
  isLoading: boolean;
  result: GeminiSummaryResult | null;
  error: string | null;
}

export const useGeminiAnalysis = () => {
  const [state, setState] = useState<UseGeminiAnalysisState>({
    isLoading: false,
    result: null,
    error: null
  });

  const generateSummary = useCallback(async (options: TableSummaryOptions) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await geminiService.generateTableSummary(options);
      setState({
        isLoading: false,
        result,
        error: result.error || null
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setState({
        isLoading: false,
        result: null,
        error: errorMessage
      });
      throw error;
    }
  }, []);

  const generateQuickInsights = useCallback(async (
    data: any[], 
    columns: TableColumn[], 
    tableName?: string
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const insights = await geminiService.generateQuickInsights(data, columns, tableName);
      const focus = geminiService['resolveFocusPeriod'] ? (geminiService as any)['resolveFocusPeriod'](data, columns) : null;
      const monthSet = geminiService['collectMonthValues'] ? (geminiService as any)['collectMonthValues'](data, columns) : new Set<string>();
      const diagnostics = focus ? {
        focus: focus.label,
        comparedAgainst: {
          mom: monthSet.has(focus.prev) ? focus.prevLabel : 'not available',
          yoy: monthSet.has(focus.yoy) ? focus.yoyLabel : 'not available'
        }
      } : undefined;

      const result = {
        summary: `Quick analysis of ${data.length} records`,
        keyInsights: insights,
        trends: [],
        recommendations: [],
        diagnostics
      };
      
      setState({
        isLoading: false,
        result,
        error: null
      });
      return insights;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Quick analysis failed';
      setState({
        isLoading: false,
        result: null,
        error: errorMessage
      });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      result: null,
      error: null
    });
  }, []);

  return {
    ...state,
    generateSummary,
    generateQuickInsights,
    reset
  };
};

export type { TableSummaryOptions, GeminiSummaryResult, TableColumn };