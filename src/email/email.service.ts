import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const from = this.configService.get<string>('SMTP_FROM');

    if (!host || !port || !user || !pass) {
      this.logger.warn('SMTP configuration not found. Email sending will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    this.logger.log('Email transporter initialized successfully');
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email transporter not configured. Skipping email send.');
      return false;
    }

    try {
      const from = this.configService.get<string>('SMTP_FROM') || 'noreply@vsttour.com';

      await this.transporter.sendMail({
        from: `VSTTour AI <${from}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      this.logger.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendProcessApprovalEmail(
    recipientEmail: string,
    recipientName: string,
    processName: string,
    approverName: string,
    approvalDate: Date,
  ): Promise<boolean> {
    const subject = `✅ Süreç Onaylandı: ${processName}`;
    const html = this.getApprovalEmailTemplate(
      recipientName,
      processName,
      approverName,
      approvalDate,
    );

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
    });
  }

  async sendProcessRejectionEmail(
    recipientEmail: string,
    recipientName: string,
    processName: string,
    rejectorName: string,
    reason: string,
    rejectionDate: Date,
  ): Promise<boolean> {
    const subject = `❌ Süreç Reddedildi: ${processName}`;
    const html = this.getRejectionEmailTemplate(
      recipientName,
      processName,
      rejectorName,
      reason,
      rejectionDate,
    );

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
    });
  }

  async sendProcessSubmittedEmail(
    recipientEmail: string,
    recipientName: string,
    processName: string,
    submitterName: string,
    processId: string,
  ): Promise<boolean> {
    const subject = `📋 Yeni Süreç Onay Bekliyor: ${processName}`;
    const html = this.getSubmittedEmailTemplate(
      recipientName,
      processName,
      submitterName,
      processId,
    );

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
    });
  }

  private getApprovalEmailTemplate(
    recipientName: string,
    processName: string,
    approverName: string,
    approvalDate: Date,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">✅ Süreç Onaylandı</h1>
    </div>
    <div class="content">
      <p>Merhaba <strong>${recipientName}</strong>,</p>

      <p>Harika haberlerimiz var! Süreciniz başarıyla onaylandı.</p>

      <div class="card">
        <h3 style="margin-top: 0; color: #10b981;">Süreç Detayları</h3>
        <p><strong>Süreç Adı:</strong> ${processName}</p>
        <p><strong>Onaylayan:</strong> ${approverName}</p>
        <p><strong>Onay Tarihi:</strong> ${approvalDate.toLocaleDateString('tr-TR')}</p>
      </div>

      <p>Artık sürecinizi n8n'e aktarabilir ve otomasyonu başlatabilirsiniz.</p>

      <a href="${this.configService.get('APP_URL') || 'http://localhost:3000'}/dashboard/processes" class="button">
        Süreçleri Görüntüle
      </a>

      <div class="footer">
        <p>Bu bir otomatik bildirimdir. Lütfen yanıtlamayın.</p>
        <p>&copy; 2025 VSTTour AI. Tüm hakları saklıdır.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getRejectionEmailTemplate(
    recipientName: string,
    processName: string,
    rejectorName: string,
    reason: string,
    rejectionDate: Date,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ef4444; }
    .reason-box { background: #fef2f2; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">❌ Süreç Reddedildi</h1>
    </div>
    <div class="content">
      <p>Merhaba <strong>${recipientName}</strong>,</p>

      <p>Üzgünüz, süreciniz onaylanmadı ve gözden geçirilmesi gerekiyor.</p>

      <div class="card">
        <h3 style="margin-top: 0; color: #ef4444;">Süreç Detayları</h3>
        <p><strong>Süreç Adı:</strong> ${processName}</p>
        <p><strong>Reddeden:</strong> ${rejectorName}</p>
        <p><strong>Red Tarihi:</strong> ${rejectionDate.toLocaleDateString('tr-TR')}</p>
      </div>

      <div class="reason-box">
        <h4 style="margin-top: 0; color: #991b1b;">Red Nedeni:</h4>
        <p>${reason || 'Belirtilmedi'}</p>
      </div>

      <p>Lütfen süreci gözden geçirin, gerekli değişiklikleri yapın ve tekrar gönderin.</p>

      <a href="${this.configService.get('APP_URL') || 'http://localhost:3000'}/dashboard/processes" class="button">
        Süreci Düzenle
      </a>

      <div class="footer">
        <p>Bu bir otomatik bildirimdir. Lütfen yanıtlamayın.</p>
        <p>&copy; 2025 VSTTour AI. Tüm hakları saklıdır.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getSubmittedEmailTemplate(
    recipientName: string,
    processName: string,
    submitterName: string,
    processId: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #3b82f6; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
    .button-secondary { background: #ef4444; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">📋 Yeni Süreç Onay Bekliyor</h1>
    </div>
    <div class="content">
      <p>Merhaba <strong>${recipientName}</strong>,</p>

      <p>Yeni bir süreç onayınızı bekliyor.</p>

      <div class="card">
        <h3 style="margin-top: 0; color: #3b82f6;">Süreç Detayları</h3>
        <p><strong>Süreç Adı:</strong> ${processName}</p>
        <p><strong>Oluşturan:</strong> ${submitterName}</p>
        <p><strong>Gönderim Tarihi:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
      </div>

      <p>Lütfen süreci inceleyin ve onaylayın ya da reddedin.</p>

      <div style="text-align: center;">
        <a href="${this.configService.get('APP_URL') || 'http://localhost:3000'}/dashboard/admin/approvals/${processId}" class="button">
          Süreci İncele
        </a>
      </div>

      <div class="footer">
        <p>Bu bir otomatik bildirimdir. Lütfen yanıtlamayın.</p>
        <p>&copy; 2025 VSTTour AI. Tüm hakları saklıdır.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }
}
