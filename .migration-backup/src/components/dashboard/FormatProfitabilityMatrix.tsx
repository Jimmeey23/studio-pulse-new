import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SessionData } from '@/hooks/useSessionsData';
import { formatNumber, formatPercentage, formatCurrency } from '@/utils/formatters';
import { TrendingUp, Star, DollarSign, Target, Zap } from 'lucide-react';

interface Props {
  data: SessionData[];
}

interface FormatPosition {
  format: string;
  profitability: number; // Revenue per session
  popularity: number; // Fill rate %
  totalRevenue: number;
  totalSessions: number;
  avgFillRate: number;
  quadrant: 'star' | 'cashCow' | 'potential' | 'dog';
}

export const FormatProfitabilityMatrix: React.FC<Props> = ({ data }) => {
  const matrixData = useMemo(() => {
    const formats = ['Barre', 'PowerCycle', 'Strength'];
    
    const formatMetrics = formats.map(format => {
      const formatData = data.filter(s => 
        s.classType === format || s.cleanedClass === format
      );

      if (formatData.length === 0) {
        return {
          format,
          profitability: 0,
          popularity: 0,
          totalRevenue: 0,
          totalSessions: 0,
          avgFillRate: 0,
          quadrant: 'dog' as const
        };
      }

      const totalRevenue = formatData.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
      const totalSessions = formatData.length;
      const profitability = totalSessions > 0 ? totalRevenue / totalSessions : 0;
      
      const totalCapacity = formatData.reduce((sum, s) => sum + (s.capacity || 0), 0);
      const totalCheckins = formatData.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
      const avgFillRate = totalCapacity > 0 ? (totalCheckins / totalCapacity) * 100 : 0;

      return {
        format,
        profitability,
        popularity: avgFillRate,
        totalRevenue,
        totalSessions,
        avgFillRate
      };
    });

    // Calculate medians for quadrant placement
    const profitabilities = formatMetrics.map(f => f.profitability);
    const popularities = formatMetrics.map(f => f.popularity);
    
    const medianProfitability = profitabilities.sort((a, b) => a - b)[Math.floor(profitabilities.length / 2)];
    const medianPopularity = popularities.sort((a, b) => a - b)[Math.floor(popularities.length / 2)];

    // Assign quadrants
    const positionedFormats: FormatPosition[] = formatMetrics.map(fm => {
      let quadrant: FormatPosition['quadrant'];
      
      if (fm.profitability >= medianProfitability && fm.popularity >= medianPopularity) {
        quadrant = 'star'; // High profitability, high popularity
      } else if (fm.profitability >= medianProfitability && fm.popularity < medianPopularity) {
        quadrant = 'cashCow'; // High profitability, low popularity
      } else if (fm.profitability < medianProfitability && fm.popularity >= medianPopularity) {
        quadrant = 'potential'; // Low profitability, high popularity
      } else {
        quadrant = 'dog'; // Low profitability, low popularity
      }

      return { ...fm, quadrant };
    });

    return { positions: positionedFormats, medianProfitability, medianPopularity };
  }, [data]);

  const getQuadrantInfo = (quadrant: FormatPosition['quadrant']) => {
    switch (quadrant) {
      case 'star':
        return {
          title: '⭐ Stars',
          description: 'High revenue, high demand',
          color: 'emerald',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-300',
          strategy: 'Invest & Grow: Maximize capacity, premium pricing'
        };
      case 'cashCow':
        return {
          title: '💰 Cash Cows',
          description: 'High revenue, lower demand',
          color: 'blue',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-300',
          strategy: 'Maintain & Optimize: Focus on efficiency and margins'
        };
      case 'potential':
        return {
          title: '🌱 Potential',
          description: 'High demand, lower revenue',
          color: 'orange',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-300',
          strategy: 'Develop: Increase pricing or upsell opportunities'
        };
      case 'dog':
        return {
          title: '⚠️ Question Marks',
          description: 'Lower revenue, lower demand',
          color: 'slate',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-300',
          strategy: 'Reevaluate: Consider repositioning or phasing out'
        };
    }
  };

  const quadrants: FormatPosition['quadrant'][] = ['star', 'cashCow', 'potential', 'dog'];

  return (
    <div className="space-y-6">
      {/* BCG Matrix Visualization */}
      <Card className="bg-gradient-to-br from-white via-slate-50 to-white border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-600" />
            Format Profitability Matrix (BCG Analysis)
          </CardTitle>
          <p className="text-sm text-slate-600 mt-2">
            Strategic positioning based on revenue per session and fill rate
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Stars Quadrant (Top Right) */}
            <div className={`p-6 rounded-lg ${getQuadrantInfo('star').bgColor} border-2 ${getQuadrantInfo('star').borderColor}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-900">{getQuadrantInfo('star').title}</h3>
                <Star className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-xs text-slate-600 mb-3">{getQuadrantInfo('star').description}</p>
              
              {matrixData.positions.filter(p => p.quadrant === 'star').map(pos => (
                <div key={pos.format} className="mb-3 p-3 bg-white rounded-lg border border-emerald-200">
                  <p className="font-semibold text-sm text-slate-900">{pos.format}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-xs text-slate-600">Rev/Session</p>
                      <p className="text-sm font-bold text-emerald-700">{formatCurrency(pos.profitability)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Fill Rate</p>
                      <p className="text-sm font-bold text-emerald-700">{formatPercentage(pos.popularity)}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {matrixData.positions.filter(p => p.quadrant === 'star').length === 0 && (
                <p className="text-xs text-slate-500 italic">No formats in this quadrant</p>
              )}
              
              <div className="mt-4 p-2 bg-white rounded border border-emerald-200">
                <p className="text-xs font-semibold text-emerald-700">Strategy:</p>
                <p className="text-xs text-slate-700 mt-1">{getQuadrantInfo('star').strategy}</p>
              </div>
            </div>

            {/* Cash Cows Quadrant (Top Left) */}
            <div className={`p-6 rounded-lg ${getQuadrantInfo('cashCow').bgColor} border-2 ${getQuadrantInfo('cashCow').borderColor}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-900">{getQuadrantInfo('cashCow').title}</h3>
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-xs text-slate-600 mb-3">{getQuadrantInfo('cashCow').description}</p>
              
              {matrixData.positions.filter(p => p.quadrant === 'cashCow').map(pos => (
                <div key={pos.format} className="mb-3 p-3 bg-white rounded-lg border border-blue-200">
                  <p className="font-semibold text-sm text-slate-900">{pos.format}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-xs text-slate-600">Rev/Session</p>
                      <p className="text-sm font-bold text-blue-700">{formatCurrency(pos.profitability)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Fill Rate</p>
                      <p className="text-sm font-bold text-blue-700">{formatPercentage(pos.popularity)}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {matrixData.positions.filter(p => p.quadrant === 'cashCow').length === 0 && (
                <p className="text-xs text-slate-500 italic">No formats in this quadrant</p>
              )}
              
              <div className="mt-4 p-2 bg-white rounded border border-blue-200">
                <p className="text-xs font-semibold text-blue-700">Strategy:</p>
                <p className="text-xs text-slate-700 mt-1">{getQuadrantInfo('cashCow').strategy}</p>
              </div>
            </div>

            {/* Potential Quadrant (Bottom Right) */}
            <div className={`p-6 rounded-lg ${getQuadrantInfo('potential').bgColor} border-2 ${getQuadrantInfo('potential').borderColor}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-900">{getQuadrantInfo('potential').title}</h3>
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-xs text-slate-600 mb-3">{getQuadrantInfo('potential').description}</p>
              
              {matrixData.positions.filter(p => p.quadrant === 'potential').map(pos => (
                <div key={pos.format} className="mb-3 p-3 bg-white rounded-lg border border-orange-200">
                  <p className="font-semibold text-sm text-slate-900">{pos.format}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-xs text-slate-600">Rev/Session</p>
                      <p className="text-sm font-bold text-orange-700">{formatCurrency(pos.profitability)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Fill Rate</p>
                      <p className="text-sm font-bold text-orange-700">{formatPercentage(pos.popularity)}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {matrixData.positions.filter(p => p.quadrant === 'potential').length === 0 && (
                <p className="text-xs text-slate-500 italic">No formats in this quadrant</p>
              )}
              
              <div className="mt-4 p-2 bg-white rounded border border-orange-200">
                <p className="text-xs font-semibold text-orange-700">Strategy:</p>
                <p className="text-xs text-slate-700 mt-1">{getQuadrantInfo('potential').strategy}</p>
              </div>
            </div>

            {/* Dogs Quadrant (Bottom Left) */}
            <div className={`p-6 rounded-lg ${getQuadrantInfo('dog').bgColor} border-2 ${getQuadrantInfo('dog').borderColor}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-900">{getQuadrantInfo('dog').title}</h3>
                <Zap className="w-6 h-6 text-slate-600" />
              </div>
              <p className="text-xs text-slate-600 mb-3">{getQuadrantInfo('dog').description}</p>
              
              {matrixData.positions.filter(p => p.quadrant === 'dog').map(pos => (
                <div key={pos.format} className="mb-3 p-3 bg-white rounded-lg border border-slate-200">
                  <p className="font-semibold text-sm text-slate-900">{pos.format}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-xs text-slate-600">Rev/Session</p>
                      <p className="text-sm font-bold text-slate-700">{formatCurrency(pos.profitability)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Fill Rate</p>
                      <p className="text-sm font-bold text-slate-700">{formatPercentage(pos.popularity)}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {matrixData.positions.filter(p => p.quadrant === 'dog').length === 0 && (
                <p className="text-xs text-slate-500 italic">No formats in this quadrant</p>
              )}
              
              <div className="mt-4 p-2 bg-white rounded border border-slate-200">
                <p className="text-xs font-semibold text-slate-700">Strategy:</p>
                <p className="text-xs text-slate-700 mt-1">{getQuadrantInfo('dog').strategy}</p>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
            <div className="text-center">
              <p className="text-xs text-slate-600 mb-1">Median Revenue/Session</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(matrixData.medianProfitability)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-600 mb-1">Median Fill Rate</p>
              <p className="text-lg font-bold text-slate-900">{formatPercentage(matrixData.medianPopularity)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-600 mb-1">Total Formats Analyzed</p>
              <p className="text-lg font-bold text-slate-900">{matrixData.positions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
