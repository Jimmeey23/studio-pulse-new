import React from 'react';
import type { OverviewAdapterProps } from '../types';
import { buildOverviewModuleContent } from '../moduleBuilders';
import { OverviewModuleView } from '../OverviewModuleView';

const ClassAttendanceOverviewAdapter: React.FC<OverviewAdapterProps> = ({ data }) => (
  <OverviewModuleView moduleId="class-attendance" module={buildOverviewModuleContent('class-attendance', data)} />
);

export default ClassAttendanceOverviewAdapter;
