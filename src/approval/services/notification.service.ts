import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationService {
  constructor(private configService: ConfigService) {}

  async sendApprovalRequest(managerEmail: string, process: any): Promise<void> {
    // In production, integrate with actual email service (SendGrid, AWS SES, etc.)
    console.log(`📧 Sending approval request to ${managerEmail}`);
    console.log(`Process: ${process.processName}`);
    console.log(`Creator: ${process.createdBy.name} (${process.createdBy.email})`);

    // Placeholder for actual email sending
    const emailData = {
      to: managerEmail,
      subject: `Approval Request: ${process.processName}`,
      body: `
        Hello,

        A new process requires your approval:

        Process Name: ${process.processName}
        Description: ${process.description || 'N/A'}
        Created by: ${process.createdBy.name}
        Department: ${process.department?.name || 'N/A'}

        Please review and approve/reject this process in the VSTTour AI platform.

        Best regards,
        VSTTour AI System
      `,
    };

    // TODO: Integrate with SMTP or email service
    // await this.emailService.send(emailData);

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

    const emailData = {
      to: creatorEmail,
      subject: `Process ${approved ? 'Approved' : 'Rejected'}: ${process.processName}`,
      body: `
        Hello,

        Your process has been ${approved ? 'approved' : 'rejected'}:

        Process Name: ${process.processName}
        Status: ${approved ? 'APPROVED ✅' : 'REJECTED ❌'}
        ${comments ? `Comments: ${comments}` : ''}

        ${approved ? 'You can now export this process to n8n or other automation tools.' : 'Please review the feedback and make necessary changes.'}

        Best regards,
        VSTTour AI System
      `,
    };

    // TODO: Integrate with SMTP or email service
    return Promise.resolve();
  }
}
