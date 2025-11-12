import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { ProcessStatus } from '@prisma/client';

export class CreateProcessDto {
  @ApiProperty({ example: 'Expense Report Upload' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Process for uploading expense reports to ERP system', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Finance', required: false })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ example: 60, description: 'Estimated time in minutes', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedTimeMinutes?: number;

  @ApiProperty({ example: 12, description: 'Tasks per day', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  tasksPerDay?: number;

  @ApiProperty({ example: 7, description: 'Minutes per task', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minutesPerTask?: number;

  @ApiProperty({ example: 120, description: 'Cost per hour', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  costPerHour?: number;

  @ApiProperty({ enum: ProcessStatus, default: ProcessStatus.DRAFT, required: false })
  @IsEnum(ProcessStatus)
  @IsOptional()
  status?: ProcessStatus;
}
