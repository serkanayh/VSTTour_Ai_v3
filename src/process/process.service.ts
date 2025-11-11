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

    // Create initial ProcessVersion with empty SOP
    await this.prisma.processVersion.create({
      data: {
        processId: process.id,
        version: 1,
        sopJson: {
          steps: [],
          metadata: {
            createdAt: new Date().toISOString(),
          },
        },
        formData: createProcessDto,
        createdById: userId,
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

  // ==================== PROCESS STEPS MANAGEMENT ====================

  async getProcessSteps(processId: string, userId: string, userRole: string) {
    const process = await this.prisma.process.findUnique({
      where: { id: processId },
      include: {
        versions: {
          where: { version: 1 }, // Get current version
          take: 1,
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

    const version = process.versions[0];
    if (!version || !version.sopJson) {
      return { steps: [] };
    }

    const sopData: any = version.sopJson;
    return { steps: sopData.steps || [] };
  }

  async addProcessStep(
    processId: string,
    stepData: { title: string; description: string; estimatedMinutes?: number },
    userId: string,
    userRole: string,
  ) {
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
      throw new NotFoundException('Process not found');
    }

    // Only creator or admin can add steps
    if (process.createdById !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to modify this process');
    }

    const version = process.versions[0];
    if (!version) {
      throw new NotFoundException('Process version not found');
    }

    const sopData: any = version.sopJson || { steps: [] };
    const steps = sopData.steps || [];

    // Create new step
    const newStep = {
      id: `step-${Date.now()}`,
      order: steps.length + 1,
      title: stepData.title,
      description: stepData.description,
      estimatedMinutes: stepData.estimatedMinutes || null,
    };

    steps.push(newStep);

    // Update version
    await this.prisma.processVersion.update({
      where: { id: version.id },
      data: {
        sopJson: {
          ...sopData,
          steps,
        },
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entity: 'ProcessStep',
        entityId: newStep.id,
      },
    });

    return newStep;
  }

  async updateProcessStep(
    processId: string,
    stepId: string,
    stepData: { title?: string; description?: string; estimatedMinutes?: number },
    userId: string,
    userRole: string,
  ) {
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
      throw new NotFoundException('Process not found');
    }

    if (process.createdById !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to modify this process');
    }

    const version = process.versions[0];
    if (!version) {
      throw new NotFoundException('Process version not found');
    }

    const sopData: any = version.sopJson || { steps: [] };
    const steps = sopData.steps || [];

    const stepIndex = steps.findIndex((s: any) => s.id === stepId);
    if (stepIndex === -1) {
      throw new NotFoundException('Step not found');
    }

    // Update step
    steps[stepIndex] = {
      ...steps[stepIndex],
      ...stepData,
    };

    // Update version
    await this.prisma.processVersion.update({
      where: { id: version.id },
      data: {
        sopJson: {
          ...sopData,
          steps,
        },
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'ProcessStep',
        entityId: stepId,
        changes: stepData,
      },
    });

    return steps[stepIndex];
  }

  async deleteProcessStep(processId: string, stepId: string, userId: string, userRole: string) {
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
      throw new NotFoundException('Process not found');
    }

    if (process.createdById !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to modify this process');
    }

    const version = process.versions[0];
    if (!version) {
      throw new NotFoundException('Process version not found');
    }

    const sopData: any = version.sopJson || { steps: [] };
    let steps = sopData.steps || [];

    const stepIndex = steps.findIndex((s: any) => s.id === stepId);
    if (stepIndex === -1) {
      throw new NotFoundException('Step not found');
    }

    // Remove step
    steps = steps.filter((s: any) => s.id !== stepId);

    // Reorder remaining steps
    steps = steps.map((s: any, index: number) => ({
      ...s,
      order: index + 1,
    }));

    // Update version
    await this.prisma.processVersion.update({
      where: { id: version.id },
      data: {
        sopJson: {
          ...sopData,
          steps,
        },
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'ProcessStep',
        entityId: stepId,
      },
    });

    return { message: 'Step deleted successfully' };
  }

  async reorderProcessSteps(
    processId: string,
    newOrder: string[],
    userId: string,
    userRole: string,
  ) {
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
      throw new NotFoundException('Process not found');
    }

    if (process.createdById !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to modify this process');
    }

    const version = process.versions[0];
    if (!version) {
      throw new NotFoundException('Process version not found');
    }

    const sopData: any = version.sopJson || { steps: [] };
    const steps = sopData.steps || [];

    // Reorder steps based on newOrder array
    const reorderedSteps = newOrder.map((stepId, index) => {
      const step = steps.find((s: any) => s.id === stepId);
      if (!step) {
        throw new NotFoundException(`Step ${stepId} not found`);
      }
      return {
        ...step,
        order: index + 1,
      };
    });

    // Update version
    await this.prisma.processVersion.update({
      where: { id: version.id },
      data: {
        sopJson: {
          ...sopData,
          steps: reorderedSteps,
        },
      },
    });

    return { steps: reorderedSteps };
  }
}
