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

  async initialize() {
    if (this.initialized) return;
    
    try {
      // @ts-ignore - WebLLM types
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
      
      // Use a small model suitable for mobile devices
      this.engine = await CreateMLCEngine(
        "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
        {
          initProgressCallback: (progress: any) => {
            console.log('LLM Loading:', progress.text);
          }
        }
      );
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize WebLLM:', error);
      throw new Error('Failed to initialize local LLM. Your device may not support WebGPU.');
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

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  async generateCompletion(messages: LLMMessage[]): Promise<string> {
    try {
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
        throw new Error('Ollama request failed');
      }

      const data = await response.json();
      return data.message?.content || '';
    } catch (error) {
      console.error('Ollama error:', error);
      throw new Error('Failed to connect to Ollama. Make sure it\'s running at ' + this.baseUrl);
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
