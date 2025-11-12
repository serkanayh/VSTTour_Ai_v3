import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalStatus, ProcessStatus, UserRole } from '@prisma/client';
import { ApproveDto } from './dto/approve.dto';
import { RejectDto } from './dto/reject.dto';
import { NotificationService } from './services/notification.service';

@Injectable()
export class ApprovalService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async getPendingApprovals(userId: string, userRole: string) {
    // Only managers and admins can see pending approvals
    if (userRole !== UserRole.MANAGER && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only managers and admins can view approvals');
    }

    const processes = await this.prisma.process.findMany({
      where: {
        status: ProcessStatus.WAITING_APPROVAL,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        department: true,
        approvals: {
          where: {
            status: ApprovalStatus.PENDING,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return processes;
  }

  async createApprovalRequest(processId: string, userId: string) {
    const process = await this.prisma.process.findUnique({
      where: { id: processId },
      include: {
        createdBy: true,
        department: true,
      },
    });

    if (!process) {
      throw new NotFoundException('Process not found');
    }

    if (process.createdById !== userId) {
      throw new ForbiddenException('Only process creator can request approval');
    }

    if (process.status !== ProcessStatus.DRAFT) {
      throw new ForbiddenException('Process must be in draft status to request approval');
    }

    // Update process status
    await this.prisma.process.update({
      where: { id: processId },
      data: {
        status: ProcessStatus.WAITING_APPROVAL,
      },
    });

    // Find managers in the same department or all managers
    const managers = await this.prisma.user.findMany({
      where: {
        role: UserRole.MANAGER,
        isActive: true,
        ...(process.departmentId && { departmentId: process.departmentId }),
      },
    });

    // Create approval requests for all managers
    const approvals = await Promise.all(
      managers.map((manager) =>
        this.prisma.approval.create({
          data: {
            processId: processId,
            approverId: manager.id,
            status: ApprovalStatus.PENDING,
          },
        }),
      ),
    );

    // Send email notifications to managers
    await Promise.all(
      managers.map((manager) =>
        this.notificationService.sendApprovalRequest(manager.email, process),
      ),
    );

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Process',
        entityId: processId,
        changes: { status: 'WAITING_APPROVAL' },
      },
    });

    return {
      message: 'Approval request sent to managers',
      approvals: approvals.length,
    };
  }

  async approveProcess(approvalId: string, approveDto: ApproveDto, userId: string) {
    const approval = await this.prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        process: {
          include: {
            createdBy: true,
          },
        },
        approver: true,
      },
    });

    if (!approval) {
      throw new NotFoundException('Approval request not found');
    }

    if (approval.approverId !== userId) {
      throw new ForbiddenException('You are not authorized to approve this request');
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new ForbiddenException('This approval has already been processed');
    }

    // Update approval status
    await this.prisma.approval.update({
      where: { id: approvalId },
      data: {
        status: ApprovalStatus.APPROVED,
        comments: approveDto.comments,
      },
    });

    // Archive previous version if exists
    const previousVersions = await this.prisma.processVersion.findMany({
      where: {
        processId: approval.processId,
        version: {
          lt: approval.process.currentVersion,
        },
      },
    });

    // Update process status to approved
    await this.prisma.process.update({
      where: { id: approval.processId },
      data: {
        status: ProcessStatus.APPROVED,
      },
    });

    // Send notification to process creator
    await this.notificationService.sendApprovalResult(
      approval.process.createdBy.email,
      approval.process,
      true,
      approveDto.comments,
    );

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'APPROVE',
        entity: 'Process',
        entityId: approval.processId,
        changes: { approvalId, comments: approveDto.comments },
      },
    });

    return {
      message: 'Process approved successfully',
      process: approval.process,
    };
  }

  async rejectProcess(approvalId: string, rejectDto: RejectDto, userId: string) {
    const approval = await this.prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        process: {
          include: {
            createdBy: true,
          },
        },
        approver: true,
      },
    });

    if (!approval) {
      throw new NotFoundException('Approval request not found');
    }

    if (approval.approverId !== userId) {
      throw new ForbiddenException('You are not authorized to reject this request');
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new ForbiddenException('This approval has already been processed');
    }

    // Update approval status
    await this.prisma.approval.update({
      where: { id: approvalId },
      data: {
        status: ApprovalStatus.REJECTED,
        comments: rejectDto.comments,
      },
    });

    // Update process status to rejected
    await this.prisma.process.update({
      where: { id: approval.processId },
      data: {
        status: ProcessStatus.REJECTED,
      },
    });

    // Send notification to process creator
    await this.notificationService.sendApprovalResult(
      approval.process.createdBy.email,
      approval.process,
      false,
      rejectDto.comments,
    );

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'REJECT',
        entity: 'Process',
        entityId: approval.processId,
        changes: { approvalId, comments: rejectDto.comments },
      },
    });

    return {
      message: 'Process rejected',
      reason: rejectDto.comments,
    };
  }

  async getApprovalHistory(processId: string) {
    return this.prisma.approval.findMany({
      where: { processId },
      include: {
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
