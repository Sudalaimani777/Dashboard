import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../../config/env.js';

export interface EmailResult {
  messageId: string;
  previewUrl?: string | false;
}

export interface IEmailService {
  sendPasswordResetEmail(
    toEmail: string,
    recipientName: string,
    resetUrl: string
  ): Promise<EmailResult>;
}

export class EmailService implements IEmailService {
  private transporter: Transporter | null = null;

  private async getTransporter(): Promise<Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    if (config.smtp.host && config.smtp.user && config.smtp.pass) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
      return this.transporter;
    }

    // Dev/test fallback: Auto-create Ethereal test inbox
    const testAccount = await nodemailer.createTestAccount();
    this.transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log(`📧 [EmailService] Ethereal test mailbox provisioned: ${testAccount.user}`);
    return this.transporter;
  }

  async sendPasswordResetEmail(
    toEmail: string,
    recipientName: string,
    resetUrl: string
  ): Promise<EmailResult> {
    const transporter = await this.getTransporter();

    const mailOptions = {
      from: config.smtp.from,
      to: toEmail,
      subject: 'Reset Your TripFlow Password',
      text: `Hello ${recipientName},\n\nYou requested to reset your TripFlow password. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you did not request this, please ignore this email.\n\nBest regards,\nThe TripFlow Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e4e7; border-radius: 8px;">
          <h2 style="color: #08060d; margin-top: 0;">Reset Your Password</h2>
          <p style="color: #6b6375; font-size: 16px;">Hello <strong>${recipientName}</strong>,</p>
          <p style="color: #6b6375; font-size: 16px; line-height: 1.5;">
            We received a request to reset the password for your TripFlow account. Click the button below to choose a new password:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background-color: #aa3bff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #6b6375; font-size: 14px;">
            Or copy and paste this URL into your browser:<br/>
            <a href="${resetUrl}" style="color: #aa3bff; word-break: break-all;">${resetUrl}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #e5e4e7; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">
            This link will expire in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    if (previewUrl) {
      console.log(`🔗 [EmailService] Password reset email preview: ${previewUrl}`);
    }

    return {
      messageId: info.messageId,
      previewUrl,
    };
  }
}

export const emailService = new EmailService();
