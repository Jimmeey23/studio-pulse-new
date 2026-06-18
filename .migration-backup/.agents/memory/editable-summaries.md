---
name: StudioPulse editable summaries
description: Per-section manual override system for AI summary boxes
---

Each `renderAISummary(sectionKey, ...)` call now supports inline editing:
- Manual overrides stored in localStorage at key `sp_section_edits_v1` as `Record<string, string>`
- State: `sectionEdits`, `editingSectionKey`, `editDraft`
- Helpers: `saveSectionEdit(key, text)`, `clearSectionEdit(key)`
- Manual edits take priority over AI bullets; displayed with violet border + "Manual summary · edited" label
- Pencil icon (top-right of every summary box) opens inline textarea editor
- Restore button (red RotateCcw icon) clears manual override and reverts to AI bullets

**Why:** User wanted summaries that persist user edits until AI is explicitly re-run.

**How to apply:** When AI regenerates a section (`generateAISummary`), the manual override is NOT auto-cleared — user must click restore explicitly.
