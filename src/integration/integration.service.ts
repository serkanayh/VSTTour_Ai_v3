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
    const process = await this.prisma.process.findUnique({
      where: { id: processId },
      include: {
        createdBy: true,
        versions: {
          where: {
            version: {
              equals: process.currentVersion,
            },
          },
          take: 1,
        },
      },
    });

    if (!process) {
      throw new NotFoundException('Process not found');
    }

    // Only approved processes can be exported
    if (process.status !== ProcessStatus.APPROVED) {
      throw new ForbiddenException('Only approved processes can be exported');
    }

    // Get the current version SOP
    const currentVersion = process.versions[0];
    if (!currentVersion || !currentVersion.sopJson) {
      throw new BadRequestException('Process does not have a valid SOP');
    }

    // Convert SOP to n8n workflow format
    const n8nWorkflow = this.n8nService.convertSOPToN8n(
      process,
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
    const process = await this.prisma.process.findUnique({
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
        versions: {
          where: {
            version: {
              equals: process.currentVersion,
            },
          },
          take: 1,
        },
      },
    });

    if (!process) {
      throw new NotFoundException('Process not found');
    }

    if (process.status !== ProcessStatus.APPROVED) {
      throw new ForbiddenException('Only approved processes can be exported');
    }

    const currentVersion = process.versions[0];

    const jsonExport = {
      processId: process.id,
      processName: process.processName,
      description: process.description,
      status: process.status,
      createdBy: process.createdBy,
      department: process.department,
      metrics: {
        frequency: process.frequency,
        duration: process.duration,
        costPerHour: process.costPerHour,
        automationScore: process.automationScore,
      },
      sop: currentVersion?.sopJson,
      formData: currentVersion?.formData,
      version: process.currentVersion,
      exportedAt: new Date().toISOString(),
    };

    // Store export record
    const exportRecord = await this.prisma.processExport.create({
      data: {
        processId: process.id,
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
        entityId: process.id,
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
