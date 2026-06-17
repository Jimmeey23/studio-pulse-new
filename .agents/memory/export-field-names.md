---
name: Export field-name fixes
description: CheckinData field name corrections for dataCrawler.ts to prevent zero-value exports
---

## Rule
`CheckinData` (from `useCheckinsData.ts`) does NOT have `classFormat`, `trainerName`, or `attendance` fields. Using them silently returns 0/undefined.

**Correct field names:**
- Class type: `cleanedClass` (not `classFormat`)
- Teacher: `teacherName` (not `trainerName`)
- Attendance: `checkedIn: boolean` — must count `c.checkedIn === true` rows per session; there is no pre-aggregated `attendance` number
- Session count: derive from `new Set(rows.map(c => c.sessionId)).size`

**Why:** dataCrawler.ts originally used wrong field names inherited from an older data shape, causing all attendance/class-format/trainer stats to export as zeros.

**How to apply:** Any time you add a new groupBy or reduce on checkinsData, use the correct field names above. For average attendance, group by sessionId first or use unique sessionId count as denominator.

## ExportFormat type
`ExportFormat = 'pdf' | 'csv' | 'txt' | 'json' | 'excel' | 'html'`
`exportToHTML` added to `src/services/exportService.ts` — generates a fully-styled standalone HTML report grouped by page, with tab/subTab badges per table.

## Empty table guard
`crawlAllData` now filters out tables with 0 rows and deduplicates by `id` before returning. This prevents blank sections in every export format.

## Default location
`DataExportTool.tsx` defaults to `['All Locations']` only (was all 5 locations + All = 5× duplicate tables).
