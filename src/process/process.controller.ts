import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProcessService } from './process.service';
import { ProcessVersionService } from './process-version.service';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';
import { CreateProcessVersionDto } from './dto/create-process-version.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('process')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('process')
export class ProcessController {
  constructor(
    private readonly processService: ProcessService,
    private readonly processVersionService: ProcessVersionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new process' })
  @ApiResponse({ status: 201, description: 'Process created successfully' })
  create(@Body() createProcessDto: CreateProcessDto, @CurrentUser('userId') userId: string) {
    return this.processService.create(createProcessDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all processes' })
  @ApiResponse({ status: 200, description: 'List of processes returned' })
  findAll(@CurrentUser('userId') userId: string, @CurrentUser('role') role: string) {
    return this.processService.findAll(userId, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get process by ID' })
  @ApiResponse({ status: 200, description: 'Process found' })
  @ApiResponse({ status: 404, description: 'Process not found' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.processService.findOne(id, userId, role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update process' })
  @ApiResponse({ status: 200, description: 'Process updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateProcessDto: UpdateProcessDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.processService.update(id, updateProcessDto, userId, role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete process' })
  @ApiResponse({ status: 200, description: 'Process deleted successfully' })
  remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.processService.remove(id, userId, role);
  }

  @Get(':id/roi')
  @ApiOperation({ summary: 'Calculate ROI for process' })
  @ApiResponse({ status: 200, description: 'ROI calculated' })
  calculateROI(@Param('id') id: string) {
    return this.processService.calculateROI(id);
  }

  @Post(':id/submit-approval')
  @ApiOperation({ summary: 'Submit process for approval' })
  @ApiResponse({ status: 200, description: 'Process submitted for approval' })
  submitForApproval(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.processService.submitForApproval(id, userId);
  }

  // Process Version endpoints
  @Post('version')
  @ApiOperation({ summary: 'Create a new process version' })
  @ApiResponse({ status: 201, description: 'Version created successfully' })
  createVersion(
    @Body() createVersionDto: CreateProcessVersionDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.processVersionService.create(createVersionDto, userId);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get all versions of a process' })
  @ApiResponse({ status: 200, description: 'List of versions returned' })
  findAllVersions(@Param('id') processId: string) {
    return this.processVersionService.findAllByProcess(processId);
  }

  @Get(':id/versions/:version')
  @ApiOperation({ summary: 'Get specific version of a process' })
  @ApiResponse({ status: 200, description: 'Version found' })
  findOneVersion(@Param('id') processId: string, @Param('version') version: string) {
    return this.processVersionService.findOne(processId, parseInt(version));
  }

  // Process Steps endpoints
  @Get(':id/steps')
  @ApiOperation({ summary: 'Get all steps of a process' })
  @ApiResponse({ status: 200, description: 'List of steps returned' })
  getProcessSteps(
    @Param('id') processId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.processService.getProcessSteps(processId, userId, role);
  }

  @Post(':id/steps')
  @ApiOperation({ summary: 'Add a new step to process' })
  @ApiResponse({ status: 201, description: 'Step added successfully' })
  addProcessStep(
    @Param('id') processId: string,
    @Body() stepData: { title: string; description: string; estimatedMinutes?: number },
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.processService.addProcessStep(processId, stepData, userId, role);
  }

  @Patch(':id/steps/:stepId')
  @ApiOperation({ summary: 'Update a process step' })
  @ApiResponse({ status: 200, description: 'Step updated successfully' })
  updateProcessStep(
    @Param('id') processId: string,
    @Param('stepId') stepId: string,
    @Body() stepData: { title?: string; description?: string; estimatedMinutes?: number },
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.processService.updateProcessStep(processId, stepId, stepData, userId, role);
  }

  @Delete(':id/steps/:stepId')
  @ApiOperation({ summary: 'Delete a process step' })
  @ApiResponse({ status: 200, description: 'Step deleted successfully' })
  deleteProcessStep(
    @Param('id') processId: string,
    @Param('stepId') stepId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.processService.deleteProcessStep(processId, stepId, userId, role);
  }

  @Post(':id/steps/reorder')
  @ApiOperation({ summary: 'Reorder process steps' })
  @ApiResponse({ status: 200, description: 'Steps reordered successfully' })
  reorderProcessSteps(
    @Param('id') processId: string,
    @Body() body: { stepIds: string[] },
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.processService.reorderProcessSteps(processId, body.stepIds, userId, role);
  }

  // ==================== SUB-STEP ENDPOINTS ====================

  @Post(':id/steps/:stepId/substeps')
  @ApiOperation({ summary: 'Add a sub-step to a step' })
  @ApiResponse({ status: 201, description: 'Sub-step added successfully' })
  addSubStep(
    @Param('id') processId: string,
    @Param('stepId') stepId: string,
    @Body() subStepData: { title: string; description: string; estimatedMinutes?: number },
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.processService.addSubStep(processId, stepId, subStepData, userId, role);
  }

  @Patch(':id/steps/:stepId/substeps/:subStepId')
  @ApiOperation({ summary: 'Update a sub-step' })
  @ApiResponse({ status: 200, description: 'Sub-step updated successfully' })
  updateSubStep(
    @Param('id') processId: string,
    @Param('stepId') stepId: string,
    @Param('subStepId') subStepId: string,
    @Body() subStepData: { title?: string; description?: string; estimatedMinutes?: number },
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.processService.updateSubStep(processId, stepId, subStepId, subStepData, userId, role);
  }

  @Delete(':id/steps/:stepId/substeps/:subStepId')
  @ApiOperation({ summary: 'Delete a sub-step' })
  @ApiResponse({ status: 200, description: 'Sub-step deleted successfully' })
  deleteSubStep(
    @Param('id') processId: string,
    @Param('stepId') stepId: string,
    @Param('subStepId') subStepId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.processService.deleteSubStep(processId, stepId, subStepId, userId, role);
  }
}
