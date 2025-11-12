import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminService } from '../../admin/admin.service';
import axios from 'axios';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class OpenAiService {
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(
    private configService: ConfigService,
    private adminService: AdminService,
  ) {}

  private async getActiveConfig() {
    const config = await this.adminService.getActiveConfiguration();

    if (!config || !config.apiKey) {
      // Fallback to .env if no active config
      const envApiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!envApiKey || envApiKey === 'your-openai-api-key-here') {
        throw new ServiceUnavailableException('OpenAI API key not configured');
      }
      return {
        apiKey: envApiKey,
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
      };
    }

    return {
      apiKey: config.apiKey,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    };
  }

  async chat(messages: ChatMessage[], temperature?: number): Promise<string> {
    const config = await this.getActiveConfig();

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: config.model,
          messages: messages,
          temperature: temperature ?? config.temperature,
          max_tokens: config.maxTokens,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          timeout: 30000, // 30 seconds timeout
        },
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error.response?.data || error.message);
      throw new ServiceUnavailableException('AI service temporarily unavailable');
    }
  }

  async chatWithFallback(messages: ChatMessage[]): Promise<string> {
    const config = await this.getActiveConfig();

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: config.model,
          messages: messages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          timeout: 30000,
        },
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI Fallback API Error:', error.response?.data || error.message);
      throw new ServiceUnavailableException('AI service completely unavailable');
    }
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    // Placeholder for STT integration (Whisper API)
    // This would be implemented when audio input is needed
    throw new Error('Audio transcription not yet implemented');
  }
}
