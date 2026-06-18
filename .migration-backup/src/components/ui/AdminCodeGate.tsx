import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminCodeGateProps {
  onUnlock: (code: string) => boolean;
  error: string | null;
  trigger?: React.ReactNode;
}

export function AdminCodeGate({ onUnlock, error, trigger }: AdminCodeGateProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const ok = onUnlock(code);
    if (ok) {
      setOpen(false);
      setCode('');
    } else {
      setShake(true);
      setCode('');
      setTimeout(() => setShake(false), 500);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <>
      <div onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}>
        {trigger ?? (
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm backdrop-blur transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Admin
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm"
              onClick={() => { setOpen(false); setCode(''); }}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={shake ? { opacity: 1, scale: 1, x: [0, -8, 8, -6, 6, 0] } : { opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: shake ? 0.4 : 0.18 }}
              className="fixed left-1/2 top-1/2 z-[301] w-72 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                  <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Admin Access</p>
                  <p className="text-xs text-slate-400">Enter your code to unlock</p>
                </div>
              </div>

              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="••••"
                className="mb-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-lg font-mono font-bold tracking-[0.4em] text-slate-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />

              {error && (
                <p className="mb-2 text-center text-xs font-semibold text-red-500">{error}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setOpen(false); setCode(''); }}
                  className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={!code}
                  className="flex-1 rounded-xl bg-amber-500 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-40"
                >
                  Unlock
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
