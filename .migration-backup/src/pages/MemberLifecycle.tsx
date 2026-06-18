import React, { useEffect, useMemo } from 'react';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { Footer } from '@/components/ui/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { useVCMemberData } from '@/hooks/useVCMemberData';
import { useMemberBehaviorAnalytics } from '@/hooks/useMemberBehaviorAnalytics';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import {
  Activity,
  AlertTriangle,
  BadgeDollarSign,
  HeartPulse,
  LineChart as LineChartIcon,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const SEGMENT_COLORS: Record<string, string> = {
  'high-value': '#2563eb',
  engaged: '#10b981',
  reliable: '#06b6d4',
  'at-risk': '#f59e0b',
  unreliable: '#ef4444',
  inactive: '#64748b',
};

const SEGMENT_BADGES: Record<string, string> = {
  'high-value': 'bg-blue-100 text-blue-700 border-blue-200',
  engaged: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  reliable: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'at-risk': 'bg-amber-100 text-amber-800 border-amber-200',
  unreliable: 'bg-red-100 text-red-700 border-red-200',
  inactive: 'bg-slate-100 text-slate-700 border-slate-200',
};

const titleCaseSegment = (value: string) =>
  value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const MemberLifecycle: React.FC = () => {
  const { data: memberData = [], loading, error } = useVCMemberData();
  const { setLoading } = useGlobalLoading();
  const analytics = useMemberBehaviorAnalytics(memberData);

  useEffect(() => {
    setLoading(loading, 'Loading member lifecycle analytics...');
  }, [loading, setLoading]);

  const performanceByMember = useMemo(() => {
    return new Map(analytics.performanceMetrics.map((metric) => [metric.memberId, metric]));
  }, [analytics.performanceMetrics]);

  const segmentMix = useMemo(() => {
    const grouped = analytics.memberSegments.reduce<Record<string, number>>((acc, member) => {
      acc[member.segment] = (acc[member.segment] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([segment, count]) => ({
      segment,
      label: titleCaseSegment(segment),
      count,
      color: SEGMENT_COLORS[segment] || '#64748b',
    }));
  }, [analytics.memberSegments]);

  const engagementTrendData = useMemo(() => {
    return [...analytics.monthlyTrends].slice(0, 8).reverse().map((month) => ({
      month: month.month,
      visits: Math.round(month.totalVisits),
      bookings: Math.round(month.totalBookings),
      showUpRate: Number(month.showUpRate.toFixed(1)),
    }));
  }, [analytics.monthlyTrends]);

  const atRiskMembers = useMemo(() => {
    return analytics.memberSegments
      .filter((member) => member.segment === 'at-risk' || member.segment === 'unreliable' || member.segment === 'inactive')
      .map((member) => ({
        ...member,
        metrics: performanceByMember.get(member.memberId),
      }))
      .sort((a, b) => {
        const riskGap = (b.metrics?.cancellationRate || 0) - (a.metrics?.cancellationRate || 0);
        if (riskGap !== 0) return riskGap;
        return (b.totalRevenue || 0) - (a.totalRevenue || 0);
      })
      .slice(0, 15);
  }, [analytics.memberSegments, performanceByMember]);

  const highValueMembers = useMemo(() => {
    return analytics.memberSegments
      .filter((member) => member.segment === 'high-value' || member.segment === 'engaged' || member.segment === 'reliable')
      .map((member) => ({
        ...member,
        metrics: performanceByMember.get(member.memberId),
      }))
      .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
      .slice(0, 15);
  }, [analytics.memberSegments, performanceByMember]);

  const momentumMovers = useMemo(() => {
    return {
      positive: analytics.trendAnalysis.increasing.slice(0, 12),
      negative: analytics.trendAnalysis.declining.slice(0, 12),
    };
  }, [analytics.trendAnalysis.declining, analytics.trendAnalysis.increasing]);

  const lifecycleSignals = useMemo(() => {
    const totalRevenue = analytics.financialInsights.totalRevenue;
    const activeRate = analytics.summaryInsights.totalMembers > 0
      ? (analytics.summaryInsights.activeMembers / analytics.summaryInsights.totalMembers) * 100
      : 0;

    return {
      activeRate,
      totalRevenue,
      avgRevenuePerVisit: analytics.financialInsights.revenuePerVisit,
      collectionEfficiency: analytics.financialInsights.collectionEfficiency,
    };
  }, [analytics.financialInsights, analytics.summaryInsights.activeMembers, analytics.summaryInsights.totalMembers]);

  if (!loading && error && memberData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/20 flex items-center justify-center p-6">
        <Card className="max-w-xl border-red-200 bg-white/90 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-red-700">
              <AlertTriangle className="h-6 w-6" />
              Member lifecycle data is unavailable
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>{error}</p>
            <p>This module is built and routed, but it depends on the VC behavior dataset to calculate segment, risk, and engagement movements.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/25 to-cyan-50/20">
      <DashboardMotionHero
        title="Member 360 & Lifecycle"
        subtitle="A full-stack view of member value, reliability, engagement, and emerging risk. The people layer of the business, without the spreadsheet archaeology."
        metrics={[
          { label: 'Tracked members', value: formatNumber(analytics.summaryInsights.totalMembers) },
          { label: 'Active members', value: formatNumber(analytics.summaryInsights.activeMembers) },
          { label: 'At-risk members', value: formatNumber(analytics.summaryInsights.atRiskMembers) },
          { label: 'Avg show-up rate', value: formatPercentage(analytics.summaryInsights.averageShowUpRate) },
        ]}
        compact={false}
      />

      <div className="container mx-auto px-6 py-8">
        <main className="space-y-8">
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: 'Active member rate',
                value: formatPercentage(lifecycleSignals.activeRate),
                note: `${formatNumber(analytics.summaryInsights.inactiveMembers)} inactive members need reactivation attention`,
                icon: Users,
                accent: 'text-blue-600',
                bg: 'from-blue-50 to-cyan-50',
              },
              {
                title: 'Collection efficiency',
                value: formatPercentage(lifecycleSignals.collectionEfficiency),
                note: `${formatCurrency(analytics.financialInsights.totalOutstanding)} still outstanding`,
                icon: BadgeDollarSign,
                accent: 'text-emerald-600',
                bg: 'from-emerald-50 to-teal-50',
              },
              {
                title: 'Cancellation pressure',
                value: formatPercentage(analytics.operationalMetrics.overallCancellationRate),
                note: `${formatNumber(analytics.operationalMetrics.totalCancellations)} cancellations across the network`,
                icon: ShieldAlert,
                accent: 'text-amber-600',
                bg: 'from-amber-50 to-orange-50',
              },
              {
                title: 'Revenue per visit',
                value: formatCurrency(lifecycleSignals.avgRevenuePerVisit),
                note: `${formatCurrency(lifecycleSignals.totalRevenue)} total revenue tracked`,
                icon: HeartPulse,
                accent: 'text-fuchsia-600',
                bg: 'from-fuchsia-50 to-pink-50',
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className={`border-slate-200 shadow-sm bg-gradient-to-br ${card.bg}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-600">{card.title}</p>
                        <p className="mt-2 text-2xl font-bold text-slate-950">{card.value}</p>
                        <p className="mt-2 text-xs text-slate-600">{card.note}</p>
                      </div>
                      <div className="rounded-xl bg-white/80 p-3 shadow-sm">
                        <Icon className={`h-5 w-5 ${card.accent}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_1.3fr]">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Activity className="h-5 w-5 text-emerald-600" />
                  Member segment mix
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={segmentMix}
                        dataKey="count"
                        nameKey="label"
                        innerRadius={70}
                        outerRadius={112}
                        paddingAngle={3}
                      >
                        {segmentMix.map((entry) => (
                          <Cell key={entry.segment} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [formatNumber(value), 'Members']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <LineChartIcon className="h-5 w-5 text-blue-600" />
                  Engagement momentum
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={engagementTrendData}>
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#475569' }} />
                      <YAxis yAxisId="volume" tick={{ fontSize: 12, fill: '#475569' }} />
                      <YAxis yAxisId="rate" orientation="right" tick={{ fontSize: 12, fill: '#475569' }} domain={[0, 100]} />
                      <Tooltip />
                      <Line yAxisId="volume" type="monotone" dataKey="bookings" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                      <Line yAxisId="volume" type="monotone" dataKey="visits" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                      <Line yAxisId="rate" type="monotone" dataKey="showUpRate" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="8 6" dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-900">Lifecycle intelligence brief</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Top trend</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{analytics.summaryInsights.topTrend}</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Key insight</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{analytics.summaryInsights.keyInsight}</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Recommendation</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{analytics.summaryInsights.recommendation}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-900">High-risk patterns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.trendAnalysis.correlationInsights.highRiskPatterns.length === 0 ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-800">
                    No high-severity behavior clusters detected right now. Tiny confetti cannon, responsibly used.
                  </div>
                ) : (
                  analytics.trendAnalysis.correlationInsights.highRiskPatterns.map((pattern) => (
                    <div key={pattern.pattern} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">{pattern.pattern}</p>
                        <Badge className={`border ${pattern.severity === 'high' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                          {pattern.severity}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">Affected members: {formatNumber(pattern.memberCount)}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-900">Lifecycle roster</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="risk" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 bg-slate-100">
                  <TabsTrigger value="risk">At-risk cohort</TabsTrigger>
                  <TabsTrigger value="value">High-value cohort</TabsTrigger>
                  <TabsTrigger value="momentum">Momentum movers</TabsTrigger>
                </TabsList>

                <TabsContent value="risk" className="mt-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80">
                          <TableHead>Member</TableHead>
                          <TableHead>Segment</TableHead>
                          <TableHead>Last activity</TableHead>
                          <TableHead className="text-right">Visits</TableHead>
                          <TableHead className="text-right">Cancellation</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {atRiskMembers.map((member) => (
                          <TableRow key={member.memberId}>
                            <TableCell>
                              <div className="font-semibold text-slate-900">{member.fullName}</div>
                              <div className="text-xs text-slate-500">{member.email}</div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`border ${SEGMENT_BADGES[member.segment]}`}>{titleCaseSegment(member.segment)}</Badge>
                            </TableCell>
                            <TableCell className="text-slate-700">{member.lastActivityMonth || 'No recent activity'}</TableCell>
                            <TableCell className="text-right">{formatNumber(member.metrics?.totalVisits || 0)}</TableCell>
                            <TableCell className="text-right">{formatPercentage(member.metrics?.cancellationRate || 0)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(member.totalRevenue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="value" className="mt-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80">
                          <TableHead>Member</TableHead>
                          <TableHead>Segment</TableHead>
                          <TableHead className="text-right">Visits</TableHead>
                          <TableHead className="text-right">Show-up rate</TableHead>
                          <TableHead className="text-right">Payment compliance</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {highValueMembers.map((member) => (
                          <TableRow key={member.memberId}>
                            <TableCell>
                              <div className="font-semibold text-slate-900">{member.fullName}</div>
                              <div className="text-xs text-slate-500">{member.email}</div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`border ${SEGMENT_BADGES[member.segment]}`}>{titleCaseSegment(member.segment)}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatNumber(member.metrics?.totalVisits || 0)}</TableCell>
                            <TableCell className="text-right">{formatPercentage(member.metrics?.showUpRate || 0)}</TableCell>
                            <TableCell className="text-right">{formatPercentage(member.metrics?.paymentCompliance || 0)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(member.totalRevenue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="momentum" className="mt-0 space-y-6">
                  <div className="grid gap-6 xl:grid-cols-2">
                    <div className="overflow-x-auto rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
                      <div className="mb-4 flex items-center gap-2 text-emerald-800">
                        <TrendingUp className="h-4 w-4" />
                        <h3 className="font-semibold">Positive movers</h3>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Metric</TableHead>
                            <TableHead className="text-right">Change</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {momentumMovers.positive.map((member) => (
                            <TableRow key={`${member.memberId}-${member.metric}`}>
                              <TableCell>
                                <div className="font-semibold text-slate-900">{member.fullName}</div>
                                <div className="text-xs text-slate-500">{member.email}</div>
                              </TableCell>
                              <TableCell className="capitalize text-slate-700">{member.metric}</TableCell>
                              <TableCell className="text-right font-semibold text-emerald-700">+{formatPercentage(member.changeRate)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-red-200 bg-red-50/40 p-4">
                      <div className="mb-4 flex items-center gap-2 text-red-800">
                        <TrendingDown className="h-4 w-4" />
                        <h3 className="font-semibold">Negative movers</h3>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Metric</TableHead>
                            <TableHead className="text-right">Change</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {momentumMovers.negative.map((member) => (
                            <TableRow key={`${member.memberId}-${member.metric}`}>
                              <TableCell>
                                <div className="font-semibold text-slate-900">{member.fullName}</div>
                                <div className="text-xs text-slate-500">{member.email}</div>
                              </TableCell>
                              <TableCell className="capitalize text-slate-700">{member.metric}</TableCell>
                              <TableCell className="text-right font-semibold text-red-700">{formatPercentage(member.changeRate)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default MemberLifecycle;
