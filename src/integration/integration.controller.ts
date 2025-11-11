import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationService } from './integration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('integration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integration')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Post('export/:processId/n8n')
  @ApiOperation({ summary: 'Export process to n8n workflow format' })
  @ApiResponse({ status: 200, description: 'Process exported successfully' })
  @ApiResponse({ status: 403, description: 'Process not approved' })
  @ApiResponse({ status: 500, description: 'Conversion error' })
  exportToN8n(@Param('processId') processId: string, @CurrentUser('userId') userId: string) {
    return this.integrationService.exportToN8n(processId, userId);
  }

  @Post('export/:processId/json')
  @ApiOperation({ summary: 'Export process to JSON format' })
  @ApiResponse({ status: 200, description: 'Process exported successfully' })
  exportToJSON(@Param('processId') processId: string, @CurrentUser('userId') userId: string) {
    return this.integrationService.exportToJSON(processId, userId);
  }

  @Get('export/:exportId')
  @ApiOperation({ summary: 'Get export by ID' })
  @ApiResponse({ status: 200, description: 'Export record returned' })
  @ApiResponse({ status: 404, description: 'Export not found' })
  getExport(@Param('exportId') exportId: string) {
    return this.integrationService.getExportById(exportId);
  }

  @Get('exports/:processId')
  @ApiOperation({ summary: 'Get all exports for a process' })
  @ApiResponse({ status: 200, description: 'List of exports returned' })
  getAllExports(@Param('processId') processId: string) {
    return this.integrationService.getAllExports(processId);
  }
}
