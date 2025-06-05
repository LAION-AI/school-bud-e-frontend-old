export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  content: string;
  role: 'assistant';
}

export interface GameState {
  id: string;
  code: string;
  name: string;
  points: number;
  createdAt: string;
}

class ApiService {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = 'https://next.bud-e.ai', apiKey: string = '') {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  updateConfig(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  async sendChatMessage(messages: ChatMessage[], language: 'en' | 'de' = 'en', systemPrompt: string = ''): Promise<any> {
    try {
      const requestBody = {
        lang: language,
        messages: messages,
        universalApiKey: this.apiKey,
        universalShopApiKey: "",
        llmApiUrl: '',
        llmApiKey: '',
        llmApiModel: '',
        vlmApiUrl: '',
        vlmApiKey: '',
        vlmApiModel: '',
        vlmCorrectionModel: '',
        systemPrompt: systemPrompt,
      };

      const fullUrl = `${this.baseUrl}/api/chat`;
      
      console.log('🚀 API Request URL:', fullUrl);
      console.log('📦 API Request Payload:', JSON.stringify(requestBody, null, 2));
      console.log('🔑 Shop API Key:', this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'EMPTY');

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 API Response Status:', response.status);
      console.log('📡 API Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      console.log('📡 Response body exists:', !!response.body);
      console.log('📡 Response body type:', typeof response.body);
      
      // For React Native, we need to handle the case where response.body is null
      // Let's first check if we have a valid shop API key
      if (!this.apiKey || this.apiKey.trim() === '') {
        throw new Error('Shop API key is required for chat functionality');
      }
      
      // React Native doesn't support streaming, so read the full response and parse it
      console.log('🔄 React Native: Reading full response and parsing SSE format');
      const responseText = await response.text();
      console.log('📡 Response text length:', responseText.length);
      console.log('📡 Response text preview:', responseText.substring(0, 200));
      
      // Parse the server-sent events and return structured data
      return this.parseServerSentEvents(responseText);
    } catch (error) {
      console.error('❌ Error sending chat message:', error);
      throw error;
    }
  }

  private parseServerSentEvents(responseText: string): { chunks: string[] } {
    const lines = responseText.split('\n');
    const chunks: string[] = [];
    
    console.log('🔍 Parsing SSE with', lines.length, 'lines');
    
    for (const line of lines) {
      if (line.startsWith('data:')) {
        const dataContent = line.substring(5).trim(); // Remove 'data:' prefix and trim
        
        if (dataContent && dataContent !== '[DONE]') {
          try {
            // Try to parse as JSON
            const parsed = JSON.parse(dataContent);
            if (typeof parsed === 'string' && parsed.length > 0) {
              chunks.push(parsed);
              console.log('📄 Parsed chunk:', parsed);
            }
          } catch (e) {
            // If not JSON, treat as plain text
            if (dataContent.length > 0) {
              chunks.push(dataContent);
              console.log('📄 Raw chunk:', dataContent);
            }
          }
        }
      }
    }
    
    console.log('✅ Parsed', chunks.length, 'chunks total');
    return { chunks };
  }

  async transcribePdf(pdfFile: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);

      const response = await fetch(`${this.baseUrl}/api/transcribe-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error('Error transcribing PDF:', error);
      throw error;
    }
  }

  async searchBildungsplan(query: string, topN: number = 5): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bildungsplan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          top_n: topN,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching Bildungsplan:', error);
      throw error;
    }
  }

  async searchWikipedia(query: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/wikipedia?query=${encodeURIComponent(query)}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching Wikipedia:', error);
      throw error;
    }
  }

  async createGame(code: string, name: string, points: number = 0): Promise<GameState> {
    try {
      const response = await fetch(`${this.baseUrl}/api/game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          name,
          points,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.game;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  }

  async updateGame(id: string, code?: string, points?: number): Promise<GameState> {
    try {
      const response = await fetch(`${this.baseUrl}/api/game`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          ...(code && { code }),
          ...(points !== undefined && { points }),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.game;
    } catch (error) {
      console.error('Error updating game:', error);
      throw error;
    }
  }

  async getGames(): Promise<GameState[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/game`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting games:', error);
      throw error;
    }
  }

  async deleteGame(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/game?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting game:', error);
      throw error;
    }
  }

  async textToSpeech(text: string, language: 'en' | 'de' = 'en'): Promise<Blob> {
    try {
      console.log('🔊 TTS Request for text:', text.substring(0, 50) + '...');
      console.log('🔊 TTS Language:', language);
      console.log('🔊 TTS URL:', `${this.baseUrl}/api/tts`);
      
      const requestBody = {
        text,
        lang: language,
        shopApiKey: this.apiKey, // Add shop API key like chat endpoint
      };
      
      console.log('🔊 TTS Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${this.baseUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('🔊 TTS Response status:', response.status);
      console.log('🔊 TTS Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ TTS Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const blob = await response.blob();
      console.log('🔊 TTS Blob size:', blob.size, 'type:', blob.type);
      return blob;
    } catch (error) {
      console.error('❌ Error with text-to-speech:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
export default ApiService; 