import React from 'react';
import type { OverviewAdapterProps } from '../types';
import { buildOverviewModuleContent } from '../moduleBuilders';
import { OverviewModuleView } from '../OverviewModuleView';

const DiscountsOverviewAdapter: React.FC<OverviewAdapterProps> = ({ data }) => (
  <OverviewModuleView moduleId="discounts-promotions" module={buildOverviewModuleContent('discounts-promotions', data)} />
);

export default DiscountsOverviewAdapter;
