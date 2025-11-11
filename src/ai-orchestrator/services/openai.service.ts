import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class OpenAiService {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly fallbackModel: string;
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4';
    this.fallbackModel = this.configService.get<string>('OPENAI_FALLBACK_MODEL') || 'gpt-3.5-turbo';
  }

  async chat(messages: ChatMessage[], temperature: number = 0.7): Promise<string> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: messages,
          temperature: temperature,
          max_tokens: 2000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
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
    if (!this.apiKey) {
      throw new ServiceUnavailableException('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.fallbackModel,
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
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
