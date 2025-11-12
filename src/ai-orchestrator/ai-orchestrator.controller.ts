import { Controller, Post, Body, UseGuards, Get, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { ChatInputDto } from './dto/chat-input.dto';
import { StartFormDto } from './dto/start-form.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-orchestrator')
export class AiOrchestratorController {
  constructor(private readonly aiOrchestratorService: AiOrchestratorService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new process documentation session with AI' })
  @ApiResponse({ status: 201, description: 'Process session started' })
  @ApiResponse({ status: 400, description: 'Missing data' })
  startForm(@Body() startFormDto: StartFormDto, @CurrentUser('userId') userId: string) {
    return this.aiOrchestratorService.startProcessForm(startFormDto, userId);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Send chat message to AI for process documentation' })
  @ApiResponse({ status: 200, description: 'AI response returned' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @ApiResponse({ status: 503, description: 'AI service error' })
  chatInput(@Body() chatInputDto: ChatInputDto, @CurrentUser('userId') userId: string) {
    return this.aiOrchestratorService.handleChatInput(chatInputDto, userId);
  }

  @Post('generate-steps/:processId')
  @ApiOperation({ summary: 'Generate process steps from conversation history' })
  @ApiResponse({ status: 200, description: 'Steps generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid process or insufficient data' })
  generateSteps(
    @Param('processId') processId: string,
    @Body() body: { conversationHistory: Array<{ role: string; content: string }> },
    @CurrentUser('userId') userId: string,
  ) {
    return this.aiOrchestratorService.generateStepsFromConversation(
      processId,
      body.conversationHistory,
      userId,
    );
  }

  @Post(':id/generate-sop')
  @ApiOperation({ summary: 'Generate SOP document for process' })
  @ApiResponse({ status: 200, description: 'SOP generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid process or insufficient data' })
  generateSOP(@Param('id') processId: string, @CurrentUser('userId') userId: string) {
    return this.aiOrchestratorService.generateSOP(processId, userId);
  }

  @Post(':id/analyze')
  @ApiOperation({ summary: 'Analyze process steps with AI to find issues and improvements' })
  @ApiResponse({ status: 200, description: 'Analysis completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid process or no steps defined' })
  analyzeProcess(@Param('id') processId: string, @CurrentUser('userId') userId: string) {
    return this.aiOrchestratorService.analyzeProcess(processId, userId);
  }

  // ==================== CONVERSATION ENDPOINTS ====================

  @Post(':id/conversation/message')
  @ApiOperation({ summary: 'Send a message in process conversation with AI' })
  @ApiResponse({ status: 200, description: 'Message sent and AI response received' })
  @ApiResponse({ status: 400, description: 'Invalid process or access denied' })
  sendMessage(
    @Param('id') processId: string,
    @Body() body: { message: string },
    @CurrentUser('userId') userId: string,
  ) {
    return this.aiOrchestratorService.sendMessage(processId, userId, body.message);
  }

  @Get(':id/conversation/history')
  @ApiOperation({ summary: 'Get conversation history for a process' })
  @ApiResponse({ status: 200, description: 'Conversation history returned' })
  getConversationHistory(
    @Param('id') processId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.aiOrchestratorService.getConversationHistory(processId, userId);
  }

  @Delete(':id/conversation')
  @ApiOperation({ summary: 'Clear conversation history for a process' })
  @ApiResponse({ status: 200, description: 'Conversation cleared successfully' })
  clearConversation(
    @Param('id') processId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.aiOrchestratorService.clearConversation(processId, userId);
  }
}
