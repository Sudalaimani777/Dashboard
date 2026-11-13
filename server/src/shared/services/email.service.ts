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
        <div style="background-color: #F7F4EE; padding: 40px 16px; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="max-width: 540px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E8DFD3; border-radius: 12px; padding: 36px 32px; box-shadow: 0 4px 12px rgba(43, 35, 29, 0.04);">
            <div style="margin-bottom: 24px;">
              <span style="font-size: 18px; font-weight: 700; color: #2B231D; letter-spacing: -0.02em;">TripFlow</span>
            </div>
            <h2 style="color: #2B231D; font-size: 20px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.01em;">Reset Your Password</h2>
            <p style="color: #575049; font-size: 15px; line-height: 1.6; margin: 0 0 12px 0;">Hello <strong>${recipientName}</strong>,</p>
            <p style="color: #575049; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">
              We received a request to reset the password for your TripFlow account. Click the button below to choose a new password:
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="background-color: #8A582B; color: #FFFFFF; padding: 13px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #6E655C; font-size: 13px; line-height: 1.5; margin: 24px 0 0 0;">
              Or copy and paste this URL into your browser:<br/>
              <a href="${resetUrl}" style="color: #8A582B; word-break: break-all;">${resetUrl}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #E8DFD3; margin: 28px 0;" />
            <p style="color: #6E655C; font-size: 12px; line-height: 1.5; margin: 0;">
              This link will expire in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.
            </p>
          </div>
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
