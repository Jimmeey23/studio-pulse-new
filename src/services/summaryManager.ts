import { openaiService, SummaryGenerationOptions, SummaryResult } from './openaiService';
import { supabaseService, StoredSummary } from './supabaseService';

export interface SummaryManagerOptions {
  context: string;
  locationId: string;
  data: any[];
  tableName?: string;
  activeFilters?: Record<string, any>;
  dateRange?: {
    start: string;
    end: string;
  };
  forceRegenerate?: boolean;
}

export interface SummaryManagerResult {
  success: boolean;
  summary?: SummaryResult;
  storedSummary?: StoredSummary;
  error?: string;
  fromCache?: boolean;
}

class SummaryManagerService {
  private cache: Map<string, { summary: SummaryResult; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

  /**
   * Generate or retrieve a summary for the given context and data
   */
  async generateSummary(options: SummaryManagerOptions): Promise<SummaryManagerResult> {
    const { context, locationId, data, tableName, activeFilters, dateRange, forceRegenerate = false } = options;

    // Generate cache key
    const cacheKey = this.generateCacheKey(context, locationId, activeFilters, dateRange);

    // Check in-memory cache first (for immediate responses)
    if (!forceRegenerate) {
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        return {
          success: true,
          summary: cachedResult,
          fromCache: true
        };
      }

      // Check Supabase for stored summary
      try {
        const { success, summary: storedSummary } = await supabaseService.getLatestSummary(
          context,
          locationId,
          activeFilters,
          dateRange
        );

        if (success && storedSummary) {
          // Convert stored summary back to SummaryResult format
          const summaryResult: SummaryResult = {
            summary: storedSummary.summary,
            keyInsights: storedSummary.key_insights,
            trends: storedSummary.trends,
            recommendations: storedSummary.recommendations,
            dataQuality: {
              score: storedSummary.data_quality_score,
              issues: storedSummary.data_quality_issues
            },
            lastGenerated: storedSummary.updated_at,
            dataSnapshot: storedSummary.data_snapshot
          };

          // Cache the result
          this.setCache(cacheKey, summaryResult);

          return {
            success: true,
            summary: summaryResult,
            storedSummary,
            fromCache: true
          };
        }
      } catch (error) {
        console.warn('Failed to retrieve stored summary:', error);
      }
    }

    // Generate new summary using OpenAI
    try {
      const generationOptions: SummaryGenerationOptions = {
        data,
        context,
        locationId,
        tableName,
        activeFilters,
        dateRange
      };

      const summaryResult = await openaiService.generateSummary(generationOptions);

      // Cache the result immediately
      this.setCache(cacheKey, summaryResult);

      // Store in Supabase for persistence (async, don't wait)
      this.storeSummaryAsync(context, locationId, summaryResult, activeFilters, dateRange);

      return {
        success: true,
        summary: summaryResult,
        fromCache: false
      };

    } catch (error: any) {
      console.error('Summary generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all stored summaries for a context and location
   */
  async getSummariesHistory(
    context: string,
    locationId: string,
    limit: number = 10
  ): Promise<{ success: boolean; summaries?: StoredSummary[]; error?: string }> {
    return await supabaseService.getSummaries(context, locationId, limit);
  }

  /**
   * Delete a specific summary
   */
  async deleteSummary(summaryId: string): Promise<{ success: boolean; error?: string }> {
    const result = await supabaseService.deleteSummary(summaryId);
    
    // Clear related cache entries
    if (result.success) {
      this.clearCache();
    }

    return result;
  }

  /**
   * Clear all summaries for a context and location
   */
  async clearAllSummaries(
    context: string,
    locationId: string
  ): Promise<{ success: boolean; error?: string }> {
    const result = await supabaseService.clearSummaries(context, locationId);
    
    // Clear cache
    if (result.success) {
      this.clearCache();
    }

    return result;
  }

  /**
   * Test if all services are properly configured
   */
  async testServices(): Promise<{
    openai: { success: boolean; error?: string };
    supabase: { success: boolean; error?: string };
  }> {
    const [openaiResult, supabaseResult] = await Promise.allSettled([
      openaiService.testConnection(),
      supabaseService.testConnection()
    ]);

    return {
      openai: openaiResult.status === 'fulfilled' ? openaiResult.value : { success: false, error: 'Service unavailable' },
      supabase: supabaseResult.status === 'fulfilled' ? supabaseResult.value : { success: false, error: 'Service unavailable' }
    };
  }

  /**
   * Store summary in Supabase asynchronously
   */
  private async storeSummaryAsync(
    context: string,
    locationId: string,
    summary: SummaryResult,
    filters?: Record<string, any>,
    dateRange?: { start: string; end: string }
  ): Promise<void> {
    try {
      await supabaseService.saveSummary(context, locationId, summary, filters, dateRange);
    } catch (error) {
      console.warn('Failed to store summary in database:', error);
    }
  }

  /**
   * Generate cache key from context and filters
   */
  private generateCacheKey(
    context: string,
    locationId: string,
    filters?: Record<string, any>,
    dateRange?: { start: string; end: string }
  ): string {
    const keyData = {
      context,
      locationId,
      filters: filters || {},
      dateRange: dateRange || null
    };
    
    return btoa(JSON.stringify(keyData)).replace(/[+/]/g, '').substring(0, 32);
  }

  /**
   * Get summary from in-memory cache
   */
  private getFromCache(key: string): SummaryResult | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if cache has expired
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached.summary;
  }

  /**
   * Set summary in in-memory cache
   */
  private setCache(key: string, summary: SummaryResult): void {
    this.cache.set(key, {
      summary,
      timestamp: Date.now()
    });

    // Clean up old cache entries periodically
    if (this.cache.size > 50) {
      this.cleanupCache();
    }
  }

  /**
   * Clear all cache entries
   */
  private clearCache(): void {
    this.cache.clear();
  }

  /**
   * Remove expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics (for debugging)
   */
  getCacheStats(): {
    size: number;
    keys: string[];
    oldestEntry?: number;
    newestEntry?: number;
  } {
    const timestamps = Array.from(this.cache.values()).map(v => v.timestamp);
    
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : undefined,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : undefined
    };
  }
}

// Export singleton instance
export const summaryManager = new SummaryManagerService();