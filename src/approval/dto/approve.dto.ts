import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ApproveDto {
  @ApiProperty({ example: 'Process looks good, approved for automation', required: false })
  @IsString()
  @IsOptional()
  comments?: string;
}
