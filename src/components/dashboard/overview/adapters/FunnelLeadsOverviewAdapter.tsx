import React from 'react';
import type { OverviewAdapterProps } from '../types';
import { buildOverviewModuleContent } from '../moduleBuilders';
import { OverviewModuleView } from '../OverviewModuleView';

const FunnelLeadsOverviewAdapter: React.FC<OverviewAdapterProps> = ({ data }) => (
  <OverviewModuleView moduleId="funnel-leads" module={buildOverviewModuleContent('funnel-leads', data)} />
);

export default FunnelLeadsOverviewAdapter;
