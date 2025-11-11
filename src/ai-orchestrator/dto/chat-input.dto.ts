import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional } from 'class-validator';

export class ChatInputDto {
  @ApiProperty({ example: 'process-uuid-here' })
  @IsString()
  processId: string;

  @ApiProperty({ example: 'We manually input invoices into the system' })
  @IsString()
  userMessage: string;

  @ApiProperty({
    required: false,
    example: [
      { role: 'assistant', content: 'Can you describe the first step?' },
      { role: 'user', content: 'First, we log into the ERP system' },
    ],
  })
  @IsArray()
  @IsOptional()
  conversationHistory?: Array<{ role: string; content: string }>;
}
