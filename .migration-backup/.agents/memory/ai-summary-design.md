---
name: StudioPulse AI summary design
description: How AI summary generation is triggered and when it fires
---

Auto-generation useEffect (previously lines 3680-3702) is commented out. Summaries are ONLY generated:
1. When the user clicks the Sparkles (✦) button in the toolbar → `handleRefreshSummaries`
2. When the user opens the AI panel for a section → `openAIPanel()`

**Why:** User explicitly requested no auto-generation to avoid unnecessary API calls on every data load.

**How to apply:** Never re-enable the auto-generate useEffect without user consent. The `handleRefreshSummaries` and `openAIPanel` are the approved trigger paths.
