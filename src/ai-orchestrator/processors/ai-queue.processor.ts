import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../services/openai.service';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('ai-queue')
@Injectable()
export class AiQueueProcessor extends WorkerHost {
  constructor(
    private openAiService: OpenAiService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { processId, userId, messages } = job.data;

    console.log(`Processing AI job ${job.id} for process ${processId}`);

    try {
      // Update job progress
      await job.updateProgress(25);

      // Call OpenAI
      const aiResponse = await this.openAiService.chat(messages);

      await job.updateProgress(75);

      // Store response in database or cache
      // You could create a separate table for AI responses or use Redis

      await job.updateProgress(100);

      console.log(`AI job ${job.id} completed successfully`);

      return {
        success: true,
        response: aiResponse,
        processId,
      };
    } catch (error) {
      console.error(`AI job ${job.id} failed:`, error.message);

      // Try fallback model
      try {
        const fallbackResponse = await this.openAiService.chatWithFallback(messages);
        return {
          success: true,
          response: fallbackResponse,
          processId,
          usedFallback: true,
        };
      } catch (fallbackError) {
        throw new Error(`AI processing failed: ${fallbackError.message}`);
      }
    }
  }
}
