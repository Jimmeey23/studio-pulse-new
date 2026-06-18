# Studio Pulse Tab — Complete Build Reference

> Source of truth for rebuilding StudioPulse.tsx from scratch.  
> Last extracted: 2026-06-15

---

## 1. Data Sources & Key Fields

### Sales (`salesData`)
| Field | Description |
|---|---|
| `paymentDate` | Transaction date (YYYY-MM-DD) |
| `paymentValue` | Gross transaction amount |
| `paymentVAT` | VAT component |
| `discountAmount` | Discount value |
| `discountCode` | Applied promo code |
| `memberId` / `customerEmail` | Customer identifier |
| `cleanedProduct` | Normalised product name |
| `cleanedCategory` | Normalised category |
| `soldBy` | Seller name (`'Online/System'` / `'-'`) |
| `isPromotional` | Boolean promo flag |
| `paidInMoneyCredits` | Credit value used |
| `calculatedLocation` | Studio location |
| `secMembershipTotalClasses` | Total classes in package |
| `secMembershipClassesLeft` | Remaining classes |
| `secMembershipUsedSessions` | Sessions used so far |

### Sessions / Payroll (`payrollData`)
| Field | Description |
|---|---|
| `monthYear` | `"May 2026"` format |
| `teacherName` | Trainer name |
| `location` | Studio |
| `totalCustomers` | Attendance count |
| `totalSessions` | Sessions conducted |
| `totalNonEmptySessions` | Non-empty sessions |
| `totalEmptySessions` | Empty sessions |
| `totalPaid` | Compensation |
| `new` | New members taught |
| `converted` | Converted members |
| `retained` | Retained members |

### Check-ins (`checkinsData`)
| Field | Description |
|---|---|
| `dateIST` | Check-in date |
| `location` | Studio |
| `time` | Hour integer (7, 10, 17…) |
| `dayOfWeek` | `"Monday"` – `"Sunday"` |
| `checkedIn` | Boolean |
| `isLateCancelled` | Boolean |
| `sessionId` | Unique session ID |
| `capacity` | Session capacity |

### New Clients (`newClientsData`)
| Field | Description |
|---|---|
| `firstVisitDate` | Date of first class |
| `firstVisitLocation` | Studio of first visit |
| `firstVisitLocation` | Primary studio |
| `conversionStatus` | `'Converted'` / other |
| `retentionStatus` | `'Retained'` / `'Lapsed'` / other |
| `ltv` | Lifetime value |
| `conversionSpan` | Days to conversion |
| `memberId` / `email` | Client ID |

### Expirations / Lapsed (`expirationsData`)
| Field | Description |
|---|---|
| `endDate` | Membership expiration date |
| `primaryLocation` / `homeLocation` | Studio |
| `membershipName` | Membership type |
| `memberId` | Client ID |
| `amountPaid` / `paid` | Revenue from member |
| `sessionsUsedPct` | % of sessions used |
| `daysActive` | Days membership was active |
| `avgSessionsPerMonth` | Monthly session frequency |
| `discountCode` | Discount code if used |

### Leads (`leadsData`)
| Field | Description |
|---|---|
| `createdAt` | Lead creation date |
| `center` | Studio |
| `source` | Lead source |
| `stage` | Lead stage |
| `trialStatus` | `'Completed'` / `'Trial'` / `'Attended'` |
| `email` / `memberId` | ID |

### Late Cancellations (`lateCancellationsData`)
| Field | Description |
|---|---|
| `dateIST` / `sessionDateIST` | Date |
| `location` | Studio |
| `isSameDayCancellation` | Boolean |
| `chargedPenaltyAmount` | Penalty revenue |
| `teacherName` / `instructor` | Trainer |
| `capacity` | Session capacity |

---

## 2. All Metrics & Formulas

### Sales Metrics
| Metric | Formula |
|---|---|
| Net Sales | `Sum(paymentValue - paymentVAT)` |
| Gross Sales | `Sum(paymentValue)` |
| Transactions | `Count(rows)` |
| Unique Members | `new Set(memberId).size` |
| ATV | `Net Sales / Transactions` |
| Discount Value | `Sum(discountAmount)` |
| Discounted Transactions | `Count(rows where discountAmount > 0)` |
| Discount Penetration | `(Discounted Txns / Transactions) * 100` |
| VAT Collected | `Sum(paymentVAT)` |
| Money Credits Used | `Sum(paidInMoneyCredits)` |
| Package Sales | Net sales where `cleanedCategory` matches `/pack/i` |
| Retail Sales | Net sales from retail category |
| Membership Sales | Net sales from membership category |
| Drop-in Sales | Net sales from single/trial classes |
| Online / System Sales | Net sales where `soldBy` = `'Online/System'` or `'-'` |
| Top Seller Share | `(Top seller net sales / Total net sales) * 100` |
| Distinct Products Sold | `new Set(cleanedProduct).size` |
| Distinct Categories Sold | `new Set(cleanedCategory).size` |
| Avg Revenue per Member | `Net Sales / Unique Members` |
| Promo-led Sales | Net sales where `isPromotional === true` |
| Discount Efficiency | `Net revenue from discounted txns / Total discount amount` |
| Repeat Purchase Rate | `(Members with >1 txn / Total members) * 100` |
| Avg Order Value | `Gross Sales / Transactions` |
| Package Sell-through % | `(Sessions Used / Sessions Purchased) * 100` — uses `secMembershipUsedSessions` or `(total − classesLeft)` |

### Session / Attendance Metrics
| Metric | Formula |
|---|---|
| Visits | `Sum(checkedInCount)` |
| Sessions Conducted | `Count(sessions)` |
| Class Average | `Attendance / (Sessions − Empty Sessions)` |
| Fill Rate | `(Attendance / Capacity) * 100` |
| Empty Sessions | `Count(sessions where checkedInCount === 0)` |
| Empty Session Share | `(Empty Sessions / Total Sessions) * 100` |
| Rev / Visit | `Net Sales / Visits` |
| Late Cancel Rate | `(Late Cancels / (Visits + Late Cancels)) * 100` |

### Client / Funnel Metrics
| Metric | Formula |
|---|---|
| New Clients | `Count(isInNewClientCohort)` |
| Conversion Rate | `(Converted / New Clients) * 100` |
| Retention Rate | `(Retained / Converted) * 100` |
| Avg LTV | `Sum(ltv) / Cohort Length` |
| Avg Conversion Span | `Sum(conversionSpan) / Cohort Length` |
| Revenue / New Client | `Net Sales / New Clients` |

### Lapsed / Churn Metrics
| Metric | Formula |
|---|---|
| Churn Rate | `(Churned / Total Memberships Sold) * 100` |
| Early Exit Rate | `(Members with sessionsUsedPct < 50 && > 0) / Total Lapsed * 100` |
| Avg Sessions Used % | `Sum(sessionsUsedPct) / Count` |
| Avg Days Active | `Sum(daysActive) / Count` |
| Discount-Driven % | `Count(lapsed with discountCode) / Total Lapsed * 100` |
| Win-Back Rate | `Count(re-purchases ≥45 days post endDate) / Total Lapsed * 100` |

### Growth Calculations
```
MoM Growth = ((Current - Previous) / Previous) * 100
YoY Growth = ((Current - YearAgo) / YearAgo) * 100
Returns null if denominator is 0 and current > 0 (treat as 100% growth)
```

### Composite Scores
```
Session Intelligence Score:
  Attendance Score = min(classAvg * 5, 100)
  Fill Score       = min(fillRate, 100)
  Session Score    = min(sessions * 2, 100)
  Composite        = (40% × Attendance) + (35% × Fill) + (25% × Session)

Trainer Score:
  Avg Score   = min((classAvg / 30) * 100, 100)
  Composite   = (40% × Avg) + (30% × Fill) + (20% × ConvRate) + (10% × RetRate)
```

---

## 3. Section & Tab Structure

### Section I — Studio Overview
- 16 metric cards (Net Sales, Gross Sales, Transactions, Unique Members, ATV, Visits, Sessions, Class Avg, Fill Rate, Rev/Visit, Late Cancels, New Clients, Lapsed, Discount Efficiency, Package Sell-through, Repeat Purchase Rate)
- Each card has 12-month sparkline (front = date-filtered, back = all-time history)
- AI narrative summary with bullet insights

### Section II — Sales Metrics
**Tabs:** Main Table | Rankings | Discount Codes
- 20-row metric matrix, months as columns
- Top Products ranking list
- Top Discount Codes ranking list

### Section III — Leads & Conversion Funnel
**Tabs:** Overview | Funnel Matrix | Rankings | Breakdown Table
- Funnel: Leads → Trials → Converted
- Ranking dimensions: Source, Location, Stage, Membership, Class
- MoM table toggle

### Section IV — Client Lifecycle
**Tabs:** Overview | Retention Cohort | LTV Analysis
- New Clients, Conversion %, Retention %
- Cohort analysis via `isInNewClientCohort`

### Section V — Trainer Performance
**Tabs:** Overview | Scorecard | Format Comparison | MoM Matrix
- Top 6 trainers by revenue
- Sortable scorecard (sessions, customers, paid, classAvg, fillRate, utilization, conversionRate, lateCancels, revenueScore)
- Trainer × Format breakdown
- MoM metrics: Trainers Active, Sessions, Empty Sessions, Pay, Avg incl/excl empty

### Section VI — Sessions & Attendance
**Tabs:** Overview | Heatmap | Rankings | MoM Matrix
- Format comparison (PowerCycle, Barre, Strength)
- Day-of-week × Hour-of-day heatmap
- Session intelligence rankings
- MoM metrics: Sessions, Visits, Capacity, Fill Rate, Empty Sessions, Class Avg

### Section VII — Lapsed Members & Churn
**Tabs:** Overview | Churn Trend | Membership Breakdown | Win-Back Analysis | MoM Matrix
- Total lapsed, churn rate, avg LTV of lapsed
- Early exit rate, engagement metrics
- Win-back rate
- MoM matrix: Due Renewals, Lapsed, Churned, Churn Rate %

### Section VIII — Late Cancellations
- Total late cancels, same-day rate, penalty revenue
- Top locations/trainers by late cancels

---

## 4. Formatting Rules

### Currency
```typescript
new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
  notation: 'compact'
})
// Output: ₹12.5L, ₹2.3K
```

### Percentage
```typescript
value.toFixed(1) + '%'
// Output: 34.7%
```

### Numbers
```typescript
value.toLocaleString()           // 1,234,567
value.toFixed(1)                 // for class average
```

### Month Labels
```
Input:  "2026-05"
Output: "May '26"
```

### Matrix Cell Types
```typescript
if (type === 'currency') → formatCurrency(value)
if (type === 'percent')  → formatPercentage(value)
default                  → formatNumber(value)
```

---

## 5. Color Coding & Thresholds

### Growth Indicators (MoM / YoY)
| Condition | Color |
|---|---|
| Growth > 0 | `text-emerald-600` / `bg-emerald-50` |
| Growth < 0 | `text-red-500` / `bg-red-50` |
| Growth ≈ 0 or null | `text-slate-500` / `bg-slate-50` |

### Trend Classification
```typescript
if (trendPct > 5)   → 'growing'   → text-emerald-600
if (trendPct < -5)  → 'declining' → text-red-500
else                → 'stable'    → text-slate-500
```

### Format Colors
| Format | Tailwind | Hex |
|---|---|---|
| Barre | `from-purple-600 via-violet-600 to-violet-700` | #1d4ed8 area |
| PowerCycle | `from-blue-600 via-indigo-600 to-indigo-700` | #06b6d4 area |
| Strength | `from-rose-500 via-pink-600 to-pink-700` | #f59e0b area |
| Other | `slate-400` | — |

### Alert Thresholds
| Metric | Threshold | Severity |
|---|---|---|
| Fill Rate | < 50% | Warning |
| Early Exit Rate | > 50% | Alert |
| Churn Rate | > 20% | Critical |
| Late Cancel Rate | > 10% | Monitor |

### Heatmap
- Color intensity = fill rate %
- Low → Red/Orange → Yellow → Green → Dark green

---

## 6. Chart Types

| Chart | Used For |
|---|---|
| Area Chart | Revenue/attendance trends, 12-month sparklines |
| Bar Chart | Format comparison, trainer breakdown |
| Pie Chart | Product/category mix |
| Funnel Chart | Lead → Trial → Converted pipeline |
| Heatmap | Day-of-week × Hour-of-day attendance |
| Table/Matrix | Sales metrics MoM, session MoM |
| Sparkline | Metric card trend (12-month rolling) |
| Ranking List | Top/bottom performers with trophy/TrendingDown icons |

---

## 7. Filters

### Studio Filter
```
Options: All Studios | Kwality House | Supreme HQ | Kenkere House | Pop-up
Logic:   studio === 'all' includes all locations
         otherwise: inStudio(location, studioId)
```

### Date Range
```
Format: YYYY-MM-DD start + end
Logic:  isWithinRange(dateValue, dateRange)
Generates 3 ranges: Current | Previous Month | Previous Year
Default: last 30 days
```

### Session-Specific Filters
| Filter | Options |
|---|---|
| Status | All \| Active \| Inactive (2-month activity threshold) |
| Exclude Hosted | Filters tokens: `host`, `hosted`, `p57`, `birthday`, `rugby`, `lrs` |
| Grouping | 18 options incl. ClassDayTimeLocation, ClassTrainer, DayTime |
| Min Checkins | Minimum attendance per session |
| Min Classes | Minimum session count |
| Ranking Metric | ClassAvg \| FillRate \| Visits \| Revenue \| CancellationRate \| RevPerCheckin \| CompositeScore |
| View Mode | Grouped \| Flat |

### Funnel Filters
| Filter | Options |
|---|---|
| Ranking Dimension | Source \| Location \| Stage \| Membership \| Class |
| Chart Metric | Leads \| Converted \| Retained \| LTV |
| Top/Bottom Count | 5, 10, 15, 20 |

### Trainer Filters
| Filter | Options |
|---|---|
| Sort Key | Sessions \| Customers \| Paid \| ClassAvg \| FillRate \| Utilization \| ConversionRate \| LateCancels \| RevenueScore |
| Sort Direction | Desc (default) \| Asc |

### Lapsed Filters
| Filter | Options |
|---|---|
| Churn Metric | Count \| LTV/Penalty |
| Rank Dimension | Membership \| Location |
| Table Tab | Breakdown \| Renewal \| Churned \| HighValue |

---

## 8. URL Persistence

All UI state synced to URL params:

| Param | Example | Description |
|---|---|---|
| `studio` | `kwality` | Selected studio |
| `from` | `2026-05-01` | Date range start |
| `to` | `2026-05-31` | Date range end |
| `frd` | `source` | Funnel ranking dimension |
| `srm` | `classAvg` | Session ranking metric |
| `fct` | `trainer` | Format comparison active tab |
| `showMomTable` | `1` | MoM table toggle |
| `ssd` | `asc` | Scorecard sort direction |
| `sessionGrouping` | `ClassDayTime` | Session grouping mode |

---

## 9. Business Logic Definitions

### "Active" Member
> Members with classes in last 2 calendar months (`activeThresholdDate`)

### "Lapsed" Member
> Members in Expirations sheet with `endDate` in selected period. Treated as churned.

### "New Client" Cohort
> `isInNewClientCohort(client)` — `firstVisitDate` within date range + status flags

### "Converted"
> `conversionStatus === 'Converted'` — trial completed + first sale post-trial

### "Retained"
> `retentionStatus === 'Retained'` — 2+ purchases post-conversion or active ≥N days

### "Early Exit"
> `sessionsUsedPct < 50 && sessionsUsedPct > 0` — premature abandonment

### "Win-Back"
> Any purchase `≥ 45 days` after membership `endDate`  
> `purchases.some(t => t >= lapseMs + 45 * 86400000)`

### "Discount Efficiency"
> `Net Revenue from Discounted Txns / Total Discount Amount`  
> Value > ₹1 = driving incremental revenue. Value < ₹1 = giving away revenue.

### Format Classification
```
Cycle / Spin / Ride          → PowerCycle
Strength / Sculpt / HIIT     → Strength
All others (Barre, Mat, etc) → Barre
```

### Class Name Normalisation
```
Remove: "(online)", "(virtual)", "(zoom)", "(fb live)"
Remove: parenthetical notes
Remove: trailing "#123" session numbers
Apply:  titlecase
Replace: "physique 57" → "Physique57"
```

### Seller Classification
```
soldBy in ['Online/System', '-', ''] → Online/System sales
otherwise                            → Human seller
```

### Package Sell-through
```
Filter: cleanedProduct matches /pack|package/i
Sessions Used    = secMembershipUsedSessions ?? (total − classesLeft)
Sell-through %   = (Sessions Used / Sessions Purchased) * 100
```

---

## 10. Session Intelligence Rankings — Grouping Dimensions (18 options)

1. None (flat list)
2. ClassDayTimeLocation
3. ClassTrainer
4. DayTime
5. Class
6. Trainer
7. Day
8. Time
9. Location
10. ClassDay
11. ClassTime
12. ClassLocation
13. TrainerDay
14. TrainerTime
15. TrainerLocation
16. DayTimeLocation
17. ClassDayTime
18. ClassDayTimeTrainer

---

## 11. Metric Card Structure

Each of the 16 overview metric cards contains:
- **Front face**: Current period value (large) + formatted label
- **Growth badge**: MoM delta with green/red/gray indicator
- **Sparkline**: 12-month rolling area chart, date-filtered
- **Back face** (on flip): All-time studio history sparkline
- **Subtitle**: Context string (e.g. "vs ₹X last month")

---

## 12. MoM Matrix Pattern

Used in Sections II, V, VI, VII. Common pattern:
- Rows = metric names
- Columns = calendar months (last 12–18 months)
- Cell = formatted value
- Growth column = latest MoM % change
- Color coding = green/red based on direction
- Sticky first column (metric name)
- Horizontal scroll for many months
