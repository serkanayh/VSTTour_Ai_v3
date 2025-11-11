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

  // ==================== AI ANALYSIS ====================

  async analyzeProcess(processId: string, userId: string) {
    // Verify process exists and user has access
    const process = await this.prisma.process.findUnique({
      where: { id: processId },
      include: {
        versions: {
          where: { version: 1 },
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

    // Get process steps
    const version = process.versions[0];
    if (!version) {
      throw new BadRequestException('Process version not found');
    }

    const sopData: any = version.sopJson || { steps: [] };
    const steps = sopData.steps || [];

    if (steps.length === 0) {
      return {
        analysis: {
          overall: 'No steps defined yet. Please add process steps first.',
          issues: [],
          suggestions: [],
        },
      };
    }

    // Build analysis prompt
    const stepsDescription = steps.map((step: any, index: number) => {
      let desc = `${index + 1}. ${step.title}\n   Description: ${step.description || 'N/A'}`;
      if (step.subSteps && step.subSteps.length > 0) {
        desc += `\n   Sub-steps:`;
        step.subSteps.forEach((subStep: any, subIndex: number) => {
          desc += `\n   ${index + 1}.${subIndex + 1}. ${subStep.title} - ${subStep.description || 'N/A'}`;
        });
      }
      return desc;
    }).join('\n\n');

    const analysisPrompt = `
Analyze the following business process steps and identify:
1. Missing or incomplete steps
2. Ambiguous or unclear descriptions
3. Steps that lack necessary sub-steps
4. Potential bottlenecks or inefficiencies
5. Missing error handling or edge cases
6. Steps that need more detail

Process Name: ${process.processName}
Process Description: ${process.description || 'N/A'}

Current Steps:
${stepsDescription}

Please provide:
1. An overall assessment
2. A list of specific issues found (with step numbers)
3. Concrete suggestions for improvement

Format your response as JSON:
{
  "overall": "overall assessment text",
  "issues": [
    {"stepNumber": 1, "issue": "description of issue"},
    ...
  ],
  "suggestions": [
    {"stepNumber": 1, "suggestion": "specific suggestion"},
    ...
  ]
}
`;

    try {
      const systemPrompt = await this.getSystemPrompt();
      const aiResponse = await this.openAiService.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: analysisPrompt },
      ]);

      // Try to parse JSON response
      const analysis = this.extractStructuredData(aiResponse);

      if (!analysis) {
        // If not JSON, return as plain text
        return {
          analysis: {
            overall: aiResponse,
            issues: [],
            suggestions: [],
          },
        };
      }

      return { analysis };
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw new BadRequestException('Failed to analyze process');
    }
  }

  // ==================== CONVERSATION MANAGEMENT ====================

  async getOrCreateConversation(processId: string, userId: string) {
    // Try to find existing conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        processId,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Create new conversation if doesn't exist
    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          processId,
          userId,
        },
        include: {
          messages: true,
        },
      });
    }

    return conversation;
  }

  async sendMessage(
    processId: string,
    userId: string,
    userMessage: string,
  ) {
    // Verify process exists and user has access
    const process = await this.prisma.process.findUnique({
      where: { id: processId },
      include: {
        versions: {
          where: { version: 1 },
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

    // Get or create conversation
    const conversation = await this.getOrCreateConversation(processId, userId);

    // Save user message
    await this.prisma.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: userMessage,
      },
    });

    // Build conversation history for AI
    const messages = conversation.messages.map(msg => ({
      role: msg.role.toLowerCase() as 'system' | 'user' | 'assistant',
      content: msg.content,
    }));

    // Add new user message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    // Get system prompt
    const systemPrompt = await this.getSystemPrompt();

    // Get process steps for context
    const version = process.versions[0];
    const sopData: any = version?.sopJson || { steps: [] };
    const steps = sopData.steps || [];

    // Build context-aware prompt
    const contextPrompt = `
Process: ${process.processName}
Current Steps: ${steps.length} steps defined
${steps.map((s: any, i: number) => `${i + 1}. ${s.title}${s.subSteps?.length ? ` (${s.subSteps.length} sub-steps)` : ''}`).join('\n')}

User is asking about improving or analyzing this process. Provide helpful insights and ask clarifying questions.
`;

    // Call AI with full context
    try {
      const aiResponse = await this.openAiService.chat([
        { role: 'system', content: systemPrompt },
        { role: 'system', content: contextPrompt },
        ...messages,
      ]);

      // Save AI response
      await this.prisma.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: aiResponse,
        },
      });

      return {
        message: aiResponse,
        conversationId: conversation.id,
      };
    } catch (error) {
      console.error('AI Error:', error);
      throw new BadRequestException('Failed to get AI response');
    }
  }

  async getConversationHistory(processId: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        processId,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return { messages: [] };
    }

    return {
      conversationId: conversation.id,
      messages: conversation.messages.map(msg => ({
        id: msg.id,
        role: msg.role.toLowerCase(),
        content: msg.content,
        createdAt: msg.createdAt,
      })),
    };
  }

  async clearConversation(processId: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        processId,
        userId,
      },
    });

    if (conversation) {
      await this.prisma.conversation.delete({
        where: { id: conversation.id },
      });
    }

    return { message: 'Conversation cleared successfully' };
  }
}
