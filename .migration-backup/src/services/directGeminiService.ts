// Alternative Gemini service using direct fetch API calls to match the bash reference

interface GeminiRequest {
  contents: Array<{
    role: string;
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
    thinkingConfig?: {
      thinkingBudget?: number;
    };
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

export class DirectGeminiService {
  private modelId: string;

  constructor() {
    this.modelId = 'gemini-1.5-flash';
  }

  async generateContent(prompt: string): Promise<string> {
    const requestBody: GeminiRequest = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2048,
      }
    };

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.modelId, body: requestBody })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data: GeminiResponse = await response.json();
      
      if (data.error) {
        throw new Error(`Gemini API Error: ${data.error.message} (Code: ${data.error.code})`);
      }

      if (data.candidates && data.candidates.length > 0) {
        const content = data.candidates[0].content;
        if (content.parts && content.parts.length > 0) {
          return content.parts[0].text;
        }
      }

      throw new Error('No content generated');

    } catch (error) {
      console.error('Direct Gemini API call failed:', error);
      throw error;
    }
  }

  async testConnection(): Promise<{ success: boolean; model?: string; error?: string }> {
    try {
      const result = await this.generateContent("Hello, please respond with 'Connection successful'");
      return {
        success: true,
        model: this.modelId,
      };
    } catch (error: any) {
      console.error('Connection test failed:', error);
      return {
        success: false,
        error: error?.message || 'Connection failed'
      };
    }
  }
}

// Export singleton instance for testing
export const directGeminiService = new DirectGeminiService();