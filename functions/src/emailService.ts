import * as nodemailer from 'nodemailer';
import { fetchM365OAuthToken } from './m365Auth';
import { generateBrandedHtmlTemplate, TemplateData } from './templates';

export interface SendEmailOptions {
  recipientEmail: string;
  employeeName: string;
  title: string;
  details: string;
  category: string;
  actionUrl?: string;
  actionText?: string;
  metadataFields?: { label: string; value: string }[];
  relatedRecordId?: string;
}

export async function sendM365Email(options: SendEmailOptions): Promise<{ messageId: string; timestamp: string }> {
  const tenantId = process.env.M365_TENANT_ID;
  const clientId = process.env.M365_CLIENT_ID;
  const clientSecret = process.env.M365_CLIENT_SECRET;
  const senderEmail = process.env.M365_SENDER_EMAIL || 'tilahun_hr_officer@ethiopianre.com';
  const senderDisplayName = process.env.M365_SENDER_NAME || 'Ethiopian Reinsurance HRMS';

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('M365 Email Service Error: Microsoft 365 Entra ID secrets (M365_TENANT_ID, M365_CLIENT_ID, M365_CLIENT_SECRET) are not configured.');
  }

  // 1. Fetch OAuth 2.0 Access Token
  const accessToken = await fetchM365OAuthToken(tenantId, clientId, clientSecret);

  // 2. Configure Nodemailer with XOAUTH2 Authentication
  const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false, // STARTTLS
    auth: {
      type: 'OAuth2',
      user: senderEmail,
      accessToken
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: true
    }
  });

  // 3. Build HTML Body
  const templateData: TemplateData = {
    employeeName: options.employeeName,
    title: options.title,
    details: options.details,
    actionUrl: options.actionUrl,
    actionText: options.actionText,
    metadataFields: options.metadataFields
  };

  const htmlContent = generateBrandedHtmlTemplate(templateData);

  // 4. Send Email via Exchange Online SMTP
  const info = await transporter.sendMail({
    from: `"${senderDisplayName}" <${senderEmail}>`,
    to: options.recipientEmail,
    subject: `[ETRHRMS] ${options.title}`,
    html: htmlContent
  });

  return {
    messageId: info.messageId,
    timestamp: new Date().toISOString()
  };
}
