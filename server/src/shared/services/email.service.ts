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
  sendTravelSubmittedEmail(
    managerEmail: string,
    managerName: string,
    requesterName: string,
    trip: any
  ): Promise<EmailResult>;
  sendRevisionRequestedEmail(
    employeeEmail: string,
    employeeName: string,
    actorName: string,
    remarks: string,
    trip: any
  ): Promise<EmailResult>;
  sendTravelApprovedEmail(
    employeeEmail: string,
    employeeName: string,
    trip: any
  ): Promise<EmailResult>;
  sendTravelSettledEmail(
    employeeEmail: string,
    employeeName: string,
    trip: any
  ): Promise<EmailResult>;
  sendTravelRejectedEmail(
    employeeEmail: string,
    employeeName: string,
    reason: string,
    trip: any
  ): Promise<EmailResult>;
  sendManagerOversightEmail(
    adminEmail: string,
    adminName: string,
    managerName: string,
    trip: any
  ): Promise<EmailResult>;
}

function escapeHtml(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTripAmount(trip: any): string {
  const amount = Number(trip?.totalExpenses ?? trip?.total_expenses ?? 0);
  const currency = trip?.currency || 'INR';
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `;
  return `${symbol}${amount.toLocaleString('en-IN')}`;
}

export class EmailService implements IEmailService {
  private transporter: Transporter | null = null;

  public setTransporter(transporter: Transporter | null): void {
    this.transporter = transporter;
  }

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

  private renderBaseEmail(params: {
    recipientName: string;
    headline: string;
    badgeText: string;
    badgeBg: string;
    badgeColor: string;
    leadMessage: string;
    calloutTitle?: string;
    calloutContent?: string;
    trip?: any;
    ctaLabel: string;
    ctaUrl: string;
    footerNote?: string;
  }): string {
    const {
      recipientName,
      headline,
      badgeText,
      badgeBg,
      badgeColor,
      leadMessage,
      calloutTitle,
      calloutContent,
      trip,
      ctaLabel,
      ctaUrl,
      footerNote,
    } = params;

    const tripOrigin = trip?.origin ? escapeHtml(trip.origin) : 'N/A';
    const tripDest = trip?.destination ? escapeHtml(trip.destination) : 'N/A';
    const tripDep = trip?.departureDate || trip?.departure_date || 'N/A';
    const tripRet = trip?.returnDate || trip?.return_date || 'N/A';
    const tripTitle = trip?.title ? escapeHtml(trip.title) : 'Travel Itinerary';
    const tripAmount = formatTripAmount(trip);

    return `
      <div style="background-color: #F8FAFC; padding: 40px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #061B31;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 36px 32px; box-shadow: 0 4px 16px rgba(6, 27, 49, 0.04);">
          <!-- Header Logo / Brand -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <div style="font-size: 20px; font-weight: 700; color: #533AFD; letter-spacing: -0.02em;">
              TripFlow
            </div>
            <span style="background-color: ${badgeBg}; color: ${badgeColor}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 9999px;">
              ${escapeHtml(badgeText)}
            </span>
          </div>

          <!-- Headline -->
          <h1 style="color: #061B31; font-size: 22px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.01em;">
            ${escapeHtml(headline)}
          </h1>

          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
            Hello <strong>${escapeHtml(recipientName)}</strong>,
          </p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
            ${leadMessage}
          </p>

          ${calloutTitle && calloutContent ? `
            <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 6px; padding: 14px 16px; margin: 0 0 24px 0;">
              <strong style="color: #92400E; font-size: 13px; text-transform: uppercase; letter-spacing: 0.03em;">${escapeHtml(calloutTitle)}:</strong>
              <p style="color: #78350F; font-size: 14px; margin: 6px 0 0 0; line-height: 1.5; font-style: italic;">
                "${escapeHtml(calloutContent)}"
              </p>
            </div>
          ` : ''}

          <!-- Trip Overview Card -->
          ${trip ? `
            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 20px; margin: 0 0 28px 0;">
              <div style="font-size: 13px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 12px;">
                Trip Overview
              </div>
              <div style="font-size: 16px; font-weight: 700; color: #061B31; margin-bottom: 12px;">
                ${tripTitle}
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="color: #64748B; padding: 4px 0;">Route:</td>
                  <td style="color: #061B31; font-weight: 600; text-align: right; padding: 4px 0;">${tripOrigin} &rarr; ${tripDest}</td>
                </tr>
                <tr>
                  <td style="color: #64748B; padding: 4px 0;">Dates:</td>
                  <td style="color: #061B31; font-weight: 500; text-align: right; padding: 4px 0;">${escapeHtml(tripDep)} to ${escapeHtml(tripRet)}</td>
                </tr>
                <tr>
                  <td style="color: #64748B; padding: 4px 0;">Total Expenses:</td>
                  <td style="color: #533AFD; font-weight: 700; font-family: monospace, monospace; font-variant-numeric: tabular-nums; text-align: right; padding: 4px 0;">
                    ${tripAmount}
                  </td>
                </tr>
              </table>
            </div>
          ` : ''}

          <!-- Action Button -->
          <div style="text-align: center; margin: 28px 0 16px 0;">
            <a href="${ctaUrl}" style="background-color: #533AFD; color: #FFFFFF; padding: 13px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; letter-spacing: -0.01em;">
              ${escapeHtml(ctaLabel)} &rarr;
            </a>
          </div>

          <p style="color: #64748B; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0; text-align: center;">
            Or copy and paste this URL into your browser:<br/>
            <a href="${ctaUrl}" style="color: #533AFD; word-break: break-all;">${ctaUrl}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 28px 0;" />
          <p style="color: #94A3B8; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
            ${footerNote || 'This is an automated transactional message from TripFlow Corporate Travel Governance.'}
          </p>
        </div>
      </div>
    `;
  }

  async sendPasswordResetEmail(
    toEmail: string,
    recipientName: string,
    resetUrl: string
  ): Promise<EmailResult> {
    const transporter = await this.getTransporter();

    const html = this.renderBaseEmail({
      recipientName,
      headline: 'Reset Your Password',
      badgeText: 'Security',
      badgeBg: '#EEF2FF',
      badgeColor: '#4338CA',
      leadMessage: 'We received a request to reset the password for your TripFlow account. Click the button below to choose a new password:',
      ctaLabel: 'Reset Password',
      ctaUrl: resetUrl,
      footerNote: 'This link will expire in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.',
    });

    const mailOptions = {
      from: config.smtp.from,
      to: toEmail,
      subject: 'Reset Your TripFlow Password',
      text: `Hello ${recipientName},\n\nYou requested to reset your TripFlow password. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you did not request this, please ignore this email.\n\nBest regards,\nThe TripFlow Team`,
      html,
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

  async sendTravelSubmittedEmail(
    managerEmail: string,
    managerName: string,
    requesterName: string,
    trip: any
  ): Promise<EmailResult> {
    const transporter = await this.getTransporter();
    const ctaUrl = `${config.clientUrl || 'http://localhost:5173'}/dashboard?tab=notifications`;
    const subject = `New Travel Request from ${requesterName} awaiting review`;

    const html = this.renderBaseEmail({
      recipientName: managerName,
      headline: 'New Travel Request Submitted',
      badgeText: 'Review Required',
      badgeBg: '#EEF2FF',
      badgeColor: '#4338CA',
      leadMessage: `<strong>${escapeHtml(requesterName)}</strong> has submitted a new corporate travel authorization request awaiting your review.`,
      trip,
      ctaLabel: 'Review Travel Request',
      ctaUrl
    });

    const info = await transporter.sendMail({
      from: config.smtp.from,
      to: managerEmail,
      subject,
      text: `Hello ${managerName},\n\n${requesterName} has submitted a travel request "${trip?.title || 'Travel Request'}" awaiting your review.\n\nView details: ${ctaUrl}\n\nTripFlow Team`,
      html
    });

    return {
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    };
  }

  async sendRevisionRequestedEmail(
    employeeEmail: string,
    employeeName: string,
    actorName: string,
    remarks: string,
    trip: any
  ): Promise<EmailResult> {
    const transporter = await this.getTransporter();
    const ctaUrl = `${config.clientUrl || 'http://localhost:5173'}/dashboard?tab=notifications`;
    const tripTitle = trip?.title || 'Travel Request';
    const subject = `Action Required: Revisions requested on ${tripTitle}`;

    const html = this.renderBaseEmail({
      recipientName: employeeName,
      headline: 'Action Required: Revisions Requested',
      badgeText: 'Revision Requested',
      badgeBg: '#FEF3C7',
      badgeColor: '#92400E',
      leadMessage: `<strong>${escapeHtml(actorName)}</strong> has reviewed your travel request and requested revisions before approval can proceed.`,
      calloutTitle: 'Reviewer Feedback',
      calloutContent: remarks,
      trip,
      ctaLabel: 'Revise & Resubmit Request',
      ctaUrl
    });

    const info = await transporter.sendMail({
      from: config.smtp.from,
      to: employeeEmail,
      subject,
      text: `Hello ${employeeName},\n\nRevisions were requested on "${tripTitle}" by ${actorName}:\n\nFeedback: ${remarks}\n\nPlease revise and resubmit: ${ctaUrl}\n\nTripFlow Team`,
      html
    });

    return {
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    };
  }

  async sendTravelApprovedEmail(
    employeeEmail: string,
    employeeName: string,
    trip: any
  ): Promise<EmailResult> {
    const transporter = await this.getTransporter();
    const ctaUrl = `${config.clientUrl || 'http://localhost:5173'}/dashboard?tab=notifications`;
    const tripTitle = trip?.title || 'Travel Request';
    const subject = `Travel Request Approved: ${tripTitle}`;

    const html = this.renderBaseEmail({
      recipientName: employeeName,
      headline: 'Travel Request Approved',
      badgeText: 'Approved',
      badgeBg: '#D1FAE5',
      badgeColor: '#065F46',
      leadMessage: `Your travel request <strong>${escapeHtml(tripTitle)}</strong> has received executive approval. You are cleared to proceed with your scheduled itinerary.`,
      trip,
      ctaLabel: 'View Approved Itinerary',
      ctaUrl
    });

    const info = await transporter.sendMail({
      from: config.smtp.from,
      to: employeeEmail,
      subject,
      text: `Hello ${employeeName},\n\nYour travel request "${tripTitle}" has been approved.\n\nView details: ${ctaUrl}\n\nTripFlow Team`,
      html
    });

    return {
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    };
  }

  async sendTravelSettledEmail(
    employeeEmail: string,
    employeeName: string,
    trip: any
  ): Promise<EmailResult> {
    const transporter = await this.getTransporter();
    const ctaUrl = `${config.clientUrl || 'http://localhost:5173'}/dashboard?tab=notifications`;
    const tripTitle = trip?.title || 'Travel Request';
    const subject = `Reimbursement Settled: ${tripTitle}`;

    const html = this.renderBaseEmail({
      recipientName: employeeName,
      headline: 'Expense Reimbursement Settled',
      badgeText: 'Disbursed & Settled',
      badgeBg: '#ECFDF5',
      badgeColor: '#047857',
      leadMessage: `Your reimbursement claim for <strong>${escapeHtml(tripTitle)}</strong> has been settled and disbursed by corporate accounting.`,
      trip,
      ctaLabel: 'View Settlement Summary',
      ctaUrl
    });

    const info = await transporter.sendMail({
      from: config.smtp.from,
      to: employeeEmail,
      subject,
      text: `Hello ${employeeName},\n\nYour expense reimbursement for "${tripTitle}" has been settled and processed.\n\nView details: ${ctaUrl}\n\nTripFlow Team`,
      html
    });

    return {
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    };
  }

  async sendTravelRejectedEmail(
    employeeEmail: string,
    employeeName: string,
    reason: string,
    trip: any
  ): Promise<EmailResult> {
    const transporter = await this.getTransporter();
    const ctaUrl = `${config.clientUrl || 'http://localhost:5173'}/dashboard?tab=notifications`;
    const tripTitle = trip?.title || 'Travel Request';
    const subject = `Travel Request Update: ${tripTitle}`;

    const html = this.renderBaseEmail({
      recipientName: employeeName,
      headline: 'Travel Request Update',
      badgeText: 'Declined',
      badgeBg: '#FEE2E2',
      badgeColor: '#991B1B',
      leadMessage: `Your travel request <strong>${escapeHtml(tripTitle)}</strong> has been denied during review.`,
      calloutTitle: 'Reason for Decision',
      calloutContent: reason,
      trip,
      ctaLabel: 'View Request Details',
      ctaUrl
    });

    const info = await transporter.sendMail({
      from: config.smtp.from,
      to: employeeEmail,
      subject,
      text: `Hello ${employeeName},\n\nYour travel request "${tripTitle}" has been declined.\n\nReason: ${reason}\n\nView details: ${ctaUrl}\n\nTripFlow Team`,
      html
    });

    return {
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    };
  }

  async sendManagerOversightEmail(
    adminEmail: string,
    adminName: string,
    managerName: string,
    trip: any
  ): Promise<EmailResult> {
    const transporter = await this.getTransporter();
    const ctaUrl = `${config.clientUrl || 'http://localhost:5173'}/dashboard?tab=notifications`;
    const subject = `Executive Oversight Required: Manager personal travel by ${managerName}`;

    const html = this.renderBaseEmail({
      recipientName: adminName,
      headline: 'Executive Oversight: Manager Travel Request',
      badgeText: 'Manager Oversight',
      badgeBg: '#EDE9FE',
      badgeColor: '#5B21B6',
      leadMessage: `Manager <strong>${escapeHtml(managerName)}</strong> has submitted a personal travel request requiring Tier 2 executive governance clearance.`,
      trip,
      ctaLabel: 'Review Manager Request',
      ctaUrl
    });

    const info = await transporter.sendMail({
      from: config.smtp.from,
      to: adminEmail,
      subject,
      text: `Hello ${adminName},\n\nExecutive oversight is required: Manager ${managerName} has submitted a personal travel request "${trip?.title || 'Travel Request'}".\n\nReview request: ${ctaUrl}\n\nTripFlow Team`,
      html
    });

    return {
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    };
  }
}

export const emailService = new EmailService();
