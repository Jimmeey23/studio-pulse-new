---
name: Studio Pulse date parsing bug
description: Root cause and fixes for future months appearing in sales/session/funnel matrix tables.
---

## Root cause
`parseDate` in `dateUtils.ts` assumed all slash-format dates are DD/MM/YYYY.
When Google Sheets returns MM/DD/YYYY (e.g. "08/25/2025"), `parts[1]=25` (treated as month).
`new Date(2025, 24, 8)` — JavaScript wraps 24 months → January 2027 — a future month.

## Fix applied
In both `dateUtils.ts` and `useLeadsData.ts` local `parseDate`:
- If `month > 12 && day <= 12` → format is MM/DD/YYYY → swap day and month.
- Added validation: `month >= 1 && month <= 12` guard before constructing Date.

## Second layer: future-month cap
All 5 matrix computations that build month column lists from data now filter:
```
.filter(k => k <= currentMonthKey)
```
Applied to: `salesMetricsMatrix`, `funnelMatrix`, `trainerMatrix`, `classMatrix`, `lapsedMatrix`, and sessions trend.

**Why:** Even after fixing parse, bad data in Google Sheets (future-dated entries) would still pollute tables. The cap ensures no future month ever appears regardless of data quality.

## Also fixed
`useLeadsData.ts` local `parseDate` for YYYY-MM-DD was using `new Date(dateString)` (UTC parsing),
causing 1-day date shift in IST (+5:30). Fixed to parse as local midnight: `new Date(year, month-1, day)`.
