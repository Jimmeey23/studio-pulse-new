
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SessionData } from '@/hooks/useSessionsData';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';

interface SessionsAnomalyDetectionProps {
  data: SessionData[];
}

export const SessionsAnomalyDetection: React.FC<SessionsAnomalyDetectionProps> = ({ data }) => {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Anomaly Detection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Attendance Anomalies</h3>
          <p className="text-gray-500">Detecting unusual patterns in class attendance due to schedule or instructor changes</p>
        </div>
      </CardContent>
    </Card>
  );
};
