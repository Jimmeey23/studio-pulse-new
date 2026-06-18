export type SummaryContext =
  | 'executive'
  | 'sales-overview'
  | 'clients-overview'
  | 'sessions-overview'
  | 'trainer-overview'
  | 'discounts-overview'
  | 'leads-overview'
  | 'expiration-analytics-overview'
  | 'late-cancellations-overview'
  | 'recommendations';

export type SummaryLocationId = 'kwality' | 'supreme' | 'kenkere' | 'all';

export function getSummaryText(
  context: SummaryContext,
  locationId: SummaryLocationId
): string {
  switch (context) {
    case 'executive':
      return 'This executive summary consolidates sales, utilisation, client behaviour and promotional performance into a single view, highlighting where value is created and where attention is required.';
    case 'sales-overview':
      if (locationId === 'kwality') {
        return 'Kwality House revenue for the selected period is driven primarily by high-value packages, with steady drop-in performance. There is an opportunity to further increase average transaction values through targeted upsell campaigns.';
      }
      if (locationId === 'supreme') {
        return 'Supreme HQ shows resilient recurring revenue and strong package mix. Focus should be on deepening relationships with high-LTV members and introducing premium offerings.';
      }
      if (locationId === 'kenkere') {
        return 'Kenkere House is still in its growth phase. Revenue momentum is building, and local awareness campaigns can accelerate member acquisition and package adoption.';
      }
      return 'Overall sales performance is steady with clear opportunities to increase average transaction values and drive more members into higher-value packages.';
    case 'clients-overview':
      return 'Client acquisition and retention trends indicate how effectively leads are converting into long-term members. The focus should be on onboarding quality new clients and protecting high-value cohorts from churn.';
    case 'sessions-overview':
      return 'Class utilisation over the period highlights clear peak-time patterns and under-utilised slots. Optimising the timetable around demonstrated demand can lift average fill rates and overall capacity usage.';
    case 'trainer-overview':
      return 'Trainer performance reflects both schedule allocation and client affinity. Investing in high performers and sharing best practices can lift consistency across the instructor team.';
    case 'discounts-overview':
      return 'Discount activity should be monitored to ensure promotions drive incremental revenue rather than eroding baseline pricing. The goal is to concentrate discounts where they unlock new demand or reactivation.';
    case 'leads-overview':
      return 'Lead volume and conversion metrics reveal which channels are most efficient at bringing in new members. Resources should be focused on high-conversion sources while testing improvements on weaker ones.';
    case 'expiration-analytics-overview':
      return 'Upcoming expirations represent both revenue at risk and an opportunity to re-engage clients. Proactive campaigns around key expiry windows can improve renewal and upgrade rates.';
    case 'late-cancellations-overview':
      return 'Late cancellations and no-shows affect capacity utilisation and member experience. Clarifying policies, improving reminders, and using waitlists can reduce the operational impact.';
    case 'recommendations':
      return 'Based on recent performance, focus on optimising schedule around peak demand, tightening discount strategies to high-ROI campaigns, and reinforcing retention programmes for high-value members.';
    default:
      return '';
  }
}
