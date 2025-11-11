import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAiConfigDto } from './dto/create-ai-config.dto';
import { UpdateAiConfigDto } from './dto/update-ai-config.dto';
import { EncryptionService } from './services/encryption.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async createAiConfiguration(createDto: CreateAiConfigDto, userId: string, userRole: string) {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create AI configurations');
    }

    // Encrypt API key
    const encryptedApiKey = this.encryptionService.encrypt(createDto.apiKey);

    // Remove apiKey from DTO before saving
    const { apiKey, ...dataWithoutApiKey } = createDto;

    const config = await this.prisma.aiConfiguration.create({
      data: {
        ...dataWithoutApiKey,
        apiKeyEncrypted: encryptedApiKey,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entity: 'AiConfiguration',
        entityId: config.id,
      },
    });

    // Don't return the encrypted key
    const { apiKeyEncrypted, ...result } = config;
    return result;
  }

  async getAllConfigurations(userRole: string) {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can view AI configurations');
    }

    const configs = await this.prisma.aiConfiguration.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Remove encrypted keys from response
    return configs.map(({ apiKeyEncrypted, ...config }) => ({
      ...config,
      hasApiKey: !!apiKeyEncrypted,
    }));
  }

  async getActiveConfiguration() {
    const config = await this.prisma.aiConfiguration.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!config) {
      return null;
    }

    // Decrypt API key for internal use
    const decryptedApiKey = this.encryptionService.decrypt(config.apiKeyEncrypted);

    return {
      ...config,
      apiKey: decryptedApiKey,
    };
  }

  async getConfigurationById(id: string, userRole: string) {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can view AI configurations');
    }

    const config = await this.prisma.aiConfiguration.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('Configuration not found');
    }

    const { apiKeyEncrypted, ...result } = config;
    return {
      ...result,
      hasApiKey: !!apiKeyEncrypted,
    };
  }

  async updateConfiguration(
    id: string,
    updateDto: UpdateAiConfigDto,
    userId: string,
    userRole: string,
  ) {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update AI configurations');
    }

    const config = await this.prisma.aiConfiguration.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('Configuration not found');
    }

    const updateData: any = { ...updateDto };

    // Encrypt new API key if provided
    if (updateDto.apiKey) {
      updateData.apiKeyEncrypted = this.encryptionService.encrypt(updateDto.apiKey);
      delete updateData.apiKey;
    }

    const updated = await this.prisma.aiConfiguration.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'AiConfiguration',
        entityId: id,
        changes: { ...updateDto, apiKey: updateDto.apiKey ? '[ENCRYPTED]' : undefined },
      },
    });

    const { apiKeyEncrypted, ...result } = updated;
    return result;
  }

  async deleteConfiguration(id: string, userId: string, userRole: string) {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete AI configurations');
    }

    const config = await this.prisma.aiConfiguration.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('Configuration not found');
    }

    await this.prisma.aiConfiguration.delete({
      where: { id },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'AiConfiguration',
        entityId: id,
      },
    });

    return { message: 'Configuration deleted successfully' };
  }

  async setActiveConfiguration(id: string, userId: string, userRole: string) {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can change active configuration');
    }

    const config = await this.prisma.aiConfiguration.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('Configuration not found');
    }

    // Deactivate all other configurations
    await this.prisma.aiConfiguration.updateMany({
      where: {
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Activate the selected configuration
    const updated = await this.prisma.aiConfiguration.update({
      where: { id },
      data: {
        isActive: true,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'AiConfiguration',
        entityId: id,
        changes: { isActive: true },
      },
    });

    const { apiKeyEncrypted, ...result } = updated;
    return result;
  }

  async getSystemStats(userRole: string) {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can view system stats');
    }

    const [
      totalProcesses,
      draftProcesses,
      approvedProcesses,
      pendingApproval,
      totalUsers,
      activeUsers,
      totalExports,
    ] = await Promise.all([
      this.prisma.process.count(),
      this.prisma.process.count({ where: { status: 'DRAFT' } }),
      this.prisma.process.count({ where: { status: 'APPROVED' } }),
      this.prisma.process.count({ where: { status: 'WAITING_APPROVAL' } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.processExport.count(),
    ]);

    return {
      processes: {
        total: totalProcesses,
        draft: draftProcesses,
        approved: approvedProcesses,
        pendingApproval: pendingApproval,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      exports: {
        total: totalExports,
      },
    };
  }
}
