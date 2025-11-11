import { Module } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { ApprovalController } from './approval.controller';
import { NotificationService } from './services/notification.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [ApprovalController],
  providers: [ApprovalService, NotificationService],
  exports: [ApprovalService],
})
export class ApprovalModule {}
