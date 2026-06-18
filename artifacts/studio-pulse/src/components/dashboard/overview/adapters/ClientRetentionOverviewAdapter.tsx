import React from 'react';
import type { OverviewAdapterProps } from '../types';
import { buildOverviewModuleContent } from '../moduleBuilders';
import { OverviewModuleView } from '../OverviewModuleView';

const ClientRetentionOverviewAdapter: React.FC<OverviewAdapterProps> = ({ data }) => (
  <OverviewModuleView moduleId="client-retention" module={buildOverviewModuleContent('client-retention', data)} />
);

export default ClientRetentionOverviewAdapter;
