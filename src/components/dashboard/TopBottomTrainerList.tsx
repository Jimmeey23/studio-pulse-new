
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrainerMetrics {
  name: string;
  value: number;
  extra?: string | number;
}

interface TopBottomTrainerListProps {
  title: string;
  trainers: TrainerMetrics[];
  variant?: 'top' | 'bottom';
}

export const TopBottomTrainerList: React.FC<TopBottomTrainerListProps> = ({
  title,
  trainers,
  variant = 'top'
}) => {
  return (
    <Card className={cn(
      'p-2 shadow rounded-xl border',
      variant === 'top' ? 'border-green-300 bg-green-50' : 'border-rose-200 bg-rose-50'
    )}>
      <CardHeader className="flex flex-row items-center gap-2 pb-1">
        <CardTitle className={cn(
          'text-md font-bold flex items-center gap-2',
          variant === 'top' ? 'text-green-800' : 'text-rose-700'
        )}>
          {variant === 'top' ? <ArrowUp className="w-4 h-4 text-green-500" /> : <ArrowDown className="w-4 h-4 text-rose-500" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y text-xs">
          {trainers.map((trainer, i) => (
            <li key={trainer.name} className="flex justify-between py-[7px] text-slate-900 font-medium" style={{ minHeight: 25, height: 25 }}>
              <span>{i+1}. {trainer.name}</span>
              <span className="font-mono">{trainer.value}</span>
              {trainer.extra && <span className="ml-3 text-slate-500">{trainer.extra}</span>}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
