# Claude Prompt — Physique 57 Executive Performance Report

> Paste this entire prompt into Claude (claude.ai or API).  
> Attach all 7 CSV files when prompted.  
> Replace [REPORT MONTH] and [REPORT YEAR] before sending.

---

## THE PROMPT

---

You are a senior business analyst for Physique 57, a premium boutique fitness studio brand operating across Mumbai (Kwality House – Kemps Corner, Supreme HQ – Bandra) and Bengaluru (Kenkere House, Pop-up Studio). Your job is to produce a complete, executive-grade monthly performance report.

**Report period:** [REPORT MONTH] [REPORT YEAR] (e.g. May 2026)  
**Previous month for MoM comparison:** [PREVIOUS MONTH] [REPORT YEAR]  
**Year-over-year comparison:** [REPORT MONTH] [REPORT YEAR - 1] (e.g. May 2025)  
**Year-to-date:** January [REPORT YEAR] through [REPORT MONTH] [REPORT YEAR]

I am attaching 7 CSV data files:
1. **Sales CSV** — all payment transactions (`Payment Date`, `Payment Value`, `Payment VAT`, `Discount Amount`, `Discount Code`, `Member ID`, `Customer Email`, `Cleaned Product`, `Cleaned Category`, `Sold By`, `Calculated Location`, `Membership Type`, `Purchase Tag`, `Payment Source`, `Mrp - Pre Tax`, `Sec. Membership Total Classes`, `Sec. Membership Classes Left`, `Sec. Membership Used Session Credits`, `Sec. Membership Is Freezed`)
2. **Sessions CSV** — per-session data (`Date`, `Location`, `Trainer`, `SessionName`, `Class`, `Type`, `CheckedIn`, `Capacity`, `Booked`, `LateCancelled`, `Complimentary`, `NonPaid`, `Revenue`, `Memberships`, `Packages`, `IntroOffers`, `SingleClasses`, `Day`, `Time`)
3. **Payroll CSV** — trainer monthly summary (`Teacher Name`, `Location`, `Month Year`, `Total Sessions`, `Total Empty Sessions`, `Total Non-Empty Sessions`, `Total Customers`, `Total Paid`, `Cycle/Strength/Barre Sessions+Customers+Paid`, `Converted`, `Conversion Rate`, `Retained`, `Retention Rate`, `New`)
4. **New Clients CSV** — member acquisition funnel (`Member ID`, `Email`, `First Visit Date`, `First Visit Location`, `First Visit Entity Name`, `Trainer Name`, `Home Location`, `Conversion Status`, `Retention Status`, `LTV`, `Conversion Span (Days)`, `Visits Post Trial`, `Memberships Bought Post Trial`, `First Purchase Post Trial`, `Source`, `Month Year`)
5. **Lapsed/Expirations CSV** — churned memberships (`Member ID`, `Status`, `Membership Name`, `End Date`, `Amount Paid`, `Discount Code`, `Sessions Used %`, `Days Active`, `Days Since Last Visit`, `Average Sessions Per Month`, `Revenue Per Session`, `No Shows`, `Total Cancellations`, `Late Cancellations`, `Cancellation Rate %`, `Membership Freeze Count`, `Days Frozen`, `Attendance Rate %`, `Primary Location`, `Locations Attended`, `Most Recent Visit Date`, `Preferred Booking Method`)
6. **Leads CSV** — CRM pipeline (`ID`, `Full Name`, `Created At`, `Source Name`, `Associate`, `Stage Name`, `Center`, `Class Type`, `Trial Status`, `Conversion Status`, `Retention Status`, `LTV`, `Visits`, `Follow Up 1 Date`, `Follow Up 2 Date`, `Follow Up 3 Date`, `Follow Up 4 Date`)
7. **Payroll/Day-End CSV** — same as #3, used for session-level payroll reconciliation

---

## WHAT TO PRODUCE

Generate a complete HTML report I can open in a browser. The report must:

- Be fully self-contained (all CSS, JS, and chart code inline — no external dependencies except Google Fonts)
- Use a clean, premium design: dark navy/charcoal header, white content cards, Physique 57 brand feel
- Use Chart.js (load from CDN: `https://cdn.jsdelivr.net/npm/chart.js`) for all charts
- Be printable / PDF-exportable (include a print stylesheet)
- Include a navigation sidebar or tab bar for each section

---

## REPORT STRUCTURE

### 0. COVER / HEADER
- Physique 57 logo text (stylised)
- Report title: "Studio Performance Report — [MONTH YEAR]"
- Prepared date, period covered, studios included
- One-paragraph executive summary (3–5 sentences): what happened this month overall, the single most important positive, the single most important risk, and one recommended action

---

### 1. NETWORK SNAPSHOT (All Studios Combined)

**4 large KPI cards — current month vs. prior month vs. same month last year:**

| Metric | Formula | Format |
|---|---|---|
| Net Sales | SUM(Payment Value − Payment VAT) | ₹ compact (₹42.3L) |
| Total Visits | SUM(CheckedIn) | Integer |
| Fill Rate | SUM(CheckedIn) / SUM(Capacity) × 100 | XX.X% |
| New Members | COUNT(First Visit Date in month) | Integer |

**Below each card:** MoM change badge (green/red arrow + %) and YoY change badge.

**Then a 6-metric trend chart (line, 13 months):**  
Net Sales, Visits, Fill Rate, New Members, Conversion Rate, Churn Rate  
Toggle buttons to show/hide each line.

**Written insight block (2–3 sentences):** Describe the network-level story. Is the business growing, stable, or declining? What is the dominant driver?

---

### 2. STUDIO BREAKDOWN

**For each studio (Kwality House, Supreme HQ, Kenkere House, Pop-up):**

A studio card containing:
- Studio name, city
- 6 metrics: Net Sales, Visits, Fill Rate, Class Avg, New Members, Churn Rate — each with MoM and YoY delta
- A small horizontal bar chart comparing this studio's fill rate and class average vs. the network average
- One written sentence: the most notable thing about this studio this month

**Then a side-by-side bar chart:** Net Sales by studio, current month vs. prior month vs. same month last year (grouped bars).

**Written insight block:** Which studio is leading, which is lagging, and why it matters. Call out any studio showing divergent trends from the network.

---

### 3. SALES DEEP DIVE

**Section heading:** Revenue Quality Analysis

**3a. Revenue Composition — Donut chart:**
Memberships / Packages / Intro Offers / Single Classes / Retail  
(calculated from `Cleaned Category`)  
Label each segment with ₹ value and % share.

**3b. Purchase Tag Mix — Stacked bar (monthly, last 6 months):**
New / Renewed / Returning — from `Purchase Tag` column in Sales CSV.  
Written insight: Is new member revenue growing as a share, or is the business living on renewals?

**3c. Top 10 Products table:**
| Product | Transactions | Net Revenue | Avg Price | % of Total |

**3d. Discount Analysis:**
- Discount Penetration: % of transactions with a discount
- Discount Efficiency: Net revenue from discounted txns / Total discount given (show as ₹X.XX per ₹1)
- Top 5 Discount Codes table: Code | Uses | Total Discount Given | Avg Discount | Revenue from those txns
- Written insight: Is discounting driving incremental revenue or eroding margin? Name the highest-risk discount code.

**3e. ATV Trend — Line chart (13 months):** Average Transaction Value per studio.  
Written insight: Which studio has the highest ATV and what product mix explains it?

**3f. Seller Performance table (top 10 by revenue):**
| Seller | Transactions | Net Revenue | Avg ATV | Discount Penetration |
Highlight online/system sales as a separate row.

---

### 4. CLASS & ATTENDANCE PERFORMANCE

**Section heading:** Studio Floor Performance

**4a. Format Comparison — Grouped bar chart (3 formats: Barre, PowerCycle, Strength):**
For each format: Sessions, Visits, Fill Rate, Class Average, Revenue — shown as grouped bars.

Format classification rules:
- Cycle / Spin / Ride → PowerCycle
- Strength / Sculpt / HIIT / Fit → Strength  
- All others (Barre, Mat, Express, Yoga, Workshops, etc.) → Barre

**4b. Day-of-Week Heatmap (attendance):**
Rows = Days (Monday–Sunday), Columns = Time slots (6am–9pm hourly).  
Cell value = average CheckedIn. Color intensity = fill rate %.  
Written insight: Identify peak and dead slots. Which day/time combination is chronically underperforming?

