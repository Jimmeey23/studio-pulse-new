import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackItem {
  id: string;
  element: string;
  category: string;
  description: string;
  feedback?: string;
  expanded: boolean;
}

const FEEDBACK_ITEMS: FeedbackItem[] = [
  {
    id: 'sales-metrics',
    element: 'Sales Metrics Cards',
    category: 'Metric Cards',
    description: 'Revenue, Transactions, ATV, Discount % cards display',
    expanded: false
  },
  {
    id: 'sales-table',
    element: 'Top Products & Categories Table',
    category: 'Table',
    description: 'Sales table with product breakdown',
    expanded: false
  },
  {
    id: 'sessions-metrics',
    element: 'Sessions Metrics Cards',
    category: 'Metric Cards',
    description: 'Total Sessions, Class Size, Fill Rate, Revenue cards',
    expanded: false
  },
  {
    id: 'sessions-table',
    element: 'Class Schedule & Attendance Table',
    category: 'Table',
    description: 'Sessions table with class details',
    expanded: false
  },
  {
    id: 'clients-metrics',
    element: 'Client Metrics Cards',
    category: 'Metric Cards',
    description: 'New Members, Converted, Retained, Conversion Rate cards',
    expanded: false
  },
  {
    id: 'clients-table',
    element: 'Client Retention Table',
    category: 'Table',
    description: 'Client retention by type pivot table',
    expanded: false
  },
  {
    id: 'trainers-cards',
    element: 'Top Trainers Cards',
    category: 'Card Grid',
    description: 'Trainer performance cards with rating, sessions, revenue',
    expanded: false
  },
  {
    id: 'leads-metrics',
    element: 'Lead Metrics Cards',
    category: 'Metric Cards',
    description: 'Total Leads, Conversion Rate, Trial Status cards',
    expanded: false
  },
  {
    id: 'leads-table',
    element: 'Leads by Source Table',
    category: 'Table',
    description: 'Lead breakdown by source with conversion rates',
    expanded: false
  },
  {
    id: 'discounts-metrics',
    element: 'Discount Metrics Cards',
    category: 'Metric Cards',
    description: 'Total Discounts, Count, Average Discount cards',
    expanded: false
  },
  {
    id: 'discounts-table',
    element: 'Discounts by Category Table',
    category: 'Table',
    description: 'Discount breakdown by category',
    expanded: false
  },
  {
    id: 'cancellations-metrics',
    element: 'Late Cancellations Metrics',
    category: 'Metric Cards',
    description: 'Cancellation count, rate, impact level cards',
    expanded: false
  },
  {
    id: 'cancellations-table',
    element: 'Cancellations Table',
    category: 'Table',
    description: 'Cancellation breakdown by time period',
    expanded: false
  },
  {
    id: 'expirations-metrics',
    element: 'Membership Expirations Metrics',
    category: 'Metric Cards',
    description: 'Expiring soon, at risk, critical cards',
    expanded: false
  },
  {
    id: 'expirations-table',
    element: 'Expirations Details Table',
    category: 'Table',
    description: 'Expiration details and recovery opportunities',
    expanded: false
  },
  {
    id: 'month-on-month',
    element: 'Complete Month-On-Month History',
    category: 'Table',
    description: 'Historical metrics across all months (independent of filters)',
    expanded: false
  }
];

export const ExecutiveFeedbackPanel: React.FC = () => {
  const [items, setItems] = useState<FeedbackItem[]>(FEEDBACK_ITEMS);
  const [showPanel, setShowPanel] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const toggleExpanded = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, expanded: !item.expanded } : item
    ));
  };

  const updateFeedback = (id: string, feedback: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, feedback } : item
    ));
  };

  const exportFeedback = () => {
    const feedbackText = items
      .filter(item => item.feedback)
      .map(item => `${item.element}\n${item.category}\n${item.feedback}\n---\n`)
      .join('\n');
    // Copy feedback to clipboard (non-blocking) and show a small status message
    if (feedbackText.trim().length === 0) {
      setStatusMessage('No feedback to export');
      setTimeout(() => setStatusMessage(null), 2500);
      return;
    }

    try {
      navigator.clipboard?.writeText(feedbackText);
      setStatusMessage('Feedback copied to clipboard');
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (e) {
      // Fallback: silently fail without blocking UI
      setStatusMessage('Unable to copy feedback');
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  if (!showPanel) {
    return (
      <Button
        onClick={() => setShowPanel(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700"
      >
        📋 Feedback Panel
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-y-auto bg-white rounded-lg shadow-2xl border border-slate-300">
      <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
        <h3 className="font-bold text-lg">Executive Dashboard Feedback</h3>
        <Button
          onClick={() => setShowPanel(false)}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-blue-800"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-3">
        {items.map((item) => (
          <Card key={item.id} className="border-slate-200">
            <div
              onClick={() => toggleExpanded(item.id)}
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-slate-800">{item.element}</h4>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{item.description}</p>
              </div>
              {item.expanded ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </div>

            {item.expanded && (
              <CardContent className="pt-0 pb-3">
                <textarea
                  value={item.feedback || ''}
                  onChange={(e) => updateFeedback(item.id, e.target.value)}
                  placeholder="Enter your feedback here..."
                  className="w-full p-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <div className="text-xs text-slate-400 mt-2">
                  {item.feedback ? `${item.feedback.length} characters` : 'No feedback yet'}
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        <div className="flex gap-2 pt-4 border-t border-slate-200">
          <Button
            onClick={exportFeedback}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Export Feedback
          </Button>
          <Button
            onClick={() => {
              setItems(FEEDBACK_ITEMS);
              setStatusMessage('Feedback cleared');
              setTimeout(() => setStatusMessage(null), 2000);
            }}
            variant="outline"
            className="flex-1"
          >
            Clear All
          </Button>
        </div>

        {statusMessage && (
          <div className="text-sm text-center text-slate-700 p-2">{statusMessage}</div>
        )}

        <div className="text-xs text-slate-500 p-2 bg-slate-50 rounded">
          <strong>Instructions:</strong> Click on each element to expand and enter your feedback. Click "Export Feedback" when done to see all feedback at once.
        </div>
      </div>
    </div>
  );
};

export default ExecutiveFeedbackPanel;
