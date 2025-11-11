import { Module } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { ApprovalController } from './approval.controller';
import { NotificationService } from './services/notification.service';

@Module({
  controllers: [ApprovalController],
  providers: [ApprovalService, NotificationService],
  exports: [ApprovalService],
})
export class ApprovalModule {}
