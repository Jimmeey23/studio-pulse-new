import React from 'react';
import type { OverviewAdapterProps } from '../types';
import { buildOverviewModuleContent } from '../moduleBuilders';
import { OverviewModuleView } from '../OverviewModuleView';

const LateCancellationsOverviewAdapter: React.FC<OverviewAdapterProps> = ({ data }) => (
  <OverviewModuleView moduleId="late-cancellations" module={buildOverviewModuleContent('late-cancellations', data)} />
);

export default LateCancellationsOverviewAdapter;