**4c. Session Intelligence Rankings table (top 20 by composite score):**
Score = (ClassAvg/30 × 40%) + (FillRate × 35%) + (min(Sessions×2,100) × 25%)

| Rank | Class | Trainer | Day | Time | Sessions | Class Avg | Fill Rate | Score |

**4d. Empty Session Analysis:**
- Empty session count and % by studio
- Empty session % by format
- Empty session % by day of week
- Written insight: Where is the most dead capacity? Is it structural (wrong time slot) or random?

**4e. Booking vs. Attendance Gap:**
Derived: `Booked − CheckedIn − LateCancelled` = No-shows  
Show: Late Cancel Rate, No-Show Rate, Booking-to-Attendance Rate  
Written insight: Are members booking but not showing? Rising no-show rate is a disengagement signal.

---

### 5. TRAINER PERFORMANCE

**Section heading:** Instructor Impact

**5a. Trainer Scorecard table (all active trainers, sortable):**

| Trainer | Studio | Sessions | Class Avg | Fill Rate | Utilisation % | New Members Taught | Conversion Rate | Retention Rate | Total Revenue | Score |

Score = (ClassAvg/30 × 40%) + (FillRate × 35%) + (ConvRate × 20%) + (RetRate × 10%) — capped 0–100.

Flag trainers with fewer than 8 sessions as "limited data."

**5b. Trainer Revenue & Payroll table:**
| Trainer | Revenue Generated | Payroll Cost | Payroll % of Revenue |
Flag any trainer where payroll > 50% of generated revenue as a yellow warning.

**5c. Trainer × Format breakdown table:**
For each trainer: Barre sessions/avg/fill, Cycle sessions/avg/fill, Strength sessions/avg/fill.

**5d. Written insight block (3–4 sentences):**
Name the top performer and why. Name any trainer showing a significant decline vs. prior month. Call out if any trainer's conversion rate is notably above/below average — scheduling implication.

---

### 6. NEW MEMBER FUNNEL

**Section heading:** Member Acquisition & Conversion

**6a. Funnel visual (3 stages with drop-off %):**
```
Leads Created → [drop-off %] → Trials Attended → [drop-off %] → Converted
```
Show absolute numbers + conversion rates for current month, prior month, YoY.

**6b. Conversion by Lead Source table:**
| Source | Leads | Trials | Converted | Conversion Rate | Avg LTV of Converted |
Sort by conversion rate descending. Highlight top 3 sources.

**6c. First-Class-to-Conversion analysis:**
- Avg conversion span (days from first visit to first purchase)
- Distribution: <7 days / 7–30 days / 30–90 days / 90+ days (bar chart)
- Written insight: Are conversions getting faster or slower YoY? Faster = better onboarding or urgency.

**6d. Trainer at First Visit → Conversion table:**
| Trainer | New Members Introduced | Conversion Rate | Avg LTV |
Written insight: Which trainer should be prioritised for trial-class slots based on conversion data?

**6e. First Purchase Product mix (bar chart):**
What do converted members buy first? 4-class pack vs. 8-class vs. unlimited vs. intro offer.  
Written insight: If most members start on cheap intro offers, is there an upsell gap?

**6f. Associate Performance (from Leads CSV):**
| Associate | Leads Assigned | Trials Scheduled | Converted | Conversion Rate | Avg Follow-up Days |
Written insight: Who on the sales team is performing and who needs coaching?

---

### 7. MEMBER RETENTION & CHURN

**Section heading:** Retention Health

**7a. Churn Rate trend — Line chart (13 months):**
Churn Rate = Lapsed / Total expiring × 100, per studio.  
Written insight: Is churn improving or worsening? Is it seasonal or structural?

**7b. Lapsed Member Profile (current month):**
Cards showing:
- Total Lapsed | Avg Days Active | Avg Sessions Used % | Early Exit Rate (used <50%)
- Discount-Driven % (had discount code) | Avg Days Since Last Visit at Lapse | Avg No-Show Rate

**7c. Churn by Membership Type table:**
| Membership | Lapsed Count | % of Total Lapsed | Avg Sessions Used % | Avg Days Active | Avg Revenue |
Written insight: Which membership type churns most and why might that be (price point, commitment level, format fit)?

**7d. Zombie Member Flags:**
Members with `Days Since Last Visit > 45` AND membership still active (still in sessions data but not attending).  
Show: Count of at-risk members by studio.  
Written insight: How many active members haven't shown up in 45+ days? These are churn-risk — they should be contacted now.

**7e. Win-Back Rate:**
Members who purchased again ≥45 days after their `End Date`.  
Show: Win-back count, win-back rate %, avg revenue from win-back purchases.

**7f. Engagement Depth of Lapsed Members (horizontal bar chart):**
Bucket lapsed members by sessions used %:  
0% / 1–25% / 26–50% / 51–75% / 76–100%  
Written insight: The shape of this chart tells you whether churn is driven by buyers remorse (0–25%) or end-of-membership natural expiry (76–100%).

---

### 8. YTD SUMMARY

**Section heading:** Year to Date ([REPORT YEAR])

**8a. YTD KPI table vs. prior year same period:**

| Metric | YTD [YEAR] | YTD [YEAR-1] | Change |
|---|---|---|---|
| Net Sales | | | |
| Total Visits | | | |
| Avg Fill Rate | | | |
| New Members | | | |
| Avg Conversion Rate | | | |
| Avg Churn Rate | | | |
| Avg Class Average | | | |
| Total Lapsed | | | |

**8b. Monthly trend table (all months YTD, all studios combined):**
Rows = months. Columns = Net Sales, Visits, Fill Rate, New Members, Lapsed, Churn Rate, Class Avg.  
Color-code cells: green if > prior year same month, red if <.

**8c. Written YTD narrative (4–5 sentences):**
Is [YEAR] tracking ahead or behind [YEAR-1]? What is the biggest driver of variance? What is the biggest risk to hitting year-end? One specific recommendation.

---

### 9. KEY RISKS & RECOMMENDATIONS

**Section heading:** Action Items

Generate this section entirely from the data. For each item:

**Format:**
```
🔴 HIGH / 🟡 MEDIUM / 🟢 WATCH

[ISSUE TITLE]
What: [1 sentence describing the metric signal]
Why it matters: [1 sentence on business impact]
Recommended action: [1 specific, actionable step]
```

**Required items to check and include if triggered:**

1. Any studio with fill rate < 55% — scheduling or demand problem
2. Any studio with churn rate > 25% — retention emergency
3. Any trainer with payroll > 50% of generated revenue — unit economics problem
4. New member count declining >15% MoM — acquisition weakness
5. Discount penetration > 40% — margin erosion risk
6. Any format with empty session share > 30% — scheduling dead weight
7. Early exit rate > 35% — product/value perception problem
8. Lead-to-trial conversion < 30% — sales process or speed-to-follow-up issue
9. No-show rate > 15% — member disengagement signal
10. Win-back rate < 5% — lost members are not coming back

---

## CALCULATION RULES (follow exactly)

```
Net Sales = SUM(Payment Value − Payment VAT)
Class Average = SUM(CheckedIn) / COUNT(sessions where CheckedIn > 0)   [exclude zero-attendance]
Fill Rate = SUM(CheckedIn) / SUM(Capacity) × 100
Churn Rate = COUNT(Status='Lapsed' AND End Date in month) / COUNT(all End Dates in month) × 100
Conversion Rate = COUNT(Conversion Status='Converted') / COUNT(all new clients in cohort) × 100
Retention Rate = COUNT(Retention Status='Retained') / COUNT(Conversion Status='Converted') × 100
Early Exit Rate = COUNT(Sessions Used % < 50 AND > 0) / COUNT(all lapsed) × 100
Win-Back = any purchase where Payment Date >= End Date + 45 days for same Member ID
No-Show = Booked − CheckedIn − LateCancelled (per session, sum for period)
Booking-to-Attendance Rate = SUM(CheckedIn) / SUM(Booked) × 100
Payroll % of Revenue = Total Paid (payroll) / Revenue Generated × 100
Discount Efficiency = Net Sales from discounted transactions / Total Discount Amount
```

**Format classification:**
- Cycle / Spin / Ride (case-insensitive, partial match) → **PowerCycle**
- Strength / Sculpt / HIIT / Fit → **Strength**
- All others → **Barre**

**Studio filter:**
- `Kwality House` = `Calculated Location` contains "Kwality" or "Kemps"
- `Supreme HQ` = contains "Supreme" or "Bandra"
- `Kenkere House` = contains "Kenkere" or "Bengaluru" or "Bangalore"
- `Pop-up` = contains "Pop" or "popup"

**Currency format:** ₹ with Indian compact notation — values ≥10,00,000 = L (lakhs), ≥1,000 = K, ≥1,00,00,000 = Cr.  
**Percentage format:** 1 decimal place (e.g. 34.7%)  
**Date format for labels:** "May '26", "Apr '26"

---

## DESIGN SPEC

**Color palette:**
- Background: `#0f172a` (dark navy) for header and sidebar
- Card background: `#ffffff`
- Page background: `#f8fafc`
- Primary accent: `#6366f1` (indigo)
- Positive/green: `#10b981`
- Negative/red: `#ef4444`
- Warning/amber: `#f59e0b`
- Chart colors: `['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']`

**Typography:**
- Load from Google Fonts: `Instrument+Sans:wght@400;500;600;700;800`
- Headings: 700–800 weight
- Body: 400–500 weight
- Metric numbers: 700–800, larger size

**Card style:**
- White background, 8px border-radius, subtle box-shadow
- Section title in small caps, slate color, above each card
- Metric value large (2–2.5rem), label below in slate-500

**MoM / YoY badges:**
- Green pill with ↑ for positive
- Red pill with ↓ for negative
- Gray with → for <1% change

**Tables:**
- Striped rows (alternate #f8fafc / #ffffff)
- Sticky header
- Sortable columns (add simple JS click-to-sort)
- Highlight top row in each ranking table with a subtle gold/amber left border

**Charts (Chart.js):**
- All charts responsive (fill container width)
- Tooltips show formatted values (₹ compact for currency, X.X% for percentages)
- No chart titles inside the chart — use HTML headings above
- Gridlines: light gray, subtle
- Legend: below chart, horizontal

---

## WRITTEN INSIGHT RULES

Every written insight block must:
1. **State what the number shows** (not just restate the number — say what it means)
2. **Explain why it matters** to the business
3. **Name something specific** — a trainer, a format, a time slot, a membership type — not generic observations
4. **Flag the risk or opportunity** — what happens if this trend continues?

**Do not write:** "Fill rate was 68.4% this month, up from 64.2% last month."  
**Do write:** "Fill rate recovered to 68.4%, driven by Kwality House's Barre slots returning to pre-April levels — but Supreme HQ remains 12 points below network average, suggesting its new schedule hasn't built demand yet."

**Tone:** Direct, confident, analytical. This is an executive reading this — no hedging, no filler. One insight per paragraph, 2–4 sentences each.

---

## OUTPUT FORMAT

Produce a single HTML file. Structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>P57 Performance Report — [MONTH YEAR]</title>
  <!-- Google Fonts -->
  <!-- Chart.js CDN -->
  <!-- All CSS inline in <style> -->
</head>
<body>
  <!-- Sticky sidebar nav -->
  <!-- Section 0: Cover/Header -->
  <!-- Section 1: Network Snapshot -->
  <!-- Section 2: Studio Breakdown -->
  <!-- Section 3: Sales Deep Dive -->
  <!-- Section 4: Class & Attendance -->
  <!-- Section 5: Trainer Performance -->
  <!-- Section 6: New Member Funnel -->
  <!-- Section 7: Retention & Churn -->
  <!-- Section 8: YTD Summary -->
  <!-- Section 9: Risks & Recommendations -->
  <!-- All JS inline in <script> at bottom -->
</body>
</html>
```

The JS block must:
1. Parse all 7 CSV files (assume they are embedded as JS string variables or loaded via fetch if running on a local server)
2. Run all calculations
3. Render all charts via Chart.js
4. Populate all tables and cards
5. Generate all written insight text programmatically from the data (not hard-coded strings)

---

## FINAL CHECK BEFORE OUTPUT

Before generating the HTML, verify:
- [ ] Report month data exists in Sales CSV
- [ ] Prior month data exists for MoM comparison
- [ ] Same month prior year data exists for YoY comparison
- [ ] All 4 studios have data for the report month (or note which are missing)
- [ ] At least 3 months of history exist for trend charts

If any data is missing, note it clearly in the report header and skip that comparison rather than showing zeros.

---

*End of prompt. Attach all 7 CSV files and send.*
