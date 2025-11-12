import { Module } from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { IntegrationController } from './integration.controller';
import { N8nService } from './services/n8n.service';

@Module({
  controllers: [IntegrationController],
  providers: [IntegrationService, N8nService],
  exports: [IntegrationService],
})
export class IntegrationModule {}
