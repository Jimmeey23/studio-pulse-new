import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as sharedClient } from '@/lib/supabaseClient';
import { SummaryResult } from './openaiService';

// Database types
export interface StoredSummary {
  id: string;
  context: string;
  location_id: string;
  summary: string;
  key_insights: string[];
  trends: string[];
  recommendations: string[];
  data_quality_score: number;
  data_quality_issues: string[];
  data_snapshot: {
    totalRows: number;
    columnsAnalyzed: number;
    keyMetrics: Record<string, any>;
  };
  filters_applied: Record<string, any>;
  date_range: {
    start: string;
    end: string;
  } | null;
  created_at: string;
  updated_at: string;
  data_hash: string; // To detect when underlying data changes
}

class SupabaseService {
  private client: SupabaseClient;
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

    if (!sharedClient) {
      console.warn('Supabase credentials not configured. Summary persistence will be unavailable.');
      return;
    }

    this.client = sharedClient as SupabaseClient;
  }

  /**
   * Save a generated summary to the database
   */
  async saveSummary(
    context: string,
    locationId: string,
    summary: SummaryResult,
    filters?: Record<string, any>,
    dateRange?: { start: string; end: string }
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Supabase service not initialized' };
    }

    try {
      const dataHash = this.generateDataHash(summary.dataSnapshot, filters, dateRange);
      
      const summaryData: Omit<StoredSummary, 'id' | 'created_at' | 'updated_at'> = {
        context,
        location_id: locationId,
        summary: summary.summary,
        key_insights: summary.keyInsights,
        trends: summary.trends,
        recommendations: summary.recommendations,
        data_quality_score: summary.dataQuality.score,
        data_quality_issues: summary.dataQuality.issues,
        data_snapshot: summary.dataSnapshot,
        filters_applied: filters || {},
        date_range: dateRange || null,
        data_hash: dataHash
      };

      // Check if a similar summary already exists (same context, location, and data hash)
      const { data: existing } = await this.client
        .from('analytics_summaries')
        .select('id')
        .eq('context', context)
        .eq('location_id', locationId)
        .eq('data_hash', dataHash)
        .single();

      if (existing) {
        // Update existing summary
        const { data, error } = await this.client
          .from('analytics_summaries')
          .update({
            ...summaryData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select('id')
          .single();

        if (error) {
          console.error('Error updating summary:', error);
          return { success: false, error: error.message };
        }

        return { success: true, id: data.id };
      } else {
        // Create new summary
        const { data, error } = await this.client
          .from('analytics_summaries')
          .insert(summaryData)
          .select('id')
          .single();

        if (error) {
          console.error('Error saving summary:', error);
          return { success: false, error: error.message };
        }

        return { success: true, id: data.id };
      }
    } catch (error: any) {
      console.error('Supabase operation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Retrieve stored summaries for a given context and location
   */
  async getSummaries(
    context: string,
    locationId: string,
    limit: number = 5
  ): Promise<{ success: boolean; summaries?: StoredSummary[]; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Supabase service not initialized' };
    }

    try {
      const { data, error } = await this.client
        .from('analytics_summaries')
        .select('*')
        .eq('context', context)
        .eq('location_id', locationId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error retrieving summaries:', error);
        return { success: false, error: error.message };
      }

      return { success: true, summaries: data || [] };
    } catch (error: any) {
      console.error('Supabase operation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get the most recent summary for a context and location with matching filters
   */
  async getLatestSummary(
    context: string,
    locationId: string,
    filters?: Record<string, any>,
    dateRange?: { start: string; end: string }
  ): Promise<{ success: boolean; summary?: StoredSummary; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Supabase service not initialized' };
    }

    try {
      const dataHash = this.generateDataHash({}, filters, dateRange);
      
      const { data, error } = await this.client
        .from('analytics_summaries')
        .select('*')
        .eq('context', context)
        .eq('location_id', locationId)
        .eq('data_hash', dataHash)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return { success: true, summary: undefined };
        }
        console.error('Error retrieving latest summary:', error);
        return { success: false, error: error.message };
      }

      return { success: true, summary: data };
    } catch (error: any) {
      console.error('Supabase operation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a summary by ID
   */
  async deleteSummary(id: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Supabase service not initialized' };
    }

    try {
      const { error } = await this.client
        .from('analytics_summaries')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting summary:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Supabase operation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear all summaries for a specific context and location
   */
  async clearSummaries(
    context: string,
    locationId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Supabase service not initialized' };
    }

    try {
      const { error } = await this.client
        .from('analytics_summaries')
        .delete()
        .eq('context', context)
        .eq('location_id', locationId);

      if (error) {
        console.error('Error clearing summaries:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Supabase operation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate a hash for data to detect changes
   */
  private generateDataHash(
    dataSnapshot: any,
    filters?: Record<string, any>,
    dateRange?: { start: string; end: string }
  ): string {
    const hashInput = {
      dataSnapshot: {
        totalRows: dataSnapshot.totalRows || 0,
        columnsAnalyzed: dataSnapshot.columnsAnalyzed || 0
      },
      filters: filters || {},
      dateRange: dateRange || null
    };

    // Simple hash generation (in production, consider using a proper hash function)
    return btoa(JSON.stringify(hashInput))
      .replace(/[+/]/g, '')
      .substring(0, 32);
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Supabase service not initialized' };
    }

    try {
      const { error } = await this.client
        .from('analytics_summaries')
        .select('id')
        .limit(1);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize the database table (for setup)
   */
  async initializeTable(): Promise<{ success: boolean; error?: string }> {
    // Note: This would typically be done via Supabase dashboard or migration scripts
    // Including here for reference of the expected table structure
    
    const tableSQL = `
      CREATE TABLE IF NOT EXISTS analytics_summaries (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        context TEXT NOT NULL,
        location_id TEXT NOT NULL,
        summary TEXT NOT NULL,
        key_insights TEXT[] NOT NULL DEFAULT '{}',
        trends TEXT[] NOT NULL DEFAULT '{}',
        recommendations TEXT[] NOT NULL DEFAULT '{}',
        data_quality_score INTEGER DEFAULT 85,
        data_quality_issues TEXT[] NOT NULL DEFAULT '{}',
        data_snapshot JSONB NOT NULL DEFAULT '{}',
        filters_applied JSONB NOT NULL DEFAULT '{}',
        date_range JSONB,
        data_hash TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_analytics_summaries_context_location 
        ON analytics_summaries (context, location_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_summaries_data_hash 
        ON analytics_summaries (data_hash);
      CREATE INDEX IF NOT EXISTS idx_analytics_summaries_updated_at 
        ON analytics_summaries (updated_at DESC);
    `;

    // Table SQL is kept here for reference; do not log in production to avoid leaking schema details
    return { success: true };
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService();