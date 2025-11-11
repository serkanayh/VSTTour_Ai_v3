import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { AiOrchestratorController } from './ai-orchestrator.controller';
import { OpenAiService } from './services/openai.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { AiQueueProcessor } from './processors/ai-queue.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ai-queue',
    }),
  ],
  controllers: [AiOrchestratorController],
  providers: [AiOrchestratorService, OpenAiService, PromptBuilderService, AiQueueProcessor],
  exports: [AiOrchestratorService, OpenAiService],
})
export class AiOrchestratorModule {}
