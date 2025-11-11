import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class CreateAiConfigDto {
  @ApiProperty({ example: 'OpenAI GPT-4 Configuration' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'openai', description: 'AI provider: openai, azure, google' })
  @IsString()
  provider: string;

  @ApiProperty({ example: 'sk-...' })
  @IsString()
  apiKey: string;

  @ApiProperty({ example: 'gpt-4' })
  @IsString()
  model: string;

  @ApiProperty({ example: 'gpt-3.5-turbo', required: false })
  @IsString()
  @IsOptional()
  fallbackModel?: string;

  @ApiProperty({
    example: 'You are an AI assistant helping to document business processes...',
  })
  @IsString()
  systemPrompt: string;

  @ApiProperty({ example: 2000, default: 2000 })
  @IsNumber()
  @IsOptional()
  @Min(100)
  @Max(4000)
  maxTokens?: number;

  @ApiProperty({ example: 0.7, default: 0.7 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  modelMapping?: any;
}
