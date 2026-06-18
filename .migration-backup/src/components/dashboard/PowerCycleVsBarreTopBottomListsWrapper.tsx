
import React, { useMemo } from 'react';
import { PowerCycleVsBarreTopBottomLists } from './PowerCycleVsBarreTopBottomLists';
import { SessionData as DashboardSessionData } from '@/types/dashboard';
import { SessionData as HookSessionData } from '@/hooks/useSessionsData';

interface PowerCycleVsBarreTopBottomListsWrapperProps {
  powerCycleData: DashboardSessionData[];
  barreData: DashboardSessionData[];
}

export const PowerCycleVsBarreTopBottomListsWrapper: React.FC<PowerCycleVsBarreTopBottomListsWrapperProps> = ({
  powerCycleData,
  barreData
}) => {
  // Convert dashboard SessionData to hook SessionData format
  const convertToHookFormat = (sessions: DashboardSessionData[]): HookSessionData[] => {
    return sessions.map(session => ({
      trainerId: 'unknown',
      trainerFirstName: session.instructor.split(' ')[0] || '',
      trainerLastName: session.instructor.split(' ').slice(1).join(' ') || '',
      trainerName: session.instructor,
      sessionId: session.sessionId,
      sessionName: session.classType,
      capacity: session.capacity,
      checkedInCount: session.checkedIn,
      lateCancelledCount: 0,
      bookedCount: session.booked,
      complimentaryCount: 0,
      location: session.location,
      date: session.date,
      dayOfWeek: new Date(session.date).toLocaleDateString('en-US', { weekday: 'long' }),
      time: session.time,
      totalPaid: 0,
      nonPaidCount: 0,
      uniqueId: `${session.sessionId}-${session.date}`,
      checkedInsWithMemberships: 0,
      checkedInsWithPackages: 0,
      checkedInsWithIntroOffers: 0,
      checkedInsWithSingleClasses: 0,
      classType: session.classType,
      cleanedClass: session.cleanedClass,
      fillPercentage: session.fillPercentage,
      revenue: 0,
      uniqueId1: session.sessionId,
      uniqueId2: session.date,
      classes: 1
    }));
  };

  const convertedPowerCycleData = useMemo(() => convertToHookFormat(powerCycleData), [powerCycleData]);
  const convertedBarreData = useMemo(() => convertToHookFormat(barreData), [barreData]);

  return (
    <PowerCycleVsBarreTopBottomLists
      powerCycleData={convertedPowerCycleData}
      barreData={convertedBarreData}
    />
  );
};
