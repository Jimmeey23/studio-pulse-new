import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, MapPin, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { SessionData } from './types';
import { formatCurrency, formatNumber, formatPercentage } from './utils';

interface EnhancedDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionData[];
  title: string;
}

export default function EnhancedDrilldownModal({ isOpen, onClose, sessions, title }: EnhancedDrilldownModalProps) {
  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const totalCheckIns = sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
  const totalCapacity = sessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
  const totalRevenue = sessions.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
  const fillRate = totalCapacity > 0 ? (totalCheckIns / totalCapacity) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/80 backdrop-blur-md">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {title} Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Summary Metrics */}
        <div className="p-6 border-b border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 glass-card rounded-xl">
              <div className="text-xs text-gray-500 mb-1">Total Sessions</div>
              <div className="text-2xl font-bold text-slate-800">{sessions.length}</div>
            </div>
            <div className="text-center p-4 glass-card rounded-xl">
              <div className="text-xs text-gray-500 mb-1">Total Check-ins</div>
              <div className="text-2xl font-bold text-green-700">{formatNumber(totalCheckIns)}</div>
            </div>
            <div className="text-center p-4 glass-card rounded-xl">
              <div className="text-xs text-gray-500 mb-1">Fill Rate</div>
              <div className="text-2xl font-bold text-blue-700">{formatPercentage(fillRate)}</div>
            </div>
            <div className="text-center p-4 glass-card rounded-xl">
              <div className="text-xs text-gray-500 mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-emerald-700">{formatCurrency(totalRevenue)}</div>
            </div>
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-auto p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Sessions ({sessions.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sessions.map((session, index) => (
              <div key={index} className="p-4 glass-card rounded-xl hover:bg-white/60 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{session.className}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {session.trainerName}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {session.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {session.day} {session.time}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-800">
                      {session.checkedInCount || 0}/{session.capacity || 0}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(session.totalPaid || 0)}
                    </div>
                  </div>
                </div>
              </div>
            ))}</div>
        </div>
      </motion.div>
    </div>
  );
}