import { PartialType } from '@nestjs/swagger';
import { CreateAiConfigDto } from './create-ai-config.dto';

export class UpdateAiConfigDto extends PartialType(CreateAiConfigDto) {}
