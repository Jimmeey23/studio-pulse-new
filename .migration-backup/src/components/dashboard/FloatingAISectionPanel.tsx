import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, RefreshCw, Lightbulb, TrendingUp, AlertTriangle, Target, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AISummaryResult {
  bullets: string[];
  narrative?: string;
  lastGenerated: number;
}

interface FloatingAISectionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sectionKey: string;
  getSummary: (key: string) => AISummaryResult | undefined;
  aiSectionLoading: (key: string) => boolean;
  onGenerate: () => void;
}

export const FloatingAISectionPanel: React.FC<FloatingAISectionPanelProps> = ({
  isOpen,
  onClose,
  title,
  sectionKey,
  getSummary,
  aiSectionLoading,
  onGenerate,
}) => {
  const summary = getSummary(sectionKey);
  const loading = aiSectionLoading(sectionKey);
  const bullets = summary?.bullets ?? [];
  const narrative = summary?.narrative;

  const wins = bullets.filter((b) =>
    /strong|excell|top performer|highest|record|best|above avg|grow|increas|outperform|lead/i.test(b)
  );
  const watches = bullets.filter((b) =>
    /low|drop|declin|concern|risk|warn|below avg|weak|miss|fell|fell short|lag|struggl/i.test(b)
  );
  const recs = bullets.filter((b) =>
    /should|recommend|suggest|consider|action|opportunit|focus|priorit|target|leverage|invest/i.test(b)
  );
  const rest = bullets.filter(
    (b) => !wins.includes(b) && !watches.includes(b) && !recs.includes(b)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="ai-panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/25 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            key="ai-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 32, stiffness: 340, mass: 0.9 }}
            className="fixed right-0 top-0 bottom-0 z-[70] flex w-[430px] max-w-[92vw] flex-col overflow-hidden bg-white shadow-[0_0_80px_rgba(0,0,0,0.22)] border-l border-slate-200"
          >
            <div className="relative shrink-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-5 py-4 text-white">
              <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-violet-500 via-purple-400 to-indigo-500" />
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/25 ring-1 ring-violet-400/30">
                    <Sparkles className="h-4 w-4 text-violet-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 leading-none">
                      AI Section Insights
                    </p>
                    <h3 className="truncate text-[14px] font-bold text-white">{title}</h3>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    title="Refresh insights"
                    onClick={onGenerate}
                    disabled={loading}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white/80 transition-colors hover:bg-white/20 disabled:opacity-40"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white/80 transition-colors hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-5 py-20">
                  <div className="relative flex h-14 w-14 items-center justify-center">
                    <div className="absolute h-14 w-14 rounded-full border-[3px] border-violet-100 border-t-violet-500 animate-spin" />
                    <div
                      className="absolute h-10 w-10 rounded-full border-[2px] border-transparent border-b-purple-400 animate-spin"
                      style={{ animationDirection: 'reverse', animationDuration: '0.75s' }}
                    />
                    <Sparkles className="h-4 w-4 text-violet-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">Analyzing section data…</p>
                    <p className="mt-1 text-[12px] text-slate-400">Generating insights & recommendations</p>
                  </div>
                </div>
              ) : bullets.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-5 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-50 to-purple-100 ring-1 ring-violet-200">
                    <Sparkles className="h-6 w-6 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">No insights yet</p>
                    <p className="mt-1 text-[12px] text-slate-400 leading-relaxed max-w-[200px]">
                      Click below to analyze this section's data with AI
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={onGenerate}
                    className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate Insights
                  </Button>
                </div>
              ) : (
                <>
                  {narrative && (
                    <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50 p-4">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-500">
                        Summary
                      </p>
                      <p className="text-[13.5px] leading-relaxed text-slate-700">{narrative}</p>
                    </div>
                  )}

                  {wins.length > 0 && (
                    <section>
                      <div className="mb-2.5 flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                          Highlights
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        {wins.map((b, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5"
                          >
                            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                            <span className="text-[12.5px] leading-relaxed text-slate-700">{b}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {watches.length > 0 && (
                    <section>
                      <div className="mb-2.5 flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-600">
                          Watch Points
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        {watches.map((b, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-2.5"
                          >
                            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                            <span className="text-[12.5px] leading-relaxed text-slate-700">{b}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {recs.length > 0 && (
                    <section>
                      <div className="mb-2.5 flex items-center gap-2">
                        <Target className="h-3.5 w-3.5 text-blue-600" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
                          Recommendations
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        {recs.map((b, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-2.5"
                          >
                            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                            <span className="text-[12.5px] leading-relaxed text-slate-700">{b}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {rest.length > 0 && (
                    <section>
                      <div className="mb-2.5 flex items-center gap-2">
                        <Lightbulb className="h-3.5 w-3.5 text-slate-400" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                          Key Observations
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        {rest.map((b, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5"
                          >
                            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                            <span className="text-[12.5px] leading-relaxed text-slate-700">{b}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {summary && (
                    <p className="pt-2 text-center text-[10px] text-slate-400">
                      Generated{' '}
                      {new Date(summary.lastGenerated).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FloatingAISectionPanel;
