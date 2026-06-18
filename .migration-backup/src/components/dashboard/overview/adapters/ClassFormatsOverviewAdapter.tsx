import React from 'react';
import type { OverviewAdapterProps } from '../types';
import { buildOverviewModuleContent } from '../moduleBuilders';
import { OverviewModuleView } from '../OverviewModuleView';

const ClassFormatsOverviewAdapter: React.FC<OverviewAdapterProps> = ({ data }) => (
  <OverviewModuleView moduleId="class-formats" module={buildOverviewModuleContent('class-formats', data)} />
);

export default ClassFormatsOverviewAdapter;
