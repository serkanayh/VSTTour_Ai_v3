import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApprovalService } from './approval.service';
import { ApproveDto } from './dto/approve.dto';
import { RejectDto } from './dto/reject.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('approval')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('approval')
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get('pending')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get pending approval requests (Manager/Admin only)' })
  @ApiResponse({ status: 200, description: 'List of pending approvals' })
  getPendingApprovals(@CurrentUser('userId') userId: string, @CurrentUser('role') role: string) {
    return this.approvalService.getPendingApprovals(userId, role);
  }

  @Post('request/:processId')
  @ApiOperation({ summary: 'Request approval for a process' })
  @ApiResponse({ status: 201, description: 'Approval request created' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  requestApproval(@Param('processId') processId: string, @CurrentUser('userId') userId: string) {
    return this.approvalService.createApprovalRequest(processId, userId);
  }

  @Post('approve/:approvalId')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve a process (Manager/Admin only)' })
  @ApiResponse({ status: 200, description: 'Process approved' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  approve(
    @Param('approvalId') approvalId: string,
    @Body() approveDto: ApproveDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.approvalService.approveProcess(approvalId, approveDto, userId);
  }

  @Post('reject/:approvalId')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject a process (Manager/Admin only)' })
  @ApiResponse({ status: 200, description: 'Process rejected' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  reject(
    @Param('approvalId') approvalId: string,
    @Body() rejectDto: RejectDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.approvalService.rejectProcess(approvalId, rejectDto, userId);
  }

  @Get('history/:processId')
  @ApiOperation({ summary: 'Get approval history for a process' })
  @ApiResponse({ status: 200, description: 'Approval history returned' })
  getHistory(@Param('processId') processId: string) {
    return this.approvalService.getApprovalHistory(processId);
  }
}
