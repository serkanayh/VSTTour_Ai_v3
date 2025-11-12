import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProcessVersionDto } from './dto/create-process-version.dto';

@Injectable()
export class ProcessVersionService {
  constructor(private prisma: PrismaService) {}

  async create(createVersionDto: CreateProcessVersionDto, userId: string) {
    // Get the process to determine next version number
    const process = await this.prisma.process.findUnique({
      where: { id: createVersionDto.processId },
      include: {
        versions: {
          orderBy: {
            version: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!process) {
      throw new NotFoundException('Process not found');
    }

    const nextVersion = process.versions.length > 0 ? process.versions[0].version + 1 : 1;

    const version = await this.prisma.processVersion.create({
      data: {
        processId: createVersionDto.processId,
        version: nextVersion,
        sopJson: createVersionDto.sopJson,
        formData: createVersionDto.formData,
        createdById: userId,
      },
    });

    // Update process current version
    await this.prisma.process.update({
      where: { id: createVersionDto.processId },
      data: {
        currentVersion: nextVersion,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entity: 'ProcessVersion',
        entityId: version.id,
      },
    });

    return version;
  }

  async findAllByProcess(processId: string) {
    return this.prisma.processVersion.findMany({
      where: { processId },
      orderBy: {
        version: 'desc',
      },
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
  }

  async findOne(processId: string, version: number) {
    const processVersion = await this.prisma.processVersion.findUnique({
      where: {
        processId_version: {
          processId,
          version,
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        process: true,
      },
    });

    if (!processVersion) {
      throw new NotFoundException('Process version not found');
    }

    return processVersion;
  }
}
