---
name: StudioPulse export & skeleton loaders
description: How the export and skeleton loader system works in StudioPulse
---

## Skeleton loaders
`StudioPulseMetricCard` has an `isLoading?: boolean` prop. When true it renders a pulsing shimmer card (animate-pulse divs) instead of the live content. All 19 metric cards in StudioPulse.tsx pass the correct per-source loading flag: `salesLoading`, `sessionsLoading`, `expLoading`, `lcLoading`, `clientsLoading`, `leadsLoading`, or combinations like `salesLoading || sessionsLoading`.

**Why:** Data arrives from 9 independent sheets; each card should reflect only its own source's loading state.

## Export system
Two module-level helpers live in StudioPulse.tsx just after `csvSafeValue`:
- `camelToHeader(key)` — converts camelCase field names to readable column headers (e.g. `paymentDate` → `Payment Date`, handles IST/VAT/LTV/PCT/ID suffixes)
- `parseRegistryTable(content)` — parses tab-separated text from `MetricsTablesRegistry.getTextContent()` into `{ title, headers, rows }` by finding the first line with ≥2 tab-separated parts

`handleExportStudioPulse` (XLSX and PDF):
- XLSX: uses `aoa_to_sheet([headerRow, ...dataRows])` with `camelToHeader` headers — no longer `json_to_sheet` which used raw camelCase keys. After the 12 fixed sections, iterates `metricsRegistry.getAllTables()` and appends each registered pivot/ranking table as its own sheet.
- PDF: `autoTable` `head` uses `columns.map(camelToHeader)`. Also renders Trainer Rankings, Session Intelligence, and Funnel Rankings sections. Then iterates registry tables and appends each with a blue header row style.

`metricsRegistry` is obtained via `useMetricsTablesRegistry()` inside the component body (just after `anyLoading`), and added to `handleExportStudioPulse`'s `useCallback` dependency array.

**Why:** Raw camelCase headers were confusing in exported files; registry tables (pivot tables, MoM tables, etc.) were missing from exports entirely.
