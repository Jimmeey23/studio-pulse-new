import { useCallback, useEffect, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StudioId = 'all' | 'kwality' | 'supreme' | 'kenkere' | 'popup';

export interface PulseSnapshot {
  studio: StudioId;
  dateRange: { start: string; end: string };
  funnelRankingDimension: 'source' | 'location' | 'stage' | 'membership' | 'class';
  newMemberTableMetric: 'source' | 'membership' | 'class';
  funnelChartMetric: 'leads' | 'converted' | 'retained' | 'ltv';
  funnelRankingCount: 5 | 10 | 15 | 20;
  funnelChartView: 'funnel' | 'bar';
  showFunnelMomTable: boolean;
  showFunnelBreakdownTable: boolean;
  showNewMemberMomTable: boolean;
  showTrainerMomTable: boolean;
  showTrainerFormatSection: boolean;
  scorecardSortKey: 'sessions' | 'customers' | 'paid' | 'classAvg' | 'fillRate' | 'utilization' | 'conversionRate' | 'lateCancels' | 'revenueScore';
  scorecardSortDir: 'desc' | 'asc';
  showClassMomTable: boolean;
  showLapsedMomTable: boolean;
  churnLocationMetric: 'count' | 'penalty';
  lapseRankDimension: 'membership' | 'location';
  sessionRankingDimension: 'class' | 'trainer' | 'format' | 'location' | 'day' | 'time';
  sessionRankingMetric: 'classAvg' | 'fillRate' | 'visits' | 'sessions' | 'revenue' | 'cancellationRate' | 'revPerCheckin' | 'compositeScore';
  sessionRankingCount: 10 | 20 | 30;
  sessionViewMode: 'grouped' | 'flat';
  sessionTableView: 'default' | 'performance' | 'revenue' | 'attendance' | 'capacity' | 'cancellations';
  sessionDensity: 'comfortable' | 'compact';
  sessionMinCheckins: number;
  sessionMinClasses: number;
  sessionIncludeTrainer: boolean;
  sessionStatusFilter: 'all' | 'active' | 'inactive';
  sessionShowAdvanced: boolean;
  sessionExcludeHosted: boolean;
  sessionGrouping: string;
  sessionTopMetric: 'classAvg' | 'fillRate' | 'visits' | 'sessions' | 'revenue' | 'cancellationRate' | 'revPerCheckin' | 'compositeScore';
  sessionBottomMetric: 'classAvg' | 'fillRate' | 'visits' | 'sessions' | 'revenue' | 'cancellationRate' | 'revPerCheckin' | 'compositeScore';
  sessionTopCount: 5 | 10 | 20;
  sessionBottomCount: 5 | 10 | 20;
  showMomTable: boolean;
  insightOpen: boolean;
  drillDownOpen: boolean;
  formatCompTab: 'overview' | 'trainer';
  scrollY: number;
}

export type PresenterRole = 'presenter' | 'viewer' | 'idle';

export interface ViewerPresence {
  name: string;
  joinedAt: number;
  color: string;
}

export interface PresenterModeState {
  role: PresenterRole;
  sessionCode: string | null;
  viewerCount: number;
  viewers: ViewerPresence[];
  isConnected: boolean;
  error: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESENTER_EMAIL = import.meta.env.VITE_PRESENTER_EMAIL ?? 'jimmeey@physique57india.com';
const CHANNEL_PREFIX = 'studio-pulse-session';
const BROADCAST_EVENT = 'state-snapshot';

const AVATAR_COLORS = [
  '#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626',
  '#0891B2', '#65A30D', '#C026D3', '#EA580C', '#0F766E',
];

const IDLE_STATE: PresenterModeState = {
  role: 'idle', sessionCode: null, viewerCount: 0, viewers: [], isConnected: false, error: null,
};

// ─── Parse presence state into viewer list ────────────────────────────────────

function parseViewers(presenceState: Record<string, any[]>): ViewerPresence[] {
  const viewers: ViewerPresence[] = [];
  let colorIdx = 0;
  for (const [key, presences] of Object.entries(presenceState)) {
    if (key === 'presenter') continue;
    const p = presences[0];
    if (!p) continue;
    viewers.push({
      name: p.name ?? p.email ?? `Viewer ${viewers.length + 1}`,
      joinedAt: p.joinedAt ?? Date.now(),
      color: AVATAR_COLORS[colorIdx++ % AVATAR_COLORS.length],
    });
  }
  return viewers.sort((a, b) => a.joinedAt - b.joinedAt);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePresenterMode(userEmail: string | null) {
  const [modeState, setModeState] = useState<PresenterModeState>(IDLE_STATE);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const snapshotCallbackRef = useRef<((snap: PulseSnapshot) => void) | null>(null);
  const lastBroadcastRef = useRef<string>('');
  const roleRef = useRef<PresenterRole>('idle');

  const isPresenter = userEmail?.toLowerCase() === PRESENTER_EMAIL.toLowerCase();

  // keep roleRef always current
  roleRef.current = modeState.role;

  // ─── Cleanup ────────────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    if (channelRef.current && supabase) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    lastBroadcastRef.current = '';
    setModeState(IDLE_STATE);
  }, []);

  useEffect(() => () => { cleanup(); }, [cleanup]);

  // ─── Start presenting ────────────────────────────────────────────────────────

  const startSession = useCallback(() => {
    if (!isPresenter) return;
    if (!supabase) {
      setModeState((s) => ({ ...s, error: 'Supabase not configured — check .env credentials' }));
      return;
    }

    // clean up any existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const channelName = `${CHANNEL_PREFIX}:${code}`;

    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false }, presence: { key: 'presenter' } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ name?: string; email?: string; joinedAt?: number }>();
        const viewers = parseViewers(state as Record<string, any[]>);
        setModeState((s) => ({ ...s, viewers, viewerCount: viewers.length }));
      })
      .subscribe((status) => {
        console.log('[presenter] channel status=', status);
        if (status === 'SUBSCRIBED') {
          channel.track({ role: 'presenter', email: userEmail, joinedAt: Date.now() });
          setModeState({ role: 'presenter', sessionCode: code, viewerCount: 0, viewers: [], isConnected: true, error: null });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setModeState((s) => ({ ...s, isConnected: false, error: 'Connection lost' }));
        }
      });

    channelRef.current = channel;
  }, [isPresenter, userEmail]);

  // ─── Join as viewer ──────────────────────────────────────────────────────────

  const joinSession = useCallback((code: string, name: string, onSnapshot: (snap: PulseSnapshot) => void) => {
    if (!supabase) {
      setModeState((s) => ({ ...s, error: 'Supabase not configured — check .env credentials' }));
      return;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    snapshotCallbackRef.current = onSnapshot;
    const channelName = `${CHANNEL_PREFIX}:${code.toUpperCase()}`;
    const viewerKey = `viewer-${Date.now()}`;

    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false }, presence: { key: viewerKey } },
    });

    channel
      .on('broadcast', { event: BROADCAST_EVENT }, ({ payload }: { payload: PulseSnapshot }) => {
        console.log('[viewer] received broadcast studio=', payload?.studio);
        snapshotCallbackRef.current?.(payload);
      })
      .subscribe((status) => {
        console.log('[viewer] channel status=', status);
        if (status === 'SUBSCRIBED') {
          channel.track({ role: 'viewer', name: name.trim() || 'Guest', joinedAt: Date.now() });
          setModeState({ role: 'viewer', sessionCode: code.toUpperCase(), viewerCount: 0, viewers: [], isConnected: true, error: null });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setModeState((s) => ({ ...s, isConnected: false, error: 'Disconnected from session' }));
        }
      });

    channelRef.current = channel;
  }, []);

  // ─── Broadcast (presenter only, diff-gated, reads role via ref) ──────────────

  const broadcastSnapshot = useCallback((snap: PulseSnapshot) => {
    if (roleRef.current !== 'presenter') return;
    if (!channelRef.current) {
      console.warn('[presenter] broadcastSnapshot: no channel');
      return;
    }
    const serialized = JSON.stringify(snap);
    if (serialized === lastBroadcastRef.current) return;
    lastBroadcastRef.current = serialized;
    console.log('[presenter] broadcasting studio=', snap.studio);
    channelRef.current.send({ type: 'broadcast', event: BROADCAST_EVENT, payload: snap });
  }, []); // intentionally empty — reads everything via refs

  // ─── End session ────────────────────────────────────────────────────────────

  const endSession = useCallback(() => { cleanup(); }, [cleanup]);

  return { modeState, isPresenter, startSession, joinSession, endSession, broadcastSnapshot };
}
