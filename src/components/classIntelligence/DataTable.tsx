import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowUp, ArrowDown, Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import type { SessionData } from './types';
import { formatNumber, formatCurrency } from './utils';

type Props = { sessions: SessionData[] };

type SortKey = 'className' | 'trainerName' | 'day' | 'checkedInCount' | 'capacity' | 'totalPaid';

export default function DataTable({ sessions }: Props) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey | null>(null);
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions.filter((s) => {
      if (!q) return true;
      return (
        (s.className || '').toLowerCase().includes(q) ||
        (s.trainerName || '').toLowerCase().includes(q) ||
        (s.location || '').toLowerCase().includes(q) ||
        (s.day || '').toLowerCase().includes(q)
      );
    });
  }, [sessions, query]);

  const sorted = useMemo(() => {
    if (!sortBy) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = (a as any)[sortBy];
      const bv = (b as any)[sortBy];
      if (av == null && bv == null) return 0;
      if (av == null) return dir === 'asc' ? -1 : 1;
      if (bv == null) return dir === 'asc' ? 1 : -1;
      if (typeof av === 'number' && typeof bv === 'number') return dir === 'asc' ? av - bv : bv - av;
      return dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [filtered, sortBy, dir]);

  // Pagination
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sorted.slice(startIndex, startIndex + itemsPerPage);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setDir(dir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setDir('desc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (key: SortKey) => {
    if (sortBy !== key) return null;
    return dir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No sessions available.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search class, trainer, location, or day"
            className="pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium"
          />
        </div>
        <div className="text-sm text-gray-600 font-medium">
          Showing {paginatedData.length} of {sorted.length} sessions
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/90 rounded-xl overflow-hidden shadow-lg border border-white/20">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <tr>
                <th 
                  className="text-left p-4 font-bold text-gray-700 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => toggleSort('className')}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Class {getSortIcon('className')}
                  </div>
                </th>
                <th 
                  className="text-left p-4 font-bold text-gray-700 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => toggleSort('trainerName')}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Trainer {getSortIcon('trainerName')}
                  </div>
                </th>
                <th 
                  className="text-left p-4 font-bold text-gray-700 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => toggleSort('day')}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Day & Time {getSortIcon('day')}
                  </div>
                </th>
                <th className="text-left p-4 font-bold text-gray-700">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Location
                  </div>
                </th>
                <th 
                  className="text-center p-4 font-bold text-gray-700 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => toggleSort('checkedInCount')}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Attendance {getSortIcon('checkedInCount')}
                  </div>
                </th>
                <th 
                  className="text-center p-4 font-bold text-gray-700 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => toggleSort('capacity')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Capacity {getSortIcon('capacity')}
                  </div>
                </th>
                <th 
                  className="text-right p-4 font-bold text-gray-700 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => toggleSort('totalPaid')}
                >
                  <div className="flex items-center justify-end gap-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    Revenue {getSortIcon('totalPaid')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((session, index) => {
                const fillRate = (session.capacity && session.capacity > 0) 
                  ? (session.checkedInCount || 0) / session.capacity * 100 
                  : 0;
                
                return (
                  <motion.tr
                    key={session.id || `${session.className}-${session.startTime || Math.random()}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-semibold text-gray-800 max-w-[200px] truncate">
                        {session.className || 'Unknown'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-700">
                        {session.trainerName || 'Unknown'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-700">
                        {session.day} {session.time}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-700 max-w-[150px] truncate">
                        {session.location || 'Unknown'}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-bold text-gray-800">
                          {session.checkedInCount ?? 0}
                        </span>
                        {session.capacity && (
                          <span className="text-sm text-gray-500">
                            ({formatNumber(fillRate, 0)}%)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-medium text-gray-700">
                        {session.capacity ?? '-'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-green-700">
                        {formatCurrency(session.totalPaid ?? 0)}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
