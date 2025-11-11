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
}
