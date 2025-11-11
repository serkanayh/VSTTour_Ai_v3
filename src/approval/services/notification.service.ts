import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../email/email.service';

@Injectable()
export class NotificationService {
  constructor(
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async sendApprovalRequest(managerEmail: string, process: any): Promise<void> {
    console.log(`📧 Sending approval request to ${managerEmail}`);
    console.log(`Process: ${process.processName}`);
    console.log(`Creator: ${process.createdBy.name} (${process.createdBy.email})`);

    // Send actual email notification
    try {
      await this.emailService.sendProcessSubmittedEmail(
        managerEmail,
        'Manager', // We don't have the manager's name in this context
        process.processName,
        process.createdBy.name,
        process.id,
      );
    } catch (error) {
      console.error('Failed to send approval request email:', error);
      // Don't throw - we still want the approval request to be created
    }

    return Promise.resolve();
  }

  async sendApprovalResult(
    creatorEmail: string,
    process: any,
    approved: boolean,
    comments?: string,
  ): Promise<void> {
    console.log(`📧 Sending approval result to ${creatorEmail}`);
    console.log(`Process: ${process.processName}`);
    console.log(`Status: ${approved ? 'APPROVED' : 'REJECTED'}`);

    // Send actual email notification
    try {
      if (approved) {
        await this.emailService.sendProcessApprovalEmail(
          creatorEmail,
          process.createdBy.name || 'User',
          process.processName,
          'Manager', // We don't have approver name in this context
          new Date(),
        );
      } else {
        await this.emailService.sendProcessRejectionEmail(
          creatorEmail,
          process.createdBy.name || 'User',
          process.processName,
          'Manager', // We don't have rejector name in this context
          comments || 'No reason provided',
          new Date(),
        );
      }
    } catch (error) {
      console.error('Failed to send approval result email:', error);
      // Don't throw - we still want the approval/rejection to succeed
    }

    return Promise.resolve();
  }
}
