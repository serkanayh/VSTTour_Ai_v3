import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAiService } from './services/openai.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { ChatInputDto } from './dto/chat-input.dto';
import { StartFormDto } from './dto/start-form.dto';

@Injectable()
export class AiOrchestratorService {
  constructor(
    @InjectQueue('ai-queue') private aiQueue: Queue,
    private prisma: PrismaService,
    private openAiService: OpenAiService,
    private promptBuilder: PromptBuilderService,
  ) {}

  async startProcessForm(startFormDto: StartFormDto, userId: string) {
    // Create a new process in draft state
    const process = await this.prisma.process.create({
      data: {
        processName: startFormDto.processName,
        description: startFormDto.description,
        createdById: userId,
        departmentId: startFormDto.departmentId,
      },
    });

    // Generate initial AI prompt
    const systemPrompt = await this.getSystemPrompt();
    const initialPrompt = this.promptBuilder.buildInitialPrompt(startFormDto);

    return {
      processId: process.id,
      message: 'Process started. AI will guide you through the documentation.',
      aiPrompt: initialPrompt,
    };
  }

  async handleChatInput(chatInputDto: ChatInputDto, userId: string) {
    const { processId, userMessage, conversationHistory } = chatInputDto;

    // Verify process exists and user has access
    const process = await this.prisma.process.findUnique({
      where: { id: processId },
    });

    if (!process) {
      throw new BadRequestException('Process not found');
    }

    if (process.createdById !== userId) {
      throw new BadRequestException('You do not have access to this process');
    }

    // Build prompt with conversation context
    const systemPrompt = await this.getSystemPrompt();
    const messages = this.promptBuilder.buildConversationMessages(
      systemPrompt,
      conversationHistory,
      userMessage,
    );

    // Check if this should be async (>5s expected)
    const isComplexTask = this.shouldRunAsync(userMessage);

    if (isComplexTask) {
      // Add to queue for async processing
      const job = await this.aiQueue.add('process-ai-task', {
        processId,
        userId,
        messages,
      });

      return {
        jobId: job.id,
        status: 'processing',
        message: 'Your request is being processed. You will be notified when complete.',
      };
    }

    // Process synchronously for quick responses
    try {
      const aiResponse = await this.openAiService.chat(messages);

      // Extract structured data if present
      const structuredData = this.extractStructuredData(aiResponse);

      // Update process with new information if provided
      if (structuredData) {
        await this.updateProcessFromAiResponse(processId, structuredData);
      }

      return {
        response: aiResponse,
        structuredData,
        status: 'completed',
      };
    } catch (error) {
      // Try fallback model
      try {
        const fallbackResponse = await this.openAiService.chatWithFallback(messages);
        return {
          response: fallbackResponse,
          status: 'completed',
          usedFallback: true,
        };
      } catch (fallbackError) {
        throw new BadRequestException('AI service error: ' + fallbackError.message);
      }
    }
  }

  private async getSystemPrompt(): Promise<string> {
    const config = await this.prisma.aiConfiguration.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return (
      config?.systemPrompt ||
      `You are an AI assistant helping to document business processes in a structured SOP format.
Your goal is to ask clarifying questions to understand:
1. The exact steps of the process
2. Time taken for each step
3. Frequency of the task
4. Any pain points or manual steps
5. Data privacy concerns (KVKK compliance)
6. Automation potential

Be conversational but focused. Extract actionable information for process automation.`
    );
  }

  private shouldRunAsync(message: string): boolean {
    // Heuristic: long messages or complex keywords suggest longer processing
    const asyncKeywords = ['generate', 'analyze', 'detailed', 'comprehensive', 'report'];
    const hasAsyncKeyword = asyncKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword),
    );
    return message.length > 500 || hasAsyncKeyword;
  }

  private extractStructuredData(aiResponse: string): any {
    // Try to extract JSON from response
    try {
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Try to parse if entire response is JSON
      return JSON.parse(aiResponse);
    } catch {
      return null;
    }
  }

  private async updateProcessFromAiResponse(processId: string, data: any) {
    const updateData: any = {};

    if (data.frequency !== undefined) updateData.frequency = data.frequency;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.costPerHour !== undefined) updateData.costPerHour = data.costPerHour;
    if (data.automationScore !== undefined) updateData.automationScore = data.automationScore;

    if (Object.keys(updateData).length > 0) {
      await this.prisma.process.update({
        where: { id: processId },
        data: updateData,
      });
    }
  }

  async generateSOP(processId: string, userId: string) {
    const process = await this.prisma.process.findUnique({
      where: { id: processId },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!process) {
      throw new BadRequestException('Process not found');
    }

    if (process.createdById !== userId) {
      throw new BadRequestException('You do not have access to this process');
    }

    // Get conversation history or form data
    const latestVersion = process.versions[0];
    const formData = latestVersion?.formData || {};

    // Build SOP generation prompt
    const sopPrompt = this.promptBuilder.buildSOPGenerationPrompt(process, formData);

    // Generate SOP
    const sopResponse = await this.openAiService.chat([
      { role: 'system', content: await this.getSystemPrompt() },
      { role: 'user', content: sopPrompt },
    ]);

    // Parse SOP JSON
    const sopJson = this.extractStructuredData(sopResponse);

    if (!sopJson) {
      throw new BadRequestException('Failed to generate valid SOP structure');
    }

    // Create new process version with SOP
    const newVersion = await this.prisma.processVersion.create({
      data: {
        processId: process.id,
        version: (latestVersion?.version || 0) + 1,
        sopJson: sopJson,
        formData: formData,
        createdById: userId,
      },
    });

    // Update process current version
    await this.prisma.process.update({
      where: { id: processId },
      data: {
        currentVersion: newVersion.version,
      },
    });

    return {
      message: 'SOP generated successfully',
      version: newVersion.version,
      sop: sopJson,
    };
  }
}
