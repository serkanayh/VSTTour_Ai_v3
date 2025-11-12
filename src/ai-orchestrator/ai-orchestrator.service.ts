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
      `Sen iş süreçlerini yapılandırılmış SOP formatında belgelemeye yardımcı olan bir AI asistanısın.

ÖNEMLİ KURALLAR:
1. HER SEFERINDE SADECE BİR ADIM HAKKINDA SORU SOR
2. Kullanıcı cevap verene kadar diğer adıma geçme
3. Bir adımı tamamen anladıktan SONRA "Harika, bu adımı anladım. Şimdi bir sonraki adıma geçelim..." de
4. Tüm soruları tek seferde sormak yerine, doğal bir sohbet gibi adım adım ilerle
5. Her adım için topla bu bilgileri:
   - Hangi araçlar/sistemler kullanılıyor
   - Ne kadar süre harcıyor
   - Ne sıklıkla yapılıyor
   - Manuel mi otomatik mi
   - KVKK/veri gizliliği var mı
   - Hangi sorunlar yaşanıyor

ÖRNEK İYİ KONUŞMA:
AI: "İlk adımınız Juniper login. Bu adımda tam olarak ne yapıyorsunuz?"
Kullanıcı: "Juniper sistemine giriş yapıyorum, kullanıcı adı ve şifre giriyorum"
AI: "Anladım. Bu giriş işlemi ortalama ne kadar sürüyor?"
Kullanıcı: "Yaklaşık 2 dakika"
AI: "Teşekkürler. Günde kaç kez giriş yapıyorsunuz?"
Kullanıcı: "Günde bir kez, sabahleyin"
AI: "Harika, bu adımı anladım. Şimdi ikinci adıma geçelim - Günlük Booking listesi çekme. Bu adımda nasıl bir işlem yapıyorsunuz?"

KÖTÜ ÖRNEK (BUNU YAPMA):
AI: "Tüm adımlar için şu soruları cevaplayın: 1. Juniper için..., 2. Booking için..., 3. Excel için..."

IMPORTANT: Tüm yanıtlarını TÜRKÇE olarak ver. Sabırlı ve yardımsever ol. Doğal bir konuşma akışı kur.`
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
IMPORTANT: You MUST respond in Turkish language. Tüm yanıtlarınız Türkçe olmalıdır.

Aşağıdaki iş sürecini analiz edin ve şunları belirleyin:
1. Eksik veya tamamlanmamış adımlar
2. Belirsiz veya açık olmayan açıklamalar
3. Alt adımlara ihtiyaç duyan adımlar
4. Potansiyel darboğazlar veya verimsizlikler
5. Eksik hata yönetimi veya uç durumlar
6. Daha fazla detaya ihtiyaç duyan adımlar

Süreç Adı: ${process.processName}
Süreç Açıklaması: ${process.description || 'Belirtilmemiş'}

Mevcut Adımlar:
${stepsDescription}

Lütfen aşağıdakileri sağlayın:
1. Genel bir değerlendirme
2. Bulunan spesifik sorunların listesi (adım numaraları ile)
3. İyileştirme için somut öneriler

IMPORTANT: Yanıtınızı TÜRKÇE olarak JSON formatında verin:
{
  "overall": "genel değerlendirme metni (TÜRKÇE)",
  "issues": [
    {"stepNumber": 1, "issue": "sorun açıklaması (TÜRKÇE)"},
    ...
  ],
  "suggestions": [
    {"stepNumber": 1, "suggestion": "öneri açıklaması (TÜRKÇE)"},
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

  async applySuggestion(
    processId: string,
    userId: string,
    stepNumber: number,
    suggestion: string,
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

    // Get current step data
    const version = process.versions[0];
    if (!version) {
      throw new BadRequestException('Process version not found');
    }

    const sopData: any = version.sopJson || { steps: [] };
    const steps = sopData.steps || [];
    const targetStep = steps.find((s: any) => s.order === stepNumber);

    if (!targetStep) {
      throw new BadRequestException(`Step ${stepNumber} not found`);
    }

    // Build prompt for AI to provide structured update
    const applyPrompt = `
IMPORTANT: Yanıtınızı TÜRKÇE olarak ve JSON formatında verin.

Aşağıdaki iyileştirme önerisini yapılandırılmış bir güncelleme olarak dönüştürün:

Süreç: ${process.processName}
Adım Numarası: ${stepNumber}
Mevcut Adım Başlığı: ${targetStep.title}
Mevcut Adım Açıklaması: ${targetStep.description || 'Yok'}
Mevcut Alt Adımlar: ${targetStep.subSteps ? JSON.stringify(targetStep.subSteps) : 'Yok'}

İyileştirme Önerisi: ${suggestion}

Bu öneriyi uygulamak için hangi değişiklikler yapılmalı? Lütfen aşağıdaki JSON formatında yanıt verin:

\`\`\`json
{
  "action": "update_step" | "add_substeps" | "update_description" | "update_title",
  "changes": {
    "title": "yeni başlık (sadece title değişiyorsa)",
    "description": "yeni veya güncellenmiş açıklama (TÜRKÇE)",
    "estimatedMinutes": 15,
    "newSubSteps": [
      {
        "title": "Alt adım başlığı (TÜRKÇE)",
        "description": "Alt adım açıklaması (TÜRKÇE)",
        "estimatedMinutes": 5
      }
    ]
  },
  "explanation": "Bu değişikliklerin neden yapıldığının açıklaması (TÜRKÇE)"
}
\`\`\`

NOT: Sadece öneriyle ilgili alanları değiştirin. Örneğin sadece açıklama güncelleniyorsa, sadece "description" alanını ekleyin.
`;

    try {
      const systemPrompt = await this.getSystemPrompt();
      const aiResponse = await this.openAiService.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: applyPrompt },
      ]);

      // Try to parse JSON response
      const structuredUpdate = this.extractStructuredData(aiResponse);

      if (!structuredUpdate) {
        throw new BadRequestException('AI could not generate structured update');
      }

      return {
        stepNumber,
        currentStep: targetStep,
        suggestedUpdate: structuredUpdate,
        originalSuggestion: suggestion,
      };
    } catch (error) {
      console.error('Apply Suggestion Error:', error);
      throw new BadRequestException('Failed to generate structured update');
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
