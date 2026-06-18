import React from 'react';
import type { OverviewAdapterProps } from '../types';
import { buildOverviewModuleContent } from '../moduleBuilders';
import { OverviewModuleView } from '../OverviewModuleView';

const ExpirationOverviewAdapter: React.FC<OverviewAdapterProps> = ({ data }) => (
  <OverviewModuleView moduleId="expiration-analytics" module={buildOverviewModuleContent('expiration-analytics', data)} />
);

export default ExpirationOverviewAdapter;
