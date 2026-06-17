export interface SessionData {
  id: string;
  className: string;
  date: string; // ISO
  day?: string; // Day of week
  time?: string; // Time of day
  location?: string;
  capacity?: number;
  bookings?: number;
  checkins?: number;
  revenue?: number;
  instructor?: string;
  lateCancelled?: number;
  waitlisted?: number;
  status?: 'Active' | 'Inactive';
  [key: string]: any;
}

export interface CalculatedMetrics {
  classes: number;
  emptyClasses: number;
  nonEmptyClasses: number;
  fillRate: number;
  cancellationRate: number;
  waitlistRate: number;
  rank: number;
  classAvg: number;
  classAvgNonEmpty: number;
  revPerBooking: number;
  revPerCheckin: number;
  revLostPerCancellation: number;
  weightedAverage: number;
  consistencyScore: number;
  totalRevenue: number;
  totalCheckIns: number;
  totalBookings: number;
  totalCancellations: number;
  totalCapacity: number;
  totalBooked: number;
  totalWaitlisted: number;
  status: 'Active' | 'Inactive';
  mostRecentDate?: Date;
  compositeScore: number;
}

export interface GroupedRow extends CalculatedMetrics {
  id: string;
  className: string;
  day: string;
  time: string;
  location: string;
  trainer: string;
  date?: string;
  children?: GroupedRow[];
}

export type RankingMetric = 
  | 'classAvg'
  | 'fillRate'
  | 'totalRevenue'
  | 'consistencyScore'
  | 'totalCancellations'
  | 'totalBooked'
  | 'classes'
  | 'compositeScore'
  | 'revPerCheckin'
  | 'revPerBooking'
  | 'cancellationRate'
  | 'waitlistRate'
  | 'totalWaitlisted'
  | 'revLostPerCancellation';

export type GroupBy =
  | 'ClassDayTimeLocation'
  | 'ClassDayTimeLocationTrainer'
  | 'LocationClass'
  | 'ClassDay'
  | 'ClassDayTime'
  | 'ClassDayTrainer'
  | 'DayTimeLocation'
  | 'ClassTime'
  | 'TrainerLocation'
  | 'DayLocation'
  | 'TimeLocation'
  | 'ClassTrainer'
  | 'TrainerDay'
  | 'DayTime'
  | 'ClassLocation'
  | 'TrainerTime'
  | 'Class'
  | 'Day'
  | 'Time'
  | 'Location'
  | 'Trainer'
  | 'LocationClassDay'
  | 'TrainerClass'
  | 'Month'
  | 'Week'
  | 'ClassMonth'
  | 'LocationMonth';

export type ViewMode = 'grouped' | 'flat';
