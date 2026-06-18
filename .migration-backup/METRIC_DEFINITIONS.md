# Physique 57 — Complete Metric Definitions

> Every metric used across the executive dashboard and analytics hub.  
> Last updated: 2026-06-15

---

## Data Sources

| Sheet Name | Spreadsheet ID | Google Sheets URL | Contents |
|---|---|---|---|
| **Sales** | `1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0` | [Open](https://docs.google.com/spreadsheets/d/1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0) | All payment transactions |
| **Payroll** | `149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI` | [Open](https://docs.google.com/spreadsheets/d/149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI) | Trainer sessions, attendance, payroll |
| **New Clients** | `149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI` | [Open](https://docs.google.com/spreadsheets/d/149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI) | New member funnel & lifecycle (tab: `New`) |
| **Sessions** | `16wFlke0bHFcmfn-3UyuYlGnImBq0DY7ouVYAlAFTZys` | [Open](https://docs.google.com/spreadsheets/d/16wFlke0bHFcmfn-3UyuYlGnImBq0DY7ouVYAlAFTZys) | Per-session attendance, capacity, revenue |
| **Expirations / Lapsed** | `1x-0iFgnYmEqt-b2MfAgHVx5CErcX5NtZYB9p5Rh6f1I` | [Open](https://docs.google.com/spreadsheets/d/1x-0iFgnYmEqt-b2MfAgHVx5CErcX5NtZYB9p5Rh6f1I) | Membership expirations and churn |
| **Leads** | `1dQMNF69WnXVQdhlLvUZTig3kL97NA21k6eZ9HRu6xiQ` | [Open](https://docs.google.com/spreadsheets/d/1dQMNF69WnXVQdhlLvUZTig3kL97NA21k6eZ9HRu6xiQ) | CRM lead pipeline |
| **Check-ins** | `1a7XKv2WCog7o8nYuV8YcFdqtfPYJNRO6DelJ6Hn_z6Q` | [Open](https://docs.google.com/spreadsheets/d/1a7XKv2WCog7o8nYuV8YcFdqtfPYJNRO6DelJ6Hn_z6Q) | Individual check-in records, late cancels |
| **Recurring** | `1sDPAX6OmGb48kL1pm0mhin2C9KD-Jykq8skJjNuQUNg` | [Open](https://docs.google.com/spreadsheets/d/1sDPAX6OmGb48kL1pm0mhin2C9KD-Jykq8skJjNuQUNg) | Recurring session attendance summary |

---

## CSV Export Names (local files)

| CSV File | Maps To |
|---|---|
| `Sales - Raw - Sales (10).csv` | Sales sheet |
| `Day End Report - Part 1 - New (5).csv` | New Clients sheet |
| `Day End Report - Part 3 - Sessions (11).csv` | Sessions sheet |
| `Day End Report - Part 1 - Payroll.csv` | Payroll sheet |
| `Lapsed New - Lapsed (12).csv` | Expirations sheet |
| `❖ PM - Leads ❖ - ◉ Leads (23).csv` | Leads sheet |
| `Day End Report - Part 3 - Recurring (2).csv` | Recurring sheet |

---

## Metrics — Full Definitions

---

### 1. Net Sales (Sales Revenue)

| | |
|---|---|
| **Also called** | Sales Revenue, Net Revenue |
| **Source sheet** | Sales |
| **Spreadsheet** | `1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0` |
| **Columns used** | `Payment Value`, `Payment VAT`, `Payment Date`, `Calculated Location` |
| **Formula** | `SUM(Payment Value − Payment VAT)` filtered by studio + month |
| **Display format** | ₹ with compact suffix — `₹42.3L`, `₹2.1K`, `₹1.2Cr` |
| **Decimals** | 1 decimal in compact form |
| **Where shown** | Network strip KPI, 8-metric grid, trend chart, all MoM matrices |
| **What it tells** | Total revenue collected after removing tax component. Primary health signal for the business. |
| **Known ambiguity** | Does not subtract refunds unless refund rows have negative `Payment Value`. Verify source includes refund rows. |

---

### 2. Gross Sales

| | |
|---|---|
| **Source sheet** | Sales |
| **Spreadsheet** | `1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0` |
| **Columns used** | `Payment Value`, `Payment Date`, `Calculated Location` |
| **Formula** | `SUM(Payment Value)` — before VAT deduction |
| **Display format** | ₹ compact (₹K/L/Cr) |
| **Decimals** | 1 |
| **Where shown** | Sales metrics matrix |
| **What it tells** | Total billed amount including tax. Used for reconciliation against billing system totals. |

---

### 3. Session Revenue

| | |
|---|---|
| **Source sheet** | Sessions (tab: Sessions) |
| **Spreadsheet** | `16wFlke0bHFcmfn-3UyuYlGnImBq0DY7ouVYAlAFTZys` |
| **Columns used** | `Revenue` / `Total Paid`, `Date`, `Location` |
| **Formula** | `SUM(Revenue)` per session filtered by studio + month |
| **Display format** | ₹ compact |
| **Decimals** | 1 |
| **Where shown** | Network strip, 8-metric grid, trend chart |
| **What it tells** | Revenue booked directly through class attendance (membership redemptions + drop-ins). Excludes retail, non-session products. |
| **Known ambiguity** | Unclear whether complimentary/hosted sessions contribute ₹0 rows or are excluded entirely. Affects total. |

---

### 4. Transactions

| | |
|---|---|
| **Source sheet** | Sales |
| **Spreadsheet** | `1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0` |
| **Columns used** | Row count after filters |
| **Formula** | `COUNT(rows)` filtered by studio + month |
| **Display format** | Integer, comma-separated (e.g., `1,243`) |
| **Decimals** | 0 |
| **Where shown** | Sales metrics matrix |
| **What it tells** | Volume of payment records. High transactions + low ATV signals cheap product mix or heavy discounting. |

---

### 5. Average Transaction Value (ATV)

| | |
|---|---|
| **Also called** | ATV |
| **Source sheet** | Sales |
| **Spreadsheet** | `1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0` |
| **Columns used** | `Payment Value`, `Payment VAT` |
| **Formula** | `Net Sales / Transactions` |
| **Display format** | ₹ integer (e.g., `₹3,420`) |
| **Decimals** | 0 |
| **Where shown** | 8-metric grid, management readout, MoM matrix |
| **What it tells** | Quality of each purchase. Rising ATV with flat transactions = upselling or product mix shift toward premium. Falling ATV with rising transactions = commoditisation or discount pressure. |
| **Known ambiguity** | Multi-item basket transactions: counted as 1 transaction or N? Needs clarification. |

---

### 6. Average Unit Value (AUV) / Avg Revenue per Member

| | |
|---|---|
| **Also called** | AUV, Revenue per Member, Revenue per Unique Buyer |
| **Source sheet** | Sales |
| **Spreadsheet** | `1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0` |
| **Columns used** | `Payment Value`, `Payment VAT`, `Member ID` / `Customer Email` |
| **Formula** | `Net Sales / COUNT(DISTINCT Member ID)` |
| **Display format** | ₹ integer |
| **Decimals** | 0 |
| **Where shown** | 8-metric grid, management readout |
| **What it tells** | Average spend per paying member. Proxy for member value depth — distinguishes studios with many low-spend members vs. fewer high-spend ones. |
| **Known ambiguity** | Deduplication uses `Member ID` with fallback to `Customer Email`. Mixed-identifier data can double-count or under-count. |

---

### 7. Unique Members

| | |
|---|---|
| **Source sheet** | Sales |
| **Spreadsheet** | `1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0` |
| **Columns used** | `Member ID`, `Customer Email` |
| **Formula** | `COUNT(DISTINCT Member ID)` — falls back to `Customer Email` if `Member ID` blank |
| **Display format** | Integer |
| **Decimals** | 0 |
| **Where shown** | Overview metric cards, MoM matrix |
| **What it tells** | Number of distinct buyers in the period. |

---

### 8. Discount Value

| | |
|---|---|
| **Source sheet** | Sales |
| **Spreadsheet** | `1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0` |
| **Columns used** | `Discount Amount` |
| **Formula** | `SUM(Discount Amount)` |
| **Display format** | ₹ compact |
| **Decimals** | 1 |
| **Where shown** | Sales matrix, discount codes table |
| **What it tells** | Total revenue given away via discounts. |

---

### 9. Discount Penetration

| | |
|---|---|
| **Source sheet** | Sales |
| **Spreadsheet** | `1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0` |
| **Columns used** | `Discount Amount` |
| **Formula** | `COUNT(rows where Discount Amount > 0) / COUNT(all rows) × 100` |
| **Display format** | `XX.X%` |
| **Decimals** | 1 |
| **Where shown** | Sales matrix, discount analysis |
| **What it tells** | What share of transactions used a discount. High penetration with low discount efficiency = discounting is eroding margin without driving volume. |

---

### 10. Discount Efficiency

| | |
|---|---|
| **Source sheet** | Sales |
| **Spreadsheet** | `1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0` |
| **Columns used** | `Payment Value`, `Payment VAT`, `Discount Amount` |
| **Formula** | `Net Sales from discounted transactions / Total Discount Amount` |
| **Display format** | Ratio `₹X.XX` per ₹1 discounted |
| **Decimals** | 2 |
| **Where shown** | Overview card, discount analysis |
| **What it tells** | Value > ₹1 = discount drives incremental revenue. Value < ₹1 = giving away margin with no volume gain. |

---

### 11. VAT Collected

| | |
|---|---|
| **Source sheet** | Sales |
| **Spreadsheet** | `1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0` |
| **Columns used** | `Payment VAT` |
| **Formula** | `SUM(Payment VAT)` |
| **Display format** | ₹ compact |
| **Decimals** | 1 |
| **Where shown** | Sales matrix |
| **What it tells** | GST/tax collected. For reconciliation with tax filings. |

---

### 12. Package Sell-through %

| | |
|---|---|
| **Source sheet** | Sales |
| **Spreadsheet** | `1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0` |
| **Columns used** | `secMembershipUsedSessions`, `secMembershipTotalClasses`, `secMembershipClassesLeft`, `Cleaned Product` |
| **Formula** | `SUM(Sessions Used) / SUM(Sessions Purchased) × 100` — filtered where product matches `/pack\|package/i`. Sessions Used = `secMembershipUsedSessions` OR `(secMembershipTotalClasses − secMembershipClassesLeft)` |
| **Display format** | `XX.X%` |
| **Decimals** | 1 |
| **Where shown** | Overview card |
| **What it tells** | How much of sold class capacity is actually being used. Low sell-through = members bought but aren't attending — churn risk and poor perceived value. |

---

### 13. Repeat Purchase Rate

| | |
|---|---|
| **Source sheet** | Sales |
| **Spreadsheet** | `1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0` |
| **Columns used** | `Member ID` |
| **Formula** | `COUNT(members with >1 transaction) / COUNT(all unique members) × 100` |
| **Display format** | `XX.X%` |
| **Decimals** | 1 |
| **Where shown** | Overview card |
| **What it tells** | Stickiness of buyers — high rate = members keep coming back to buy. Low rate = acquisition-heavy business, not retention-led. |

---

### 14. Purchase Frequency

| | |
|---|---|
| **Source sheet** | Sales |
| **Spreadsheet** | `1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0` |
| **Columns used** | `Payment Item` / row count, `Member ID` |
| **Formula** | `COUNT(sale items) / COUNT(DISTINCT paying members)` |
| **Display format** | Decimal (e.g., `2.34`) |
| **Decimals** | 2 |
| **Where shown** | Management readout context |
| **What it tells** | Average number of items purchased per buyer. Differentiates high-frequency low-value vs. low-frequency high-value purchase patterns. |

---

### 15. Visits (Attendance)

| | |
|---|---|
| **Also called** | Checked-in Count, Attendance, Pax |
| **Source sheet** | Sessions |
| **Spreadsheet** | `16wFlke0bHFcmfn-3UyuYlGnImBq0DY7ouVYAlAFTZys` |
| **Columns used** | `Checked In Count`, `Date`, `Location` |
| **Formula** | `SUM(Checked In Count)` filtered by studio + month |
| **Display format** | Integer |
| **Decimals** | 0 |
| **Where shown** | Network strip, overview card, trend chart, format comparison |
| **What it tells** | Total body-in-studio count. Primary demand signal. |

---

### 16. Sessions Conducted

| | |
|---|---|
| **Source sheet** | Sessions |
| **Spreadsheet** | `16wFlke0bHFcmfn-3UyuYlGnImBq0DY7ouVYAlAFTZys` |
| **Columns used** | `Session ID` / row count, `Date`, `Location` |
| **Formula** | `COUNT(DISTINCT Session ID)` |
| **Display format** | Integer |
| **Decimals** | 0 |
| **Where shown** | Sessions section, trainer table, MoM matrix |
| **What it tells** | Supply of classes. Needed to normalise demand metrics (fill rate, class average). |

---

### 17. Class Average

| | |
|---|---|
| **Source sheet** | Sessions |
| **Spreadsheet** | `16wFlke0bHFcmfn-3UyuYlGnImBq0DY7ouVYAlAFTZys` |
| **Columns used** | `Checked In Count`, `Session ID` |
| **Formula** | `SUM(Checked In Count) / COUNT(Sessions where Checked In Count > 0)` |
| **Display format** | 1 decimal (e.g., `12.3`) |
| **Decimals** | 1 |
| **Where shown** | Network strip, 8-metric grid, trainer scorecard, format comparison |
| **What it tells** | Average class size excluding empty sessions. Better signal of actual demand quality than raw attendance. |
| **Known ambiguity** | **Critical gap:** Original formula may include zero-attendance sessions in denominator, artificially deflating the number. Must use non-empty sessions only for accuracy. |

---

### 18. Fill Rate

| | |
|---|---|
| **Source sheet** | Sessions |
| **Spreadsheet** | `16wFlke0bHFcmfn-3UyuYlGnImBq0DY7ouVYAlAFTZys` |
| **Columns used** | `Checked In Count`, `Capacity`, `Date`, `Location` |
| **Formula** | `SUM(Checked In Count) / SUM(Capacity) × 100` |
| **Display format** | `XX.X%` |
| **Decimals** | 1 |
| **Where shown** | Network strip, 8-metric grid, format comparison, trainer scorecard |
| **What it tells** | Capacity utilisation. 100% = fully booked. Should be read alongside ATV — high fill at low ATV can mask a revenue quality problem. |
| **Known ambiguity** | Excludes paid-but-absent (no-shows) — they occupy a booked slot but inflate capacity. Frozen/cancelled sessions may be included. |

---

### 19. Empty Sessions

| | |
|---|---|
| **Source sheet** | Sessions |
| **Spreadsheet** | `16wFlke0bHFcmfn-3UyuYlGnImBq0DY7ouVYAlAFTZys` |
| **Columns used** | `Checked In Count`, `Session ID` |
| **Formula** | `COUNT(Sessions where Checked In Count = 0)` |
| **Display format** | Integer |
| **Decimals** | 0 |
| **Where shown** | Sessions section, empty session share card, MoM matrix |
| **What it tells** | Classes that ran with zero attendance. Direct cost with zero revenue. High count signals scheduling misalignment. |
| **Known ambiguity** | May include pre-day cancellations that were never held. These should be excluded — an empty session that was cancelled is not the same as one that ran to an empty room. |

---

### 20. Empty Session Share

| | |
|---|---|
| **Source sheet** | Sessions |
| **Spreadsheet** | `16wFlke0bHFcmfn-3UyuYlGnImBq0DY7ouVYAlAFTZys` |
| **Columns used** | `Checked In Count`, `Session ID` |
| **Formula** | `Empty Sessions / Total Sessions × 100` |
| **Display format** | `XX.X%` |
| **Decimals** | 1 |
| **Where shown** | Sessions section |
| **What it tells** | What proportion of scheduled supply is wasted. |

---

### 21. Revenue per Visit (Rev/Visit)

| | |
|---|---|
| **Source sheet** | Sales + Sessions |
| **Spreadsheet** | Sales: `1HbGnJk...`, Sessions: `16wFlke...` |
| **Columns used** | `Payment Value`, `Payment VAT`, `Checked In Count` |
| **Formula** | `Net Sales / Total Visits` |
| **Display format** | ₹ integer (e.g., `₹420`) |
| **Decimals** | 0 |
| **Where shown** | Overview card |
| **What it tells** | Revenue efficiency per body in class. Links demand and revenue in one number. |

---

### 22. Late Cancellations

| | |
|---|---|
| **Source sheet** | Check-ins (tab: Late Cancellations) |
| **Spreadsheet** | `1a7XKv2WCog7o8nYuV8YcFdqtfPYJNRO6DelJ6Hn_z6Q` |
| **Columns used** | `Is Same Day Cancellation`, `Date IST`, `Location`, `Charged Penalty Amount` |
| **Formula** | `COUNT(late cancellation rows)` filtered by studio + month |
| **Display format** | Integer |
| **Decimals** | 0 |
| **Where shown** | 8-metric grid, late cancellations section |
| **What it tells** | Members who booked then cancelled after the cutoff window. Holds occupied capacity that could have been offered to others. |
| **Known ambiguity** | "Late" cutoff time not defined in data — assumed from booking system rules (often 2–4h). Teacher-initiated cancellations may be included. |

---

### 23. Late Cancellation Rate

| | |
|---|---|
| **Source sheet** | Check-ins |
| **Spreadsheet** | `1a7XKv2WCog7o8nYuV8YcFdqtfPYJNRO6DelJ6Hn_z6Q` |
| **Columns used** | `Is Late Cancelled`, `Checked In` |
| **Formula** | `Late Cancels / (Visits + Late Cancels) × 100` |
| **Display format** | `XX.X%` |
| **Decimals** | 1 |
| **Where shown** | Overview card, late cancellations section |
| **What it tells** | Share of bookings that turned into late cancels. High rate = scheduling friction or low commitment from members. |

---

### 24. Penalty Revenue

| | |
|---|---|
| **Source sheet** | Check-ins (Late Cancellations) |
| **Spreadsheet** | `1a7XKv2WCog7o8nYuV8YcFdqtfPYJNRO6DelJ6Hn_z6Q` |
| **Columns used** | `Charged Penalty Amount` |
| **Formula** | `SUM(Charged Penalty Amount)` |
| **Display format** | ₹ compact |
| **Decimals** | 1 |
| **Where shown** | Late cancellations section |
| **What it tells** | Revenue recovered from late cancellation fees. |

---

### 25. New Members (New Clients)

| | |
|---|---|
| **Source sheet** | New Clients (tab: `New`) |
| **Spreadsheet** | `149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI` |
| **Columns used** | `First Visit Date`, `First Visit Location`, `Member ID` |
| **Formula** | `COUNT(rows where First Visit Date in month)` |
| **Display format** | Integer |
| **Decimals** | 0 |
| **Where shown** | 8-metric grid, funnel section, management readout |
| **What it tells** | Top of the acquisition funnel. Volume of first-time visitors in the period. |
| **Known ambiguity** | May include complimentary visits. Transferred members from other studios could count as "new" if their first local visit is recorded. |

---

### 26. Conversion Rate

| | |
|---|---|
| **Source sheet** | New Clients |
| **Spreadsheet** | `149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI` |
| **Columns used** | `Conversion Status`, `Member ID` |
| **Formula** | `COUNT(Conversion Status = 'Converted') / COUNT(all new clients) × 100` |
| **Display format** | `XX.X%` |
| **Decimals** | 1 |
| **Where shown** | 8-metric grid, funnel, trainer scorecard, management readout |
| **What it tells** | What % of first-time visitors became paying members. Core acquisition quality metric. Low conversion with high new members = traffic without revenue. |
| **Known ambiguity** | 'Converted' definition unclear — does it mean any purchase, or first membership purchase, or purchase within N days of first visit? Multi-month trials may be excluded. |

---

### 27. Retention Rate

| | |
|---|---|
| **Source sheet** | New Clients |
| **Spreadsheet** | `149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI` |
| **Columns used** | `Retention Status`, `Conversion Status` |
| **Formula** | `COUNT(Retention Status = 'Retained') / COUNT(Conversion Status = 'Converted') × 100` |
| **Display format** | `XX.X%` |
| **Decimals** | 1 |
| **Where shown** | 8-metric grid, client lifecycle section, management readout |
| **What it tells** | Of those who converted, what % stayed active. Measures depth of acquisition quality — did we acquire people who actually wanted to be members? |
| **Known ambiguity** | **Critical gap:** Retention window undefined — is 'Retained' at 30 days? 60 days? Active in last month? This changes the number significantly. |

---

### 28. Average LTV (Lifetime Value)

| | |
|---|---|
| **Source sheet** | New Clients |
| **Spreadsheet** | `149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI` |
| **Columns used** | `LTV` |
| **Formula** | `SUM(LTV) / COUNT(cohort)` |
| **Display format** | ₹ integer |
| **Decimals** | 0 |
| **Where shown** | Client lifecycle section, LTV analysis |
| **What it tells** | Average total spend per acquired member over their lifetime. Core acquisition economics signal — if LTV < cost to acquire, the studio loses money on every new member. |

---

### 29. Average Conversion Span

| | |
|---|---|
| **Source sheet** | New Clients |
| **Spreadsheet** | `149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI` |
| **Columns used** | `Conversion Span` (days from first visit to first purchase) |
| **Formula** | `SUM(Conversion Span) / COUNT(converted cohort)` |
| **Display format** | Integer (days) |
| **Decimals** | 0 |
| **Where shown** | Client lifecycle section |
| **What it tells** | How long it takes a new visitor to become a paying member. Long spans = friction in the sales process or weak onboarding. |

---

### 30. Revenue per New Client

| | |
|---|---|
| **Source sheet** | Sales + New Clients |
| **Formula** | `Net Sales / New Client Count` |
| **Display format** | ₹ integer |
| **Decimals** | 0 |
| **Where shown** | Overview card |
| **What it tells** | Blended revenue contribution of each new member acquired. Useful for evaluating whether acquisition investment is translating into revenue. |

---

### 31. Churn Rate

| | |
|---|---|
| **Also called** | Churn Risk |
| **Source sheet** | Expirations / Lapsed |
| **Spreadsheet** | `1x-0iFgnYmEqt-b2MfAgHVx5CErcX5NtZYB9p5Rh6f1I` |
| **Columns used** | `Status`, `End Date`, `Member ID` |
| **Formula** | `COUNT(Status = 'Lapsed') / COUNT(all memberships with End Date in month) × 100` |
| **Display format** | `XX.X%` |
| **Decimals** | 1 |
| **Where shown** | Network strip, 8-metric grid, lapsed section, management readout |
| **What it tells** | What share of expiring memberships did not renew. Primary retention health metric. Rising churn = members are not finding enough value to stay. |
| **Known ambiguity** | **Critical gaps:** (1) 'Expiring this month' — is End Date on/before last day of month, or does it include grace periods? (2) Paused/frozen memberships may be classified as lapsed incorrectly. (3) Members who upgraded to a different membership may show as lapsed from original membership. |

---

### 32. Lapsed Members (Count)

| | |
|---|---|
| **Source sheet** | Expirations |
| **Spreadsheet** | `1x-0iFgnYmEqt-b2MfAgHVx5CErcX5NtZYB9p5Rh6f1I` |
| **Columns used** | `Status`, `End Date`, `Location` |
| **Formula** | `COUNT(rows where Status = 'Lapsed' AND End Date in period)` |
| **Display format** | Integer |
| **Decimals** | 0 |
| **Where shown** | Overview card, lapsed section, churn analysis |
| **What it tells** | Absolute number of members who exited. |

---

### 33. Early Exit Rate

| | |
|---|---|
| **Source sheet** | Expirations |
| **Spreadsheet** | `1x-0iFgnYmEqt-b2MfAgHVx5CErcX5NtZYB9p5Rh6f1I` |
| **Columns used** | `Sessions Used Pct` |
| **Formula** | `COUNT(rows where Sessions Used Pct < 50 AND > 0) / COUNT(total lapsed) × 100` |
| **Display format** | `XX.X%` |
| **Decimals** | 1 |
| **Where shown** | Lapsed section |
| **What it tells** | Members who left having used less than half their purchased sessions. Signals dissatisfaction, scheduling mismatch, or buyer's remorse — not just end-of-membership churn. |

---

### 34. Average Sessions Used %

| | |
|---|---|
| **Source sheet** | Expirations |
| **Spreadsheet** | `1x-0iFgnYmEqt-b2MfAgHVx5CErcX5NtZYB9p5Rh6f1I` |
| **Columns used** | `Sessions Used Pct` |
| **Formula** | `SUM(Sessions Used Pct) / COUNT(lapsed rows)` |
| **Display format** | `XX.X%` |
| **Decimals** | 1 |
| **Where shown** | Lapsed section |
| **What it tells** | Average engagement depth of members before they lapsed. Low % = members left while still having sessions — poor perceived value or access barriers. |

---

### 35. Average Days Active

| | |
|---|---|
| **Source sheet** | Expirations |
| **Spreadsheet** | `1x-0iFgnYmEqt-b2MfAgHVx5CErcX5NtZYB9p5Rh6f1I` |
| **Columns used** | `Days Active` |
| **Formula** | `SUM(Days Active) / COUNT(lapsed rows)` |
| **Display format** | Integer (days) |
| **Decimals** | 0 |
| **Where shown** | Lapsed section |
| **What it tells** | How long members stayed before leaving. Short spans = early churn, often within first 30–60 days. |

---

### 36. Discount-Driven Lapse %

| | |
|---|---|
| **Source sheet** | Expirations |
| **Spreadsheet** | `1x-0iFgnYmEqt-b2MfAgHVx5CErcX5NtZYB9p5Rh6f1I` |
| **Columns used** | `Discount Code`, `Member ID` |
| **Formula** | `COUNT(lapsed where Discount Code not empty) / COUNT(total lapsed) × 100` |
| **Display format** | `XX.X%` |
| **Decimals** | 1 |
| **Where shown** | Lapsed section |
| **What it tells** | What share of lapsed members originally joined on a discounted offer. High % = discount-acquired members churn faster — those offers attract price-sensitive buyers rather than committed members. |

---

### 37. Win-Back Rate

| | |
|---|---|
| **Source sheet** | Expirations + Sales |
| **Spreadsheet** | Expirations: `1x-0iFgnYmEqt...`, Sales: `1HbGnJk...` |
| **Columns used** | `End Date` (expirations), `Payment Date` + `Member ID` (sales) |
| **Formula** | `COUNT(members with a purchase ≥45 days after End Date) / COUNT(total lapsed) × 100` |
| **Display format** | `XX.X%` |
| **Decimals** | 1 |
| **Where shown** | Lapsed section, win-back analysis |
| **What it tells** | What % of churned members came back. Measures effectiveness of re-engagement or organic regret-driven return. |
| **Known ambiguity** | 45-day cutoff is somewhat arbitrary — ensures a real gap before classifying as a reactivation rather than a billing delay. |

---

### 38. Leads Created

| | |
|---|---|
| **Source sheet** | Leads |
| **Spreadsheet** | `1dQMNF69WnXVQdhlLvUZTig3kL97NA21k6eZ9HRu6xiQ` |
| **Columns used** | `Created At`, `Center`, `ID` |
| **Formula** | `COUNT(DISTINCT ID) where Created At in month` |
| **Display format** | Integer |
| **Decimals** | 0 |
| **Where shown** | CRM pipeline table, funnel section |
| **What it tells** | Top-of-funnel volume. How many new prospects entered the pipeline. |
| **Known ambiguity** | Test/internal leads may be included. No deduplication across months if same lead re-enters. |

---

### 39. Trials Scheduled

| | |
|---|---|
| **Source sheet** | Leads |
| **Spreadsheet** | `1dQMNF69WnXVQdhlLvUZTig3kL97NA21k6eZ9HRu6xiQ` |
| **Columns used** | `Stage`, `Trial Status` |
| **Formula** | `COUNT(Stage = 'Trial Scheduled')` OR `Trial Status IN ('Trial', 'Attended', 'Booked', 'Completed')` |
| **Display format** | Integer |
| **Decimals** | 0 |
| **Where shown** | CRM pipeline table, funnel |
| **What it tells** | Middle of funnel — leads who booked a trial class. |
| **Known ambiguity** | Cancelled trials may still show Stage = 'Trial Scheduled' if stage wasn't updated in CRM. |

---

### 40. Lead Yield (Conversion from Lead)

| | |
|---|---|
| **Source sheet** | Leads + New Clients |
| **Spreadsheet** | Leads: `1dQMNF69...`, New Clients: `149ILDqo...` |
| **Columns used** | `Conversion Status` (leads), `Member ID` (both) |
| **Formula** | `COUNT(converted leads) / COUNT(all leads) × 100` OR `New Members / Leads Created × 100` |
| **Display format** | `XX.X%` |
| **Decimals** | 1 |
| **Where shown** | Management readout context, lead source table |
| **What it tells** | End-to-end funnel efficiency — what share of all leads became members. Varies dramatically by lead source (walk-in vs. Instagram vs. referral). |
| **Known ambiguity** | Attribution model unclear — is a lead "converted" the same month they were created, or whenever conversion happens? Multi-month journey leads are difficult to attribute. |

---

### 41. Trainer Score (Composite)

| | |
|---|---|
| **Source sheet** | Payroll + Sessions + New Clients |
| **Spreadsheet** | Payroll: `149ILDqo...`, Sessions: `16wFlke...` |
| **Columns used** | `Total Customers`, `Total Non-Empty Sessions`, `Total Sessions`, `New`, `Converted`, `Retained`, `Total Paid` |
| **Formula** | Weighted composite — approximate weights: `(Class Avg / 30 × 100) × 40% + Fill Rate × 30% + Conversion Rate × 20% + Retention Rate × 10%` — capped 0–100 |
| **Display format** | Score out of 100 (e.g., `78.4`) |
| **Decimals** | 1 |
| **Where shown** | Trainer scorecard |
| **What it tells** | Single-number trainer performance ranking. Balances attendance efficiency, capacity utilisation, and member lifecycle contribution. |
| **Known ambiguity** | **Critical gap:** Exact weights are not publicly documented. `LN(Revenue+1)/5` scaling seen in some versions is mathematically unintuitive and hard to explain to trainers. Multi-trainer class attribution is undefined — if two trainers co-teach, who gets the conversion credit? |

---

### 42. Trainer Conversion Rate

| | |
|---|---|
| **Source sheet** | Payroll |
| **Spreadsheet** | `149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI` |
| **Columns used** | `Converted`, `New` |
| **Formula** | `Converted / New × 100` |
| **Display format** | `XX.X%` |
| **Decimals** | 1 |
| **Where shown** | Trainer scorecard, format comparison |
| **What it tells** | Which trainers are most effective at converting first-timers to members. High signal for scheduling decisions — put best converters on peak trial-class slots. |

---

### 43. Trainer Retention Rate

| | |
|---|---|
| **Source sheet** | Payroll |
| **Spreadsheet** | `149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI` |
| **Columns used** | `Retained`, `Converted` |
| **Formula** | `Retained / Converted × 100` |
| **Display format** | `XX.X%` |
| **Decimals** | 1 |
| **Where shown** | Trainer scorecard |
| **What it tells** | Which trainers build lasting member loyalty. Lower trainer retention = members converted but not staying in their classes. |

---

### 44. Trainer Utilisation %

| | |
|---|---|
| **Source sheet** | Payroll |
| **Spreadsheet** | `149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI` |
| **Columns used** | `Total Non-Empty Sessions`, `Total Sessions` |
| **Formula** | `Total Non-Empty Sessions / Total Sessions × 100` |
| **Display format** | `XX.X%` |
| **Decimals** | 1 |
| **Where shown** | Trainer scorecard |
| **What it tells** | What share of a trainer's sessions actually had attendance. Low utilisation = trainer is being scheduled for slots with no demand. |

---

### 45. Format Class Average

| | |
|---|---|
| **Source sheet** | Sessions |
| **Spreadsheet** | `16wFlke0bHFcmfn-3UyuYlGnImBq0DY7ouVYAlAFTZys` |
| **Columns used** | `Checked In Count`, `Session Name` / `Class Type` |
| **Formula** | `SUM(Checked In) / COUNT(non-empty sessions)` grouped by format (PowerCycle / Barre / Strength) |
| **Format classification** | Cycle/Spin/Ride → PowerCycle; Strength/Sculpt/HIIT → Strength; all others → Barre |
| **Display format** | 1 decimal |
| **Decimals** | 1 |
| **Where shown** | Format comparison section |
| **What it tells** | Demand quality by class type. Directly comparable across formats to identify which format has strongest organic demand. |

---

### 46. Format Fill Rate

| | |
|---|---|
| **Source sheet** | Sessions |
| **Spreadsheet** | `16wFlke0bHFcmfn-3UyuYlGnImBq0DY7ouVYAlAFTZys` |
| **Columns used** | `Checked In Count`, `Capacity`, `Session Name` |
| **Formula** | `SUM(Checked In) / SUM(Capacity) × 100` grouped by format |
| **Display format** | `XX.X%` |
| **Decimals** | 1 |
| **Where shown** | Format comparison |
| **What it tells** | Capacity utilisation per format. Must be read alongside schedule supply — a format with 50% fill but only 2 scheduled classes/week isn't comparable to one with 50% fill across 10 classes. |

---

### 47. MoM Growth (Month-over-Month)

| | |
|---|---|
| **Source sheet** | Any metric |
| **Formula** | `(Current Month Value − Previous Month Value) / Previous Month Value × 100` |
| **Display format** | `+XX.X%` or `−XX.X%` |
| **Decimals** | 1 |
| **Color coding** | Green > 0, Red < 0, Gray ≈ 0 |
| **Special case** | Returns `null` (shown as `—`) if previous month = 0 and current > 0 |
| **Where shown** | Trend arrows on all metric cards, MoM matrix columns |
| **What it tells** | Direction and magnitude of change from prior month. Does not control for seasonality. |

---

### 48. YoY Growth (Year-over-Year)

| | |
|---|---|
| **Source sheet** | Any metric |
| **Formula** | `(Current Month Value − Same Month Prior Year Value) / Same Month Prior Year Value × 100` |
| **Display format** | `+XX.X%` or `−XX.X%` |
| **Decimals** | 1 |
| **Where shown** | Trend charts (toggle option), management readout |
| **What it tells** | Seasonality-adjusted growth signal. More meaningful than MoM for a fitness studio with predictable seasonal patterns (Jan resolution spike, summer dip, etc.). |

---

### 49. Session Intelligence Composite Score

| | |
|---|---|
| **Source sheet** | Sessions |
| **Spreadsheet** | `16wFlke0bHFcmfn-3UyuYlGnImBq0DY7ouVYAlAFTZys` |
| **Formula** | `(min(classAvg × 5, 100) × 40%) + (min(fillRate, 100) × 35%) + (min(sessions × 2, 100) × 25%)` |
| **Display format** | Score 0–100 |
| **Decimals** | 0 |
| **Where shown** | Session rankings table |
| **What it tells** | Blended quality score for a session slot (class/trainer/time combination). Ranks which schedule slots are highest-performing across demand, efficiency, and volume. |

---

## Definition Gaps — Action Required

| # | Metric | Gap | Impact |
|---|---|---|---|
| 1 | Class Average | Denominator includes or excludes zero-attendance sessions? | Could deflate by 10–30% |
| 2 | Churn Rate | 'Expiring this month' cutoff date ambiguous | Churn % varies ±5–10 pts |
| 3 | Churn Rate | Frozen/paused memberships counted as lapsed? | Inflates churn if included |
| 4 | Conversion Rate | 'Converted' = first purchase, first membership, or first visit? | Changes cohort definition |
| 5 | Retention Rate | Retention window (30/60/90 days) undefined | Changes % significantly |
| 6 | Trainer Score | Exact formula weights not documented | Trainers cannot interpret or game toward |
| 7 | Trainer Score | Multi-trainer class attribution undefined | Conversion credit may be split incorrectly |
| 8 | Late Cancellations | Cancellation cutoff hours not defined | ±30% swing possible |
| 9 | AUV | Member ID vs email deduplication logic | Double-count or under-count risk |
| 10 | Session Revenue | Complimentary/hosted sessions included? | Inflates or deflates ±5–20% |
| 11 | Lead Yield | Attribution window (same-month vs ever-convert) | Changes % dramatically |
| 12 | Empty Sessions | Pre-day-cancellations included? | Overstates empty count |

---

## Formatting Quick Reference

| Type | Format | Example |
|---|---|---|
| Currency (large) | ₹ compact, 1 decimal | `₹42.3L`, `₹1.2Cr`, `₹8.4K` |
| Currency (small) | ₹ integer | `₹3,420` |
| Percentage | 1 decimal + % | `34.7%` |
| Integer count | Comma-separated | `1,243` |
| Decimal metric | 1 decimal | `12.3` (class avg, fill rate) |
| Score | 1 decimal | `78.4` |
| Days | Integer | `42 days` |
| Ratio | 2 decimal | `₹1.34 per ₹1` |
| Month label | Short month + 2-digit year | `Apr '26` |
| Growth positive | Green `+12.4%` | `text-emerald-600` |
| Growth negative | Red `−8.1%` | `text-red-500` |
| Growth flat/null | Gray `—` | `text-slate-400` |
