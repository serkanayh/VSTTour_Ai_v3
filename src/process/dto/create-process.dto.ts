import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateProcessDto {
  @ApiProperty({ example: 'Expense Report Upload' })
  @IsString()
  processName: string;

  @ApiProperty({ example: 'Process for uploading expense reports to ERP system', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 12, description: 'Tasks per day', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  frequency?: number;

  @ApiProperty({ example: 7, description: 'Minutes per task', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  duration?: number;

  @ApiProperty({ example: 120, description: 'Cost per hour (TRY)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  costPerHour?: number;

  @ApiProperty({ example: 9, description: 'Automation score (0-10)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10)
  automationScore?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  departmentId?: string;
}
