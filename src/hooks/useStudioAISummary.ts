import { useState, useCallback, useRef } from 'react';

export interface StudioSummaryInput {
  studioName: string;
  dateRange: { start: string; end: string };
  metrics: {
    netSales: string;
    grossSales: string;
    transactions: number;
    uniqueMembers: number;
    totalSessions: number;
    attendance: number;
    avgFill: string;
    lateCancels: number;
    lapsed: number;
    churned: number;
    newClients: number;
    converted: number;
    retained: number;
    conversionRate: string;
    retentionRate: string;
    momNetSales: number | null;
    yoyNetSales: number | null;
  };
  /** Extra context for section-specific summaries */
  sectionContext?: string;
  /** Section label used to cache independently */
  sectionKey?: string;
}

export interface StudioSummaryResult {
  narrative?: string;
  bullets: string[];
  lastGenerated: string;
}

const DEEPSEEK_BASE = 'https://api.deepseek.com';

const buildPrompt = (input: StudioSummaryInput): string => {
  const m = input.metrics;
  const mom = (v: number | null) => v !== null ? `${v > 0 ? '+' : ''}${v.toFixed(1)}% MoM` : 'MoM N/A';
  const yoy = (v: number | null) => v !== null ? `${v > 0 ? '+' : ''}${v.toFixed(1)}% YoY` : 'YoY N/A';

  // Section-specific focused data block — each section gets ONLY the metrics that matter for it
  const sectionBlocks: Record<string, string> = {
    main: `Studio overview — ${input.studioName} · ${input.dateRange.start} to ${input.dateRange.end}
Revenue: net ${m.netSales} gross ${m.grossSales} (${mom(m.momNetSales)}, ${yoy(m.yoyNetSales)})
Sales: ${m.transactions} transactions · ${m.uniqueMembers} unique members
Sessions: ${m.totalSessions} sessions · ${m.attendance} visits · ${m.avgFill} avg fill
Pipeline: ${m.newClients} new clients → ${m.converted} converted (${m.conversionRate}) → ${m.retained} retained (${m.retentionRate})
Attrition: ${m.lapsed} lapsed · ${m.churned} churned · ${m.lateCancels} late cancellations
${input.sectionContext || ''}`,

    sales: `Sales deep-dive — ${input.studioName} · ${input.dateRange.start} to ${input.dateRange.end}
Net sales: ${m.netSales} (${mom(m.momNetSales)}, ${yoy(m.yoyNetSales)})
Gross sales: ${m.grossSales} · Transactions: ${m.transactions} · Unique buyers: ${m.uniqueMembers}
${input.sectionContext || ''}
Benchmark context: healthy fitness studio ATV ≥ ₹2,500 · discount penetration < 25% · top-seller share < 40%`,

    funnel: `New member funnel — ${input.studioName} · ${input.dateRange.start} to ${input.dateRange.end}
${input.sectionContext || ''}
Overall studio context: net sales ${m.netSales} · ${m.totalSessions} sessions · ${m.attendance} visits
Benchmark: industry conversion 30–50% · retention 40–60% · LTV > ₹15,000 for barre studios`,

    trainers: `Trainer scorecard — ${input.studioName} · ${input.dateRange.start} to ${input.dateRange.end}
${input.sectionContext || ''}
Overall session context: ${m.totalSessions} sessions · ${m.attendance} visits · ${m.avgFill} avg fill · ${m.lateCancels} late cancellations
Revenue context: ${m.netSales} net sales across ${m.transactions} transactions
Benchmark: healthy trainer fill > 60% · avg class > 8 · conversion contribution > 10 new clients/month`,

    lapsed: `Churn & lapse analysis — ${input.studioName} · ${input.dateRange.start} to ${input.dateRange.end}
${input.sectionContext || ''}
Revenue context: ${m.netSales} net sales · ${m.uniqueMembers} active buyers
New pipeline: ${m.newClients} new clients · ${m.conversionRate} conv · ${m.retentionRate} ret
Benchmark: monthly churn < 5% of active members · late cancel rate < 10% of bookings`,

    attendance: `Class attendance & session intelligence — ${input.studioName} · ${input.dateRange.start} to ${input.dateRange.end}
${input.sectionContext || ''}
Revenue context: ${m.netSales} net sales tied to ${m.attendance} visits (rev/visit = ${m.netSales})
Benchmark: industry fill rate > 65% · empty class rate < 15% · avg class size > 8 for barre`,
  };

  const sectionKey = input.sectionKey || 'main';
  const dataBlock = sectionBlocks[sectionKey] || sectionBlocks['main'];

  const isMain = sectionKey === 'main';

  if (isMain) {
    return `You are a senior fitness business analyst for Physique 57, a premium barre fitness chain in India.

DATA:
${dataBlock}

Respond with a JSON object with TWO keys:
1. "narrative": ONE paragraph (3–5 sentences, ~80–120 words) summarising the studio's overall performance across revenue, sessions, pipeline, and attrition. Write like a business analyst briefing a studio owner — concrete numbers, directional language, cross-section connections (e.g. how fill rate relates to revenue, how churn offsets new client gains). No generic phrases.
2. "bullets": array of exactly 5 short analyst bullets — each a DIFFERENT dimension (revenue trend, session health, pipeline efficiency, churn pressure, one actionable opportunity). Every bullet must quote at least one specific number from the data.

STRICT RULES:
- All numbers must come from the data above (no invention)
- No filler ("it is worth noting", "overall", "in summary")
- Do NOT repeat the narrative in bullets — bullets must add new angles
- ONLY valid JSON: {"narrative": "...", "bullets": ["...", ...]}`;
  }

  return `You are a senior fitness business analyst for Physique 57, a premium barre fitness chain in India.

DATA:
${dataBlock}

Generate exactly 5 insightful bullet points about the DATA ABOVE as a JSON object: {"bullets": ["...", "...", ...]}

STRICT RULES — violating any rule = failure:
1. Every bullet MUST quote at least one specific number or % directly from the data (not invented)
2. Each bullet covers a DIFFERENT insight — no repetition across bullets
3. Reveal non-obvious patterns: compare metrics against each other or against the benchmarks above
4. Flag the 2 biggest risks AND the 1 biggest opportunity visible in the numbers
5. Language: crisp, analyst-grade, no filler phrases ("it is worth noting", "overall", "in summary")
6. Do NOT restate obvious totals — interpret what the numbers mean for the business
7. No preamble, no markdown, ONLY valid JSON`;
};

