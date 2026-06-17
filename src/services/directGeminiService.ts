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
  private apiKey: string;
  private baseUrl: string;
  private modelId: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    this.modelId = 'gemini-flash-latest'; // Matching your bash reference
    
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your environment variables.');
    }
  }

  async generateContent(prompt: string): Promise<string> {
    const requestBody: GeminiRequest = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2048,
        thinkingConfig: {
          thinkingBudget: -1
        }
      }
    };

    try {
      const response = await fetch(
        `${this.baseUrl}/${this.modelId}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

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