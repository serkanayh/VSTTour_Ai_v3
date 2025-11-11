import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';
import { ProcessStatus, UserRole } from '@prisma/client';

@Injectable()
export class ProcessService {
  constructor(private prisma: PrismaService) {}

  async create(createProcessDto: CreateProcessDto, userId: string) {
    // Map frontend fields to database schema
    const processData: any = {
      processName: createProcessDto.name,
      description: createProcessDto.description,
      frequency: createProcessDto.tasksPerDay,
      duration: createProcessDto.minutesPerTask,
      costPerHour: createProcessDto.costPerHour,
      createdById: userId,
      status: createProcessDto.status || ProcessStatus.DRAFT,
    };

    const process = await this.prisma.process.create({
      data: processData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entity: 'Process',
        entityId: process.id,
      },
    });

    // Map database fields back to frontend format
    return {
      id: process.id,
      name: process.processName,
      description: process.description,
      status: process.status,
      currentVersion: process.currentVersion,
      department: createProcessDto.department,
      estimatedTimeMinutes: createProcessDto.estimatedTimeMinutes,
      tasksPerDay: process.frequency,
      minutesPerTask: process.duration,
      costPerHour: process.costPerHour,
      createdById: process.createdById,
      createdBy: process.createdBy,
      createdAt: process.createdAt,
      updatedAt: process.updatedAt,
    };
  }

  async findAll(userId: string, userRole: string) {
    // Users can see their own processes and approved processes
    // Managers can see all processes in their department
    // Admins can see all processes
    const whereClause: any = {};

    if (userRole === UserRole.USER || userRole === UserRole.DEVELOPER) {
      whereClause.OR = [{ createdById: userId }, { status: ProcessStatus.APPROVED }];
    }

    const processes = await this.prisma.process.findMany({
      where: whereClause,
      include: {
        createdBy: {
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

    // Map database fields to frontend format
    return processes.map(process => ({
      id: process.id,
      name: process.processName,
      description: process.description,
      status: process.status,
      currentVersion: process.currentVersion,
      department: null,
      estimatedTimeMinutes: process.duration,
      tasksPerDay: process.frequency,
      minutesPerTask: process.duration,
      costPerHour: process.costPerHour,
      createdById: process.createdById,
      createdBy: process.createdBy,
      createdAt: process.createdAt,
      updatedAt: process.updatedAt,
    }));
  }

  async findOne(id: string, userId: string, userRole: string) {
    const process = await this.prisma.process.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        versions: {
          orderBy: {
            version: 'desc',
          },
          take: 5, // Last 5 versions
        },
      },
    });

    if (!process) {
      throw new NotFoundException('Process not found');
    }

    // Check permissions
    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.MANAGER &&
      process.createdById !== userId &&
      process.status !== ProcessStatus.APPROVED
    ) {
      throw new ForbiddenException('You do not have permission to view this process');
    }

    // Map database fields to frontend format
    return {
      id: process.id,
      name: process.processName,
      description: process.description,
      status: process.status,
      currentVersion: process.currentVersion,
      department: null,
      estimatedTimeMinutes: process.duration,
      tasksPerDay: process.frequency,
      minutesPerTask: process.duration,
      costPerHour: process.costPerHour,
      createdById: process.createdById,
      createdBy: process.createdBy,
      createdAt: process.createdAt,
      updatedAt: process.updatedAt,
      versions: process.versions,
    };
  }

  async update(id: string, updateProcessDto: UpdateProcessDto, userId: string, userRole: string) {
    const process = await this.findOne(id, userId, userRole);

    // Only creator or admin can update
    if (process.createdById !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to update this process');
    }

    // Cannot update approved processes without admin role
    if (process.status === ProcessStatus.APPROVED && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Cannot update approved process');
    }

    const updated = await this.prisma.process.update({
      where: { id },
      data: updateProcessDto,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        department: true,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Process',
        entityId: id,
        changes: JSON.parse(JSON.stringify(updateProcessDto)),
      },
    });

    return updated;
  }

  async remove(id: string, userId: string, userRole: string) {
    const process = await this.findOne(id, userId, userRole);

    // Only creator or admin can delete
    if (process.createdById !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this process');
    }

    await this.prisma.process.delete({
      where: { id },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'Process',
        entityId: id,
      },
    });

    return { message: 'Process deleted successfully' };
  }

  async calculateROI(processId: string): Promise<any> {
    const process = await this.prisma.process.findUnique({
      where: { id: processId },
    });

    if (!process) {
      throw new NotFoundException('Process not found');
    }

    if (!process.frequency || !process.duration || !process.costPerHour) {
      return {
        message: 'Incomplete data for ROI calculation',
        roi: null,
      };
    }

    // Calculate ROI
    const tasksPerDay = process.frequency;
    const minutesPerTask = process.duration;
    const costPerHour = process.costPerHour;

    const hoursPerDay = (tasksPerDay * minutesPerTask) / 60;
    const dailyCost = hoursPerDay * costPerHour;
    const monthlyCost = dailyCost * 22; // Working days per month
    const yearlyCost = monthlyCost * 12;

    // Automation potential savings (assuming 80% automation efficiency)
    const automationEfficiency = 0.8;
    const potentialMonthlySavings = monthlyCost * automationEfficiency;
    const potentialYearlySavings = yearlyCost * automationEfficiency;

    return {
      metrics: {
        tasksPerDay,
        minutesPerTask,
        hoursPerDay: parseFloat(hoursPerDay.toFixed(2)),
        costPerHour,
        dailyCost: parseFloat(dailyCost.toFixed(2)),
        monthlyCost: parseFloat(monthlyCost.toFixed(2)),
        yearlyCost: parseFloat(yearlyCost.toFixed(2)),
      },
      savings: {
        automationEfficiency: `${automationEfficiency * 100}%`,
        potentialMonthlySavings: parseFloat(potentialMonthlySavings.toFixed(2)),
        potentialYearlySavings: parseFloat(potentialYearlySavings.toFixed(2)),
      },
      automationScore: process.automationScore || 0,
    };
  }

  async submitForApproval(processId: string, userId: string) {
    const process = await this.prisma.process.findUnique({
      where: { id: processId },
    });

    if (!process) {
      throw new NotFoundException('Process not found');
    }

    if (process.createdById !== userId) {
      throw new ForbiddenException('Only process creator can submit for approval');
    }

    if (process.status !== ProcessStatus.DRAFT) {
      throw new ForbiddenException('Only draft processes can be submitted for approval');
    }

    const updated = await this.prisma.process.update({
      where: { id: processId },
      data: {
        status: ProcessStatus.WAITING_APPROVAL,
      },
    });

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

    return updated;
  }
}
