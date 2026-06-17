import React, { useMemo, useState } from 'react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { SessionData } from '@/hooks/useSessionsData';
import { getClassFormat } from '@/utils/classTypeUtils';
import { User, Dumbbell, Clock, TrendingUp, BarChart3, Percent, AlertCircle } from 'lucide-react';

interface EnhancedComparisonToolProps {
  data: SessionData[];
}

type ComparisonMode = 'trainers' | 'classes' | 'times';

const EnhancedComparisonTool: React.FC<EnhancedComparisonToolProps> = ({ data }) => {
  const sessions = Array.isArray(data) ? data : [];
  const [mode, setMode] = useState<ComparisonMode>('trainers');
  const [selected, setSelected] = useState<string[]>([]);



  const items = useMemo(() => {
    if (mode === 'trainers') return Array.from(new Set(sessions.map(s => s.trainerName).filter(Boolean)));
    if (mode === 'classes') return Array.from(new Set(sessions.map(s => getClassFormat(s.cleanedClass || s.classType)).filter(Boolean)));
    return Array.from(new Set(sessions.map(s => s.time).filter(Boolean))).sort();
  }, [sessions, mode]);

  const toggle = (val: string) => {
    setSelected(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val].slice(0, 6));
  };

  const comparison = useMemo(() => {
    return selected.map(key => {
      const rows = sessions.filter(s => {
        if (mode === 'trainers') return s.trainerName === key;
        if (mode === 'classes') return getClassFormat(s.cleanedClass || s.classType) === key;
        return s.time === key;
      });
      const totalSessions = rows.length;
      const totalRevenue = rows.reduce((sum, r) => sum + (r.totalPaid || r.revenue || 0), 0);
      const totalCapacity = rows.reduce((sum, r) => sum + (r.capacity || 0), 0);
      const totalCheckins = rows.reduce((sum, r) => sum + (r.checkedInCount || 0), 0);
      const lateCancelled = rows.reduce((sum, r) => sum + (r.lateCancelledCount || 0), 0);
      const avgFill = totalCapacity > 0 ? (totalCheckins / totalCapacity) * 100 : 0;
      const avgRevPerSession = totalSessions > 0 ? totalRevenue / totalSessions : 0;
      const noShowRate = totalSessions > 0 ? (lateCancelled / totalSessions) * 100 : 0;
      const avgCapacity = totalSessions > 0 ? Math.round(totalCapacity / totalSessions) : 0;
      return { key, rows, totalSessions, totalRevenue, totalCapacity, totalCheckins, lateCancelled, avgFill, avgRevPerSession, noShowRate, avgCapacity };
    });
  }, [selected, sessions, mode]);

  const modeButtons = [
    { key: 'trainers' as ComparisonMode, label: 'Trainers', icon: User, color: 'from-blue-500 to-blue-700' },
    { key: 'classes' as ComparisonMode, label: 'Classes', icon: Dumbbell, color: 'from-purple-500 to-purple-700' },
    { key: 'times' as ComparisonMode, label: 'Times', icon: Clock, color: 'from-pink-500 to-pink-700' }
  ];

  return (
    <div className="space-y-6 text-gray-900">
      {/* Header with Beautiful Typography */}
      <div className="bg-gradient-to-r from-slate-50 via-purple-50 to-slate-100 rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Advanced Comparison Tool</h3>
            <p className="text-sm text-slate-700">Side-by-side analysis of up to 6 items with comprehensive metrics and visual insights</p>
          </div>
          <div className="text-3xl opacity-10">🔍</div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap gap-2">
        {modeButtons.map(btn => {
          const Icon = btn.icon;
          return (
            <button 
              key={btn.key} 
              onClick={() => { setMode(btn.key); setSelected([]); }} 
              className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                mode === btn.key 
                  ? `bg-gradient-to-r ${btn.color} text-white shadow-lg scale-105` 
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <Icon className="w-4 h-4" />
              {btn.label}
            </button>
          );
        })}
      </div>

      {/* Top Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wide flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Select up to 6
        </div>
        <div className="max-h-40 overflow-y-auto flex flex-wrap gap-2">
          {items.length === 0 && (
            <div className="text-sm text-slate-400 text-center py-4 w-full">No items found</div>
          )}
          {items.map((item, idx) => {
            const count = sessions.filter(s => mode === 'trainers' ? s.trainerName === item : mode === 'classes' ? getClassFormat(s.cleanedClass || s.classType) === item : s.time === item).length;
            return (
              <label key={item} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 border ${
                selected.includes(item) 
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm' 
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}>
                <input 
                  type="checkbox" 
                  checked={selected.includes(item)} 
                  onChange={() => toggle(item)} 
                  className="rounded w-4 h-4 accent-white cursor-pointer" 
                />
                <span className={`text-sm font-medium truncate ${selected.includes(item) ? 'text-white' : 'text-slate-700'}`}>{item}</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  selected.includes(item)
                    ? 'bg-white text-blue-700'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      <div>
        {comparison.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {comparison.map((c, idx) => (
              <div key={c.key} className="bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${
                  idx % 3 === 0 ? 'from-blue-500 to-blue-600' :
                  idx % 3 === 1 ? 'from-purple-500 to-purple-600' :
                  'from-pink-500 to-pink-600'
                }`} />
                <div className="p-6 border-b border-slate-100">
                  <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wide">{mode.slice(0, -1)}</div>
                  <div className="text-xl font-bold text-slate-900 truncate">{c.key}</div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xs text-blue-600 font-bold mb-1">Sessions</div>
                      <div className="text-lg font-bold text-blue-900">{formatNumber(c.totalSessions)}</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xs text-green-600 font-bold mb-1">Revenue</div>
                      <div className="text-lg font-bold text-green-900">{formatCurrency(c.totalRevenue)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-xs text-purple-600 font-bold mb-1">Check-ins</div>
                      <div className="text-lg font-bold text-purple-900">{formatNumber(c.totalCheckins)}</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-xs text-orange-600 font-bold mb-1">Capacity</div>
                      <div className="text-lg font-bold text-orange-900">{formatNumber(c.totalCapacity)}</div>
                    </div>
                  </div>
                  <div className="pt-2 space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-slate-600 font-medium">Fill Rate</span>
                      <span className={`text-sm font-bold px-2 py-1 rounded ${
                        c.avgFill >= 75 ? 'bg-blue-800 text-white' : 
                        'bg-rose-600 text-white'
                      }`}>
                        {c.avgFill.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-slate-600 font-medium">Rev/Session</span>
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(c.avgRevPerSession)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-slate-600 font-medium">Late Cancel</span>
                      <span className={`text-sm font-bold px-2 py-1 rounded ${
                        c.noShowRate <= 10 ? 'bg-blue-800 text-white' : 
                        'bg-rose-600 text-white'
                      }`}>
                        {c.noShowRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-slate-600 font-medium">Avg Capacity</span>
                      <span className="text-sm font-bold text-slate-900">{c.avgCapacity}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center h-64 flex flex-col items-center justify-center">
            <div className="text-6xl mb-4 opacity-20">👈</div>
            <div className="text-lg font-bold text-slate-600 mb-2">No Items Selected</div>
            <div className="text-sm text-slate-500">Select up to 6 items from the selector above to begin comparison</div>
            <div className="text-xs text-slate-400 mt-3">Side-by-side analysis will appear here</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedComparisonTool;
