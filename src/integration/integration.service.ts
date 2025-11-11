import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProcessStatus, ExportFormat } from '@prisma/client';
import { N8nService } from './services/n8n.service';

@Injectable()
export class IntegrationService {
  constructor(
    private prisma: PrismaService,
    private n8nService: N8nService,
  ) {}

  async exportToN8n(processId: string, userId: string) {
    const processRecord = await this.prisma.process.findUnique({
      where: { id: processId },
      include: {
        createdBy: true,
      },
    });

    if (!processRecord) {
      throw new NotFoundException('Process not found');
    }

    // Fetch the current version separately
    const currentVersion = await this.prisma.processVersion.findFirst({
      where: {
        processId: processId,
        version: processRecord.currentVersion,
      },
    });

    if (!currentVersion || !currentVersion.sopJson) {
      throw new BadRequestException('Process does not have a valid SOP');
    }

    // Only approved processes can be exported
    if (processRecord.status !== ProcessStatus.APPROVED) {
      throw new ForbiddenException('Only approved processes can be exported');
    }

    // Convert SOP to n8n workflow format
    const n8nWorkflow = this.n8nService.convertSOPToN8n(
      processRecord,
      currentVersion.sopJson as any,
    );

    // Validate n8n workflow
    const isValid = this.n8nService.validateN8nWorkflow(n8nWorkflow);
    if (!isValid) {
      throw new BadRequestException('Generated n8n workflow is invalid');
    }

    // Store export record
    const exportRecord = await this.prisma.processExport.create({
      data: {
        processId: process.id,
        format: ExportFormat.N8N_WORKFLOW,
        exportData: n8nWorkflow,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'EXPORT',
        entity: 'Process',
        entityId: process.id,
        changes: { format: 'N8N_WORKFLOW', exportId: exportRecord.id },
      },
    });

    return {
      message: 'Process exported to n8n format successfully',
      exportId: exportRecord.id,
      workflow: n8nWorkflow,
      downloadUrl: `/integration/export/${exportRecord.id}/download`,
    };
  }

  async exportToJSON(processId: string, userId: string) {
    const processRecord = await this.prisma.process.findUnique({
      where: { id: processId },
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

    if (!processRecord) {
      throw new NotFoundException('Process not found');
    }

    if (processRecord.status !== ProcessStatus.APPROVED) {
      throw new ForbiddenException('Only approved processes can be exported');
    }

    // Fetch the current version separately
    const currentVersion = await this.prisma.processVersion.findFirst({
      where: {
        processId: processId,
        version: processRecord.currentVersion,
      },
    });

    const jsonExport = {
      processId: processRecord.id,
      processName: processRecord.processName,
      description: processRecord.description,
      status: processRecord.status,
      createdBy: processRecord.createdBy,
      department: processRecord.department,
      metrics: {
        frequency: processRecord.frequency,
        duration: processRecord.duration,
        costPerHour: processRecord.costPerHour,
        automationScore: processRecord.automationScore,
      },
      sop: currentVersion?.sopJson,
      formData: currentVersion?.formData,
      version: processRecord.currentVersion,
      exportedAt: new Date().toISOString(),
    };

    // Store export record
    const exportRecord = await this.prisma.processExport.create({
      data: {
        processId: processRecord.id,
        format: ExportFormat.JSON,
        exportData: jsonExport,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'EXPORT',
        entity: 'Process',
        entityId: processRecord.id,
        changes: { format: 'JSON', exportId: exportRecord.id },
      },
    });

    return {
      message: 'Process exported to JSON successfully',
      exportId: exportRecord.id,
      data: jsonExport,
    };
  }

  async getExportById(exportId: string) {
    const exportRecord = await this.prisma.processExport.findUnique({
      where: { id: exportId },
      include: {
        process: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!exportRecord) {
      throw new NotFoundException('Export record not found');
    }

    return exportRecord;
  }

  async getAllExports(processId: string) {
    return this.prisma.processExport.findMany({
      where: { processId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
