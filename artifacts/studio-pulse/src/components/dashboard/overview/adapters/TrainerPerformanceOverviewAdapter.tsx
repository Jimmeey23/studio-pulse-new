import React from 'react';
import type { OverviewAdapterProps } from '../types';
import { buildOverviewModuleContent } from '../moduleBuilders';
import { OverviewModuleView } from '../OverviewModuleView';

const TrainerPerformanceOverviewAdapter: React.FC<OverviewAdapterProps> = ({ data }) => (
  <OverviewModuleView moduleId="trainer-performance" module={buildOverviewModuleContent('trainer-performance', data)} />
);

export default TrainerPerformanceOverviewAdapter;
