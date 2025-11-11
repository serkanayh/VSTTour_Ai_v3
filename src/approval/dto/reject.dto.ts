import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RejectDto {
  @ApiProperty({ example: 'Process needs more details in step 3' })
  @IsString()
  comments: string;
}
