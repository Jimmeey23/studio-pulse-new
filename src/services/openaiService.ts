// Types
export interface SummaryGenerationOptions {
  data: any[];
  context: string;
  locationId: string;
  tableName?: string;
  activeFilters?: Record<string, any>;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SummaryResult {
  summary: string;
  keyInsights: string[];
  trends: string[];
  recommendations: string[];
  dataQuality: {
    score: number;
    issues: string[];
  };
  lastGenerated: string;
  dataSnapshot: {
    totalRows: number;
    columnsAnalyzed: number;
    keyMetrics: Record<string, any>;
  };
}

class OpenAIService {
  constructor() {}

  async generateSummary(options: SummaryGenerationOptions): Promise<SummaryResult> {
    const prompt = this.buildPrompt(options);
    
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a senior business intelligence analyst specializing in fitness and wellness analytics. 
            You provide deep, actionable insights from business data with a focus on contextual awareness and strategic recommendations.
            Always respond in valid JSON format with the exact structure specified.`
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 2000,
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw Object.assign(new Error(err.error?.message || `API error ${response.status}`), { status: response.status });
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response received from OpenAI');
      }

      const parsed = JSON.parse(content);
      
      // Validate and structure the response
      return {
        summary: parsed.summary || 'No summary available',
        keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [],
        trends: Array.isArray(parsed.trends) ? parsed.trends : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        dataQuality: {
          score: parsed.dataQuality?.score || 85,
          issues: Array.isArray(parsed.dataQuality?.issues) ? parsed.dataQuality.issues : []
        },
        lastGenerated: new Date().toISOString(),
        dataSnapshot: {
          totalRows: options.data.length,
          columnsAnalyzed: Object.keys(options.data[0] || {}).length,
          keyMetrics: this.extractKeyMetrics(options.data)
        }
      };

    } catch (error: any) {
      console.error('OpenAI API error:', error);
      
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      } else if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few moments.');
      } else if (error.status === 403) {
        throw new Error('API access denied. Please check your OpenAI account and billing.');
      }
      
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  private buildPrompt(options: SummaryGenerationOptions): string {
    const { data, context, locationId, tableName, activeFilters, dateRange } = options;
    
    const dataPreview = JSON.stringify(data.slice(0, 10), null, 2);
    const totalRecords = data.length;
    const columns = Object.keys(data[0] || {});
    
    let filtersDescription = '';
    if (activeFilters && Object.keys(activeFilters).length > 0) {
      filtersDescription = `\n\n**ACTIVE FILTERS:**\n${JSON.stringify(activeFilters, null, 2)}`;
    }

    let dateRangeDescription = '';
    if (dateRange && dateRange.start && dateRange.end) {
      dateRangeDescription = `\n**DATE RANGE:** ${dateRange.start} to ${dateRange.end}`;
    }

    return `
**BUSINESS CONTEXT:**
- Business: Physique 57 (Premium Fitness Chain)
- Location: ${locationId === 'all' ? 'All Locations' : locationId}
- Analysis Section: ${context}
- Dataset: ${tableName || context}
- Total Records: ${totalRecords}
- Columns Available: ${columns.join(', ')}${dateRangeDescription}${filtersDescription}

**DATA PREVIEW:**
${dataPreview}

**ANALYSIS REQUIREMENTS:**
Generate a comprehensive business intelligence analysis in JSON format with this exact structure:

{
  "summary": "A detailed 2-3 sentence executive summary of the current business situation based on the filtered data",
  "keyInsights": [
    "3-5 specific, quantified insights from the data",
    "Focus on trends, patterns, and notable findings",
    "Include specific numbers and percentages where relevant"
  ],
  "trends": [
    "3-4 trend observations with business implications",
    "Compare current performance against expectations",
    "Highlight seasonal patterns or unusual variations"
  ],
  "recommendations": [
    "3-5 specific, actionable recommendations",
    "Prioritize high-impact, implementable suggestions",
    "Include expected outcomes where possible"
  ],
  "dataQuality": {
    "score": 85,
    "issues": ["List any data quality concerns if found"]
  }
}

**ANALYSIS FOCUS:**
- Be contextually aware of the fitness industry and business model
- Consider seasonal patterns typical in fitness businesses
- Focus on financial performance, customer behavior, and operational efficiency
- Provide specific, actionable insights rather than generic observations
- Use business terminology appropriate for executive audiences
- Reference the applied filters in your analysis to show contextual awareness

**IMPORTANT:** Respond ONLY with valid JSON. No additional text or formatting.
    `;
  }

  private extractKeyMetrics(data: any[]): Record<string, any> {
    if (!data.length) return {};

    const metrics: Record<string, any> = {
      totalRecords: data.length
    };

    // Extract common numeric fields and calculate basic statistics
    const numericFields = Object.keys(data[0] || {}).filter(key => {
      const value = data[0][key];
      return typeof value === 'number' || (!isNaN(parseFloat(value)) && isFinite(parseFloat(value)));
    });

    numericFields.forEach(field => {
      const values = data
        .map(item => parseFloat(item[field]))
        .filter(val => !isNaN(val));
      
      if (values.length > 0) {
        metrics[field] = {
          total: values.reduce((sum, val) => sum + val, 0),
          average: values.reduce((sum, val) => sum + val, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values)
        };
      }
    });

    return metrics;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test connection. Respond with just "OK".' }],
          max_tokens: 10
        }),
      });
      if (!response.ok) return { success: false, error: `HTTP ${response.status}` };
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();