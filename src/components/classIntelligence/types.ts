// GitHub repo compatible types
export interface SessionData {
  SessionID: string;
  Class: string;
  Trainer: string;
  Day: string;
  Time: string;
  Date: string;
  Location: string;
  CheckedIn: number;
  Capacity: number;
  Revenue: number;
  Booked: number;
  LateCancelled: number;
  NoShow: number;
  Waitlisted: number;
}

export type CalculatedMetrics = {
  totalCheckIns: number;
  totalCapacity: number;
  totalRevenue: number;
  sessionCount: number;
  avgCheckIns: number;
  fillRate: number;
  consistency: number;
};

export type RankingMetric = 'avgCheckIns' | 'fillRate' | 'totalRevenue' | 'consistency' | 'sessionCount';