/** Try GPT-5, fall back to deepseek-chat */
const callAI = async (prompt: string): Promise<{ bullets: string[]; narrative?: string }> => {
  const hasOpenAI = import.meta.env.VITE_OPENAI_API_KEY && import.meta.env.VITE_OPENAI_API_KEY !== 'your_openai_api_key';
  const hasDeepSeek = import.meta.env.VITE_DEEPSEEK_API_KEY && import.meta.env.VITE_DEEPSEEK_API_KEY !== 'your_deepseek_api_key';

  const parseResult = (content: string): { bullets: string[]; narrative?: string } => {
    try {
      const parsed = JSON.parse(content);
      const bullets: string[] = Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 6)
        : Array.isArray(parsed) ? parsed.slice(0, 6)
        : (Object.values(parsed).flat() as string[]).filter((v) => typeof v === 'string').slice(0, 6);
      const narrative: string | undefined = typeof parsed.narrative === 'string' ? parsed.narrative : undefined;
      return { bullets, narrative };
    } catch {
      const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) return parseResult(match[1].trim());
      const arrMatch = content.match(/\[[\s\S]*\]/);
      if (arrMatch) {
        try { return { bullets: JSON.parse(arrMatch[0]).slice(0, 6) }; } catch { /* ignore */ }
      }
      return { bullets: [] };
    }
  };

  // Attempt GPT-4o via server proxy
  if (hasOpenAI) {
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 900,
          response_format: { type: 'json_object' },
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '{}';
        const result = parseResult(content);
        if (result.bullets.length >= 3) return result;
      }
    } catch {
      // fall through to deepseek
    }
  }

  // DeepSeek fallback
  if (hasDeepSeek) {
    try {
      const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 900,
          response_format: { type: 'json_object' },
        }),
      });
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      const result = parseResult(content);
      if (result.bullets.length >= 3) return result;
    } catch {
      // fall through to empty
    }
  }

  return { bullets: [] };
};

