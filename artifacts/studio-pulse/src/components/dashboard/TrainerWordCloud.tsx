import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
interface TrainerWordCloudProps {
  data: Array<{
    name: string;
    conversion: number;
    totalValue: number;
    sessions: number;
  }>;
}
export const TrainerWordCloud = ({
  data
}: TrainerWordCloudProps) => {
  const processedTrainers = useMemo(() => {
    if (!data || data.length === 0) return [];
    const maxConversion = Math.max(...data.map(d => d.conversion));
    const minConversion = Math.min(...data.map(d => d.conversion));
    return data.map(trainer => {
      const normalizedSize = (trainer.conversion - minConversion) / (maxConversion - minConversion) * 60 + 20;
      const intensity = trainer.conversion / maxConversion * 100;
      return {
        ...trainer,
        fontSize: normalizedSize,
        opacity: Math.max(0.3, intensity / 100),
        color: intensity > 75 ? '#10b981' : intensity > 50 ? '#3b82f6' : intensity > 25 ? '#f59e0b' : '#ef4444'
      };
    }).sort((a, b) => b.conversion - a.conversion);
  }, [data]);
  if (!data || data.length === 0) {
    return <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
        <CardContent className="p-6 text-center text-slate-600">
          No trainer data available for word cloud
        </CardContent>
      </Card>;
  }
  return <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
      
      
    </Card>;
};