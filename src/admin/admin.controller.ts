import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateAiConfigDto } from './dto/create-ai-config.dto';
import { UpdateAiConfigDto } from './dto/update-ai-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('ai-config')
  @ApiOperation({ summary: 'Create AI configuration (Admin only)' })
  @ApiResponse({ status: 201, description: 'Configuration created' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  create(
    @Body() createDto: CreateAiConfigDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.adminService.createAiConfiguration(createDto, userId, role);
  }

  @Get('ai-config')
  @ApiOperation({ summary: 'Get all AI configurations (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of configurations' })
  findAll(@CurrentUser('role') role: string) {
    return this.adminService.getAllConfigurations(role);
  }

  @Get('ai-config/:id')
  @ApiOperation({ summary: 'Get AI configuration by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Configuration found' })
  findOne(@Param('id') id: string, @CurrentUser('role') role: string) {
    return this.adminService.getConfigurationById(id, role);
  }

  @Patch('ai-config/:id')
  @ApiOperation({ summary: 'Update AI configuration (Admin only)' })
  @ApiResponse({ status: 200, description: 'Configuration updated' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAiConfigDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.adminService.updateConfiguration(id, updateDto, userId, role);
  }

  @Delete('ai-config/:id')
  @ApiOperation({ summary: 'Delete AI configuration (Admin only)' })
  @ApiResponse({ status: 200, description: 'Configuration deleted' })
  remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.adminService.deleteConfiguration(id, userId, role);
  }

  @Post('ai-config/:id/activate')
  @ApiOperation({ summary: 'Set active AI configuration (Admin only)' })
  @ApiResponse({ status: 200, description: 'Configuration activated' })
  setActive(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.adminService.setActiveConfiguration(id, userId, role);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get system statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'System stats returned' })
  getStats(@CurrentUser('role') role: string) {
    return this.adminService.getSystemStats(role);
  }
}
