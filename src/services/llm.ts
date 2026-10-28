import { UserProfile } from '../types';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMService {
  generateRecipe: (prompt: string) => Promise<string>;
  analyzeMeal: (mealDescription: string) => Promise<string>;
  suggestMealPlan: (preferences: string) => Promise<string>;
}

// WebLLM implementation (browser-based)
class WebLLMService implements LLMService {
  private engine: any = null;
  private initialized = false;
  private initializing = false;
  private initError: string | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializing) {
      // Wait for ongoing initialization
      while (this.initializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }
    
    this.initializing = true;
    
    try {
      // Check WebGPU support
      if (!(navigator as any).gpu) {
        throw new Error('WebGPU is not supported on this device. Please use Chrome 113+ on a compatible device, or switch to Ollama.');
      }

      // @ts-ignore - WebLLM types
      const { CreateMLCEngine, prebuiltAppConfig } = await import('@mlc-ai/web-llm');
      
      // Use a smaller, more compatible model
      // Phi-2 is smaller and works better on mobile
      const modelId = "Phi-2-q4f16_1-MLC";
      
      console.log('🦦 Initializing WebLLM with model:', modelId);
      
      this.engine = await CreateMLCEngine(
        modelId,
        {
          initProgressCallback: (progress: any) => {
            console.log('🦦 LLM Loading:', progress.text, `${(progress.progress * 100).toFixed(1)}%`);
          }
        }
      );
      
      this.initialized = true;
      this.initError = null;
      console.log('✅ WebLLM initialized successfully');
    } catch (error: any) {
      console.error('❌ Failed to initialize WebLLM:', error);
      this.initError = error.message || 'Unknown error';
      throw new Error(`WebLLM initialization failed: ${this.initError}`);
    } finally {
      this.initializing = false;
    }
  }

  async generateCompletion(messages: LLMMessage[]): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const response = await this.engine.chat.completions.create({
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('LLM generation error:', error);
      throw new Error('Failed to generate response');
    }
  }

  async generateRecipe(prompt: string): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful nutrition and recipe assistant. Generate recipes in JSON format with fields: name, description, ingredients (array), instructions (array), prepTime (minutes), cookTime (minutes), servings, category (breakfast/lunch/dinner/snack/dessert), tags (array), emoji.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return await this.generateCompletion(messages);
  }

  async analyzeMeal(mealDescription: string): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'You are a nutrition expert. Analyze the meal and provide nutritional insights, health benefits, and suggestions.'
      },
      {
        role: 'user',
        content: mealDescription
      }
    ];

    return await this.generateCompletion(messages);
  }

  async suggestMealPlan(preferences: string): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'You are a meal planning expert. Create a weekly meal plan based on user preferences.'
      },
      {
        role: 'user',
        content: preferences
      }
    ];

    return await this.generateCompletion(messages);
  }
}

// Ollama implementation (local server)
class OllamaService implements LLMService {
  private baseUrl: string;
  private tested = false;
  private connectionError: string | null = null;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  async testConnection(): Promise<boolean> {
    if (this.tested) {
      return this.connectionError === null;
    }

    try {
      console.log('🦦 Testing Ollama connection at:', this.baseUrl);
      
      // Test with a simple tags request
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Ollama connection successful. Available models:', data.models?.map((m: any) => m.name).join(', ') || 'none');
      
      this.tested = true;
      this.connectionError = null;
      return true;
    } catch (error: any) {
      console.error('❌ Ollama connection failed:', error);
      
      let errorMessage = 'Failed to connect to Ollama';
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage = `Cannot reach Ollama at ${this.baseUrl}. Make sure Ollama is running and CORS is enabled.`;
      } else if (error.message.includes('CORS')) {
        errorMessage = `CORS error: Ollama needs to be started with OLLAMA_ORIGINS="*" environment variable.`;
      } else {
        errorMessage = `${errorMessage}: ${error.message}`;
      }
      
      this.tested = true;
      this.connectionError = errorMessage;
      throw new Error(errorMessage);
    }
  }

  async generateCompletion(messages: LLMMessage[]): Promise<string> {
    // Test connection first
    await this.testConnection();

    try {
      console.log('🦦 Sending request to Ollama...');
      
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3.2', // or mistral, phi, etc.
          messages,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.message?.content || '';
      
      if (!content) {
        throw new Error('Empty response from Ollama');
      }
      
      console.log('✅ Ollama response received');
      return content;
    } catch (error: any) {
      console.error('❌ Ollama generation error:', error);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        throw new Error(`Connection error: Make sure Ollama is running at ${this.baseUrl} with CORS enabled (OLLAMA_ORIGINS="*")`);
      }
      
      throw new Error(`Ollama error: ${error.message}`);
    }
  }

  async generateRecipe(prompt: string): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful nutrition and recipe assistant. Generate recipes in JSON format with fields: name, description, ingredients (array), instructions (array), prepTime (minutes), cookTime (minutes), servings, category (breakfast/lunch/dinner/snack/dessert), tags (array), emoji.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return await this.generateCompletion(messages);
  }

  async analyzeMeal(mealDescription: string): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'You are a nutrition expert. Analyze the meal and provide nutritional insights, health benefits, and suggestions.'
      },
      {
        role: 'user',
        content: mealDescription
      }
    ];

    return await this.generateCompletion(messages);
  }

  async suggestMealPlan(preferences: string): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'You are a meal planning expert. Create a weekly meal plan based on user preferences.'
      },
      {
        role: 'user',
        content: preferences
      }
    ];

    return await this.generateCompletion(messages);
  }
}

// Factory function to create appropriate LLM service
export function createLLMService(profile: UserProfile): LLMService | null {
  if (!profile.llmEnabled) {
    return null;
  }

  if (profile.llmProvider === 'ollama' && profile.ollamaUrl) {
    return new OllamaService(profile.ollamaUrl);
  }

  if (profile.llmProvider === 'web-llm') {
    return new WebLLMService();
  }

  return null;
}

// Test Ollama connection
export async function testOllamaConnection(url: string = 'http://localhost:11434'): Promise<{ success: boolean; message: string; models?: string[] }> {
  try {
    const response = await fetch(`${url}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, message: `HTTP ${response.status}` };
    }

    const data = await response.json();
    const models = data.models?.map((m: any) => m.name) || [];
    
    return { 
      success: true, 
      message: `Connected successfully. ${models.length} model(s) available.`,
      models
    };
  } catch (error: any) {
    let message = 'Connection failed';
    
    if (error.message.includes('Failed to fetch')) {
      message = `Cannot reach Ollama at ${url}. Is Ollama running?`;
    } else if (error.message.includes('CORS')) {
      message = 'CORS error: Start Ollama with OLLAMA_ORIGINS="*" environment variable';
    } else {
      message = error.message;
    }
    
    return { success: false, message };
  }
}

// Web search service for recipes
export async function searchWebRecipes(query: string): Promise<any[]> {
  // Using DuckDuckGo Instant Answer API (no API key required)
  try {
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' recipe')}&format=json&no_html=1`
    );
    
    const data = await response.json();
    
    // Extract relevant results
    const results = data.RelatedTopics?.filter((topic: any) => topic.FirstURL) || [];
    
    return results.slice(0, 10).map((topic: any) => ({
      title: topic.Text,
      url: topic.FirstURL,
      snippet: topic.Text
    }));
  } catch (error) {
    console.error('Web search error:', error);
    return [];
  }
}
