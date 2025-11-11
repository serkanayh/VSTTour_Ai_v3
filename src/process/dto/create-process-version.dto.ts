import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject } from 'class-validator';

export class CreateProcessVersionDto {
  @ApiProperty({ example: 'process-uuid-here' })
  @IsString()
  processId: string;

  @ApiProperty({
    example: {
      steps: [
        { order: 1, action: 'Login to ERP system', estimatedTime: 30 },
        { order: 2, action: 'Navigate to expense module', estimatedTime: 15 },
        { order: 3, action: 'Upload invoice file', estimatedTime: 120 },
      ],
    },
  })
  @IsObject()
  sopJson: any;

  @ApiProperty({
    example: {
      frequency: 12,
      duration: 7,
      costPerHour: 120,
      hasPersonalData: true,
    },
  })
  @IsObject()
  formData: any;
}
