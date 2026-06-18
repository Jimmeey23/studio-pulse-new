---
name: StudioPulse duplicate key fix
description: Pre-existing duplicate React key bug in trainer scorecard table
---

The trainer scorecard thead had two columns with `label: 'Pay'` — one at position 4 and one near the end. Both used `key={label}` causing React duplicate key warning.

Fixed by: removing the first occurrence of `{ label: 'Pay', key: 'paid' }` (keeping the one near the end), and replacing with `{ label: 'Fill Rate', key: 'fillRate' }` in that slot.

Also: `renderMatrixTable` tbody rows changed from `key={row.label}` to `key={rowIdx-row.label}` to prevent future label-based collisions.
