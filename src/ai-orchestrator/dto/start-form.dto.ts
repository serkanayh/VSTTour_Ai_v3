import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class StartFormDto {
  @ApiProperty({ example: 'Expense Report Upload' })
  @IsString()
  processName: string;

  @ApiProperty({ example: 'Uploading expense reports to ERP system', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  departmentId?: string;
}