export const useStudioAISummary = () => {
  // Map of sectionKey → result — summaries persist until explicit refresh
  const [summaryMap, setSummaryMap] = useState<Record<string, StudioSummaryResult>>(() => {
    try {
      const raw = localStorage.getItem('studio-pulse-ai-summary-cache-v1');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});
  // Track what key was last generated to skip duplicates
  const generatedRef = useRef<Record<string, string>>({});

  const persistSummaryMap = useCallback((nextMap: Record<string, StudioSummaryResult>) => {
    setSummaryMap(nextMap);
    try {
      localStorage.setItem('studio-pulse-ai-summary-cache-v1', JSON.stringify(nextMap));
    } catch {
      // ignore storage errors
    }
  }, []);

  /** Generate (or skip if cached and not forced) */
  const generate = useCallback(async (input: StudioSummaryInput, force = false) => {
    const sectionKey = input.sectionKey || 'main';
    const testModeFlag = new URLSearchParams(window.location.search).get('testmode');
    const testMode = import.meta.env.VITE_TESTMODE === 'true' && testModeFlag !== 'false';

    // Stable cache key — changes when studio/date/metrics change
    const cacheKey = JSON.stringify({
      studio: input.studioName,
      start: input.dateRange.start,
      end: input.dateRange.end,
      section: sectionKey,
      sales: input.metrics.netSales,
      sessions: input.metrics.totalSessions,
    });

    // Skip if same data already generated and not forced
    if (!force && generatedRef.current[sectionKey] === cacheKey && summaryMap[sectionKey]) return;

    generatedRef.current[sectionKey] = cacheKey;

    const noKeys = !import.meta.env.VITE_OPENAI_API_KEY && !import.meta.env.VITE_DEEPSEEK_API_KEY;
    if (noKeys || testMode) {
      if (!summaryMap[sectionKey]) {
        const cached = (() => {
          try {
            const raw = localStorage.getItem('studio-pulse-ai-summary-cache-v1');
            if (!raw) return null;
            const parsed = JSON.parse(raw) as Record<string, StudioSummaryResult>;
            return parsed[sectionKey] || null;
          } catch {
            return null;
          }
        })();
        if (cached) {
          persistSummaryMap({ ...summaryMap, [sectionKey]: cached });
        }
      }
      return;
    }

    setLoadingKeys((prev) => new Set([...prev, sectionKey]));
    setErrorMap((prev) => { const n = { ...prev }; delete n[sectionKey]; return n; });

    try {
      const prompt = buildPrompt(input);
      const result = await callAI(prompt);
      if (result.bullets.length > 0) {
        persistSummaryMap({ ...summaryMap, [sectionKey]: { bullets: result.bullets, narrative: result.narrative, lastGenerated: new Date().toISOString() } });
      }
    } catch (e: any) {
      setErrorMap((prev) => ({ ...prev, [sectionKey]: e.message || 'AI summary failed' }));
    } finally {
      setLoadingKeys((prev) => { const n = new Set(prev); n.delete(sectionKey); return n; });
    }
  }, [persistSummaryMap, summaryMap]);

  /** Force refresh all cached summaries */
  const refreshAll = useCallback(async (inputs: StudioSummaryInput[]) => {
    generatedRef.current = {};
    for (const input of inputs) {
      await generate(input, true);
    }
  }, [generate]);

  const getSummary = (sectionKey = 'main') => summaryMap[sectionKey] ?? null;
  const isLoading = (sectionKey = 'main') => loadingKeys.has(sectionKey);
  const getError = (sectionKey = 'main') => errorMap[sectionKey] ?? null;

  // Legacy single-summary compat
  const summary = summaryMap['main'] ?? null;
  const loading = loadingKeys.has('main');
  const error = errorMap['main'] ?? null;

  return { summary, loading, error, generate, getSummary, isLoading, getError, refreshAll };
};
