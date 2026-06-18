import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { PresenterModeState } from '@/hooks/usePresenterMode';

interface PresenterToolbarProps {
  modeState: PresenterModeState;
  isPresenter: boolean;
  onStart: () => void;
  onEnd: () => void;
  onJoin: (code: string, name: string) => void;
}

function Avatar({ name, color, title }: { name: string; color: string; title?: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      title={title ?? name}
      className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white"
      style={{ backgroundColor: color }}
    >
      {initials || '?'}
    </div>
  );
}

export function PresenterToolbar({ modeState, isPresenter, onStart, onEnd, onJoin }: PresenterToolbarProps) {
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showViewers, setShowViewers] = useState(false);

  // Pre-fill code/name from URL params if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('join');
    const urlName = params.get('viewer');
    if (urlCode) setJoinCode(urlCode.toUpperCase());
    if (urlName) setJoinName(urlName);
    if (urlCode) setShowJoin(true);
  }, []);

  const copyCode = () => {
    if (!modeState.sessionCode) return;
    navigator.clipboard.writeText(modeState.sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyShareLink = () => {
    if (!modeState.sessionCode) return;
    const url = new URL(window.location.href);
    url.searchParams.set('join', modeState.sessionCode);
    url.searchParams.delete('viewer'); // viewer fills their own name
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleJoin = () => {
    if (joinCode.length !== 6) return;
    onJoin(joinCode, joinName);
    setShowJoin(false);
    setJoinCode('');
    setJoinName('');
  };

  // ─── Viewer: following banner ─────────────────────────────────────────────

  if (!isPresenter) {
    if (modeState.role === 'viewer') {
      return (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-2.5 backdrop-blur"
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-500" />
          </span>
          <span className="text-sm font-semibold text-violet-800">
            Following presenter · Session <span className="font-mono">{modeState.sessionCode}</span>
          </span>
          {!modeState.isConnected && (
            <span className="ml-auto rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">Reconnecting…</span>
          )}
        </motion.div>
      );
    }

    return (
      <div className="mb-4 flex items-center gap-2">
        <AnimatePresence>
          {showJoin && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <input
                className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-mono font-bold uppercase tracking-widest text-slate-700 shadow-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                placeholder="ABC123"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
              <input
                className="w-32 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                placeholder="Your name"
                maxLength={24}
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
              <button
                disabled={joinCode.length !== 6}
                onClick={handleJoin}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-40"
              >
                Join
              </button>
              <button
                onClick={() => setShowJoin(false)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-500 shadow-sm transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        {!showJoin && (
          <button
            onClick={() => setShowJoin(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.07A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            Join Session
          </button>
        )}
      </div>
    );
  }

  // ─── Presenter controls ───────────────────────────────────────────────────

  return (
    <div className="mb-4 flex items-center gap-3">
      {modeState.role === 'idle' && (
        <button
          onClick={onStart}
          className="flex items-center gap-2 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-violet-700 hover:to-purple-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.07A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
          Start Presenting
        </button>
      )}

      {modeState.role === 'presenter' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative flex items-center gap-3 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 px-4 py-2.5 shadow-sm"
        >
          {/* Live indicator */}
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-500" />
          </span>
          <span className="text-sm font-bold text-violet-800">Presenting</span>

          <div className="h-4 w-px bg-violet-200" />

          {/* Session code */}
          <span className="text-xs text-slate-500">Code</span>
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-2.5 py-1 font-mono text-sm font-black tracking-widest text-violet-700 shadow-sm transition hover:bg-violet-50"
            title="Click to copy"
          >
            {modeState.sessionCode}
            <svg className="h-3.5 w-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {copied
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              }
            </svg>
          </button>

          {/* Copy share link */}
          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-2.5 py-1 text-xs font-semibold text-violet-600 shadow-sm transition hover:bg-violet-50"
            title="Copy shareable join link"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {copiedLink
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              }
            </svg>
            {copiedLink ? 'Copied!' : 'Share Link'}
          </button>

          <div className="h-4 w-px bg-violet-200" />

          {/* Viewer avatars */}
          <button
            onClick={() => setShowViewers((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-1.5 py-0.5 transition hover:bg-violet-100"
          >
            {modeState.viewers.length === 0 ? (
              <span className="text-xs text-slate-400">No viewers yet</span>
            ) : (
              <div className="flex -space-x-1.5">
                {modeState.viewers.slice(0, 6).map((v, i) => (
                  <Avatar key={i} name={v.name} color={v.color} title={v.name} />
                ))}
                {modeState.viewers.length > 6 && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 ring-2 ring-white">
                    +{modeState.viewers.length - 6}
                  </div>
                )}
              </div>
            )}
            <span className="text-xs font-semibold text-slate-600">
              {modeState.viewerCount} viewer{modeState.viewerCount !== 1 ? 's' : ''}
            </span>
          </button>

          {/* Viewer list dropdown */}
          <AnimatePresence>
            {showViewers && modeState.viewers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-full z-50 mt-2 min-w-[200px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
              >
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Live viewers</p>
                {modeState.viewers.map((v, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                    <Avatar name={v.name} color={v.color} />
                    <span className="text-sm font-medium text-slate-700">{v.name}</span>
                    <span className="ml-auto text-[10px] text-slate-400">
                      {new Date(v.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {!modeState.isConnected && (
            <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">Reconnecting…</span>
          )}

          <button
            onClick={onEnd}
            className="ml-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100"
          >
            End
          </button>
        </motion.div>
      )}
    </div>
  );
}
