import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { SessionData } from './types';
import { formatCurrency, formatPercentage } from './utils';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionData[];
  title: string;
};

export default function EnhancedDrilldownModal2({ isOpen, onClose, sessions, title }: Props) {
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const aDate = a.startTime || '';
      const bDate = b.startTime || '';
      return aDate.localeCompare(bDate);
    });
  }, [sessions]);

  const [search, setSearch] = useState('');
  const [filterTrainer, setFilterTrainer] = useState('All Trainers');
  const [filterLocation, setFilterLocation] = useState('All Locations');
  const [filterDay, setFilterDay] = useState('All Days');

  const trainers = useMemo(() => Array.from(new Set(sessions.map(s => s.trainerName).filter(Boolean))).sort(), [sessions]);
  const locations = useMemo(() => Array.from(new Set(sessions.map(s => s.location).filter(Boolean))).sort(), [sessions]);
  const days = useMemo(() => Array.from(new Set(sessions.map(s => s.day).filter(Boolean))).sort(), [sessions]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedSessions.filter(s => {
      if (filterTrainer !== 'All Trainers' && (s.trainerName || '') !== filterTrainer) return false;
      if (filterLocation !== 'All Locations' && (s.location || '') !== filterLocation) return false;
      if (filterDay !== 'All Days' && (s.day || '') !== filterDay) return false;
      if (!q) return true;
      const hay = `${s.className || ''} ${s.trainerName || ''} ${s.location || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [sortedSessions, search, filterTrainer, filterLocation, filterDay]);

  const metrics = useMemo(() => {
    const totalSessions = sessions.length;
    const emptySessions = sessions.filter(s => (s.checkedInCount || 0) === 0).length;
    const nonEmptySessions = totalSessions - emptySessions;
    const totalCheckIns = sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
    const totalCapacity = sessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
    const totalRevenue = sessions.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
    const avgFillRate = totalCapacity > 0 ? (totalCheckIns / totalCapacity) * 100 : 0;
    const avgCheckIns = totalSessions > 0 ? totalCheckIns / totalSessions : 0;
    const avgCheckInsWithoutEmpty = nonEmptySessions > 0 ? totalCheckIns / nonEmptySessions : 0;
    const revenuePerSeat = totalCheckIns > 0 ? totalRevenue / totalCheckIns : 0;
    return { totalSessions, emptySessions, nonEmptySessions, totalCheckIns, totalCapacity, totalRevenue, avgFillRate, avgCheckIns, avgCheckInsWithoutEmpty, revenuePerSeat };
  }, [sessions]);

  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    panelRef.current?.focus();
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Backdrop" />
          <div className="absolute inset-0 overflow-y-auto">
            <div className="flex min-h-full items-start justify-center p-4 text-center md:items-center md:p-6 lg:p-8">
              <motion.div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                tabIndex={-1}
                className="w-full max-w-7xl rounded-3xl bg-white/80 glass-card text-left shadow-2xl max-h-[90vh] overflow-hidden"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ type: 'spring', stiffness: 260, damping: 25 }}
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 text-white p-8 flex flex-col gap-6 overflow-y-auto max-h-[90vh]">
                    <div className="flex items-start justify-between">
                      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                      <button onClick={onClose} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" aria-label="Close profile">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2" aria-label="Core stats">
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10"><div className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Sessions</div><div className="text-2xl font-bold">{metrics.totalSessions}</div></div>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10"><div className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Avg Attend</div><div className="text-2xl font-bold">{metrics.avgCheckIns.toFixed(1)}</div></div>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10"><div className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Fill Rate</div><div className="text-2xl font-bold">{formatPercentage(metrics.avgFillRate)}</div></div>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10 col-span-2"><div className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Total Revenue</div><div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div></div>
                    </div>
                  </div>
                  <div className="md:w-2/3 p-6 md:p-8 overflow-y-auto max-h-[90vh]">
                    <div className="flex items-start justify-between mb-6"><div><h2 className="text-2xl font-bold text-slate-800">Session Details</h2><div className="text-sm text-slate-500">Advanced profile & performance analytics</div></div></div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-8">
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3 border border-slate-200"><div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Empty</div><div className="text-xl font-bold text-slate-900">{metrics.emptySessions}</div></div>
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3 border border-slate-200"><div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Non-Empty</div><div className="text-xl font-bold text-slate-900">{metrics.nonEmptySessions}</div></div>
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3 border border-slate-200"><div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Capacity</div><div className="text-xl font-bold text-slate-900">{metrics.totalCapacity}</div></div>
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3 border border-slate-200"><div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Checked In</div><div className="text-xl font-bold text-slate-900">{metrics.totalCheckIns}</div></div>
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3 border border-slate-200"><div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Rev / Seat</div><div className="text-xl font-bold text-slate-900">{formatCurrency(metrics.revenuePerSeat)}</div></div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border shadow-sm">
                      <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-slate-800">Individual Sessions</h3><div className="text-sm text-slate-500">{filteredSessions.length} sessions</div></div>
                      <div className="flex flex-wrap gap-3 items-center mb-4">
                        <div className="flex items-center gap-2 flex-1 max-w-md"><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by class, trainer, or location..." className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm" /></div>
                        <select value={filterTrainer} onChange={(e) => setFilterTrainer(e.target.value)} className="px-3 py-2 rounded-xl border-2 border-gray-200 text-sm"><option>All Trainers</option>{trainers.map(t => <option key={t}>{t}</option>)}</select>
                        <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="px-3 py-2 rounded-xl border-2 border-gray-200 text-sm"><option>All Locations</option>{locations.map(l => <option key={l}>{l}</option>)}</select>
                        <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)} className="px-3 py-2 rounded-xl border-2 border-gray-200 text-sm"><option>All Days</option>{days.map(d => <option key={d}>{d}</option>)}</select>
                      </div>
                      <div className="space-y-3">
                        {filteredSessions.map((session, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border hover:shadow-md transition-shadow">
                            <div>
                              <div className="flex items-center gap-3">
                                <div className="px-2 py-1 rounded-full bg-blue-700 text-white text-xs font-semibold">{session.className}</div>
                                <div>
                                  <div className="text-sm font-semibold text-slate-800">{session.day} {session.time}</div>
                                  <div className="text-xs text-slate-500">{session.trainerName} • {session.location}</div>
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-slate-600 flex gap-6 flex-wrap">
                                <div>Revenue <span className="font-semibold text-slate-800">{formatCurrency(session.totalPaid || 0)}</span></div>
                                <div>Capacity <span className="font-semibold text-slate-800">{session.capacity || 0}</span></div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-green-700">{session.checkedInCount}/{session.capacity}</div>
                              <div className="text-xs text-slate-500">{session.capacity ? Math.round(((session.checkedInCount || 0) / session.capacity) * 100) : 0}% full</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 flex justify-end gap-3"><button onClick={onClose} className="px-6 py-3 bg-gradient-to-r from-blue-700 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">Close</button></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
