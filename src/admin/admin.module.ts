import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { EncryptionService } from './services/encryption.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, EncryptionService],
  exports: [AdminService, EncryptionService],
})
export class AdminModule {}
