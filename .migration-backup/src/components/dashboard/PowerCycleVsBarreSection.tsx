import React from 'react';
import { PayrollData } from '@/types/dashboard';
import { FormatMetricsAnalysis } from './FormatMetricsAnalysis';

interface PowerCycleVsBarreSectionProps {
  data: PayrollData[];
}

export const PowerCycleVsBarreSection: React.FC<PowerCycleVsBarreSectionProps> = ({ data }) => {
  return <FormatMetricsAnalysis data={data || []} />;
};