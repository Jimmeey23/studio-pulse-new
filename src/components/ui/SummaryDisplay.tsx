import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  TrendingUp, 
  Lightbulb, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  Trash2,
  History,
  RefreshCw,
  Star
} from 'lucide-react';
import { SummaryResult } from '@/services/openaiService';
import { StoredSummary } from '@/services/supabaseService';
import { formatDistanceToNow } from 'date-fns';

interface SummaryDisplayProps {
  summary: SummaryResult | StoredSummary;
  isLoading?: boolean;
  onRegenerate?: () => void;
  onDelete?: () => void;
  onViewHistory?: () => void;
  showActions?: boolean;
  variant?: 'default' | 'compact';
  fromCache?: boolean;
}

export const SummaryDisplay: React.FC<SummaryDisplayProps> = ({
  summary,
  isLoading = false,
  onRegenerate,
  onDelete,
  onViewHistory,
  showActions = true,
  variant = 'default',
  fromCache = false
}) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm text-gray-600">Generating AI insights...</span>
        </div>
        
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          </div>
        ))}
      </motion.div>
    );
  }

  const getSummaryData = (summary: SummaryResult | StoredSummary) => {
    if ('key_insights' in summary) {
      // StoredSummary format
      return {
        summary: summary.summary,
        keyInsights: summary.key_insights,
        trends: summary.trends,
        recommendations: summary.recommendations,
        dataQuality: {
          score: summary.data_quality_score,
          issues: summary.data_quality_issues
        },
        lastGenerated: summary.updated_at,
        dataSnapshot: summary.data_snapshot
      };
    } else {
      // SummaryResult format
      return summary;
    }
  };

  const data = getSummaryData(summary);
  const isCompact = variant === 'compact';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* Header with Actions */}
        {showActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between pb-3 border-b"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <h3 className="font-semibold text-gray-900">AI Insights</h3>
              {fromCache && (
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Cached
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {onViewHistory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onViewHistory}
                  className="h-8 w-8 p-0"
                  title="View History"
                >
                  <History className="h-4 w-4" />
                </Button>
              )}
              {onRegenerate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerate}
                  className="h-8 w-8 p-0"
                  title="Regenerate Summary"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                  title="Delete Summary"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Summary Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className={isCompact ? "p-4" : "p-6"}>
              <p className="text-gray-800 leading-relaxed">
                {data.summary}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Key Insights */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className={isCompact ? "pb-3" : "pb-4"}>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 text-yellow-500" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent className={isCompact ? "pt-0" : "pt-0"}>
              <div className="space-y-3">
                {data.keyInsights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400"
                  >
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-800">{insight}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trends */}
        {data.trends && data.trends.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader className={isCompact ? "pb-3" : "pb-4"}>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Trends & Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className={isCompact ? "pt-0" : "pt-0"}>
                <div className="space-y-3">
                  {data.trends.map((trend, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400"
                    >
                      <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-800">{trend}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader className={isCompact ? "pb-3" : "pb-4"}>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className={isCompact ? "pt-0" : "pt-0"}>
                <div className="space-y-3">
                  {data.recommendations.map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400"
                    >
                      <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-800">{rec}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Data Quality & Metadata */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span>Data Quality:</span>
              <Badge 
                variant={data.dataQuality.score >= 90 ? "default" : data.dataQuality.score >= 70 ? "secondary" : "destructive"}
                className="text-xs"
              >
                {data.dataQuality.score}%
              </Badge>
            </div>
            
            <div className="flex items-center gap-1">
              <span>Records:</span>
              <span className="font-medium">{data.dataSnapshot.totalRows}</span>
            </div>

            {data.dataQuality.issues.length > 0 && (
              <div className="flex items-center gap-1 text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                <span>{data.dataQuality.issues.length} issues</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              {formatDistanceToNow(new Date(data.lastGenerated), { addSuffix: true })}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};