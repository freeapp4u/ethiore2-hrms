import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to fetch M365 OAuth 2.0 access token using Entra ID Client Credentials Flow
async function getM365AccessToken(tenantId: string, clientId: string, clientSecret: string): Promise<string> {
  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://outlook.office365.com/.default',
    grant_type: 'client_credentials'
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Microsoft Entra ID Token acquisition failed (${response.status}): ${errText}`);
  }

  const data = await response.json() as { access_token: string; expires_in: number };
  return data.access_token;
}

// API ROUTE: M365 Connection & XOAUTH2 Diagnostics Test
app.post('/api/email/test', async (req, res) => {
  const { recipientEmail, customTenantId, customClientId, customClientSecret, customSenderEmail } = req.body || {};

  const tenantId = customTenantId || process.env.M365_TENANT_ID;
  const clientId = customClientId || process.env.M365_CLIENT_ID;
  const clientSecret = customClientSecret || process.env.M365_CLIENT_SECRET;
  const senderEmail = customSenderEmail || process.env.M365_SENDER_EMAIL || 'tilahun_hr_officer@ethiopianre.com';

  const diagnosticsLog: string[] = [];
  diagnosticsLog.push(`[${new Date().toISOString()}] Initiating M365 SMTP OAuth 2.0 Diagnostic Suite...`);
  diagnosticsLog.push(`Target Sender Mailbox: ${senderEmail} (Shared Mailbox)`);
  diagnosticsLog.push(`SMTP Endpoint: smtp.office365.com:587 (STARTTLS, TLS 1.2+)`);

  // Check if Entra ID credentials are provided
  if (!tenantId || !clientId || !clientSecret) {
    diagnosticsLog.push(`[PENDING ENTRA SETUP] Microsoft Entra ID secrets not configured in environment.`);
    diagnosticsLog.push(`Required environment variables: M365_TENANT_ID, M365_CLIENT_ID, M365_CLIENT_SECRET`);
    
    return res.status(200).json({
      success: false,
      status: 'pending_entra_setup',
      message: 'Microsoft 365 Entra ID credentials have not been configured yet. Please complete Microsoft Entra ID Application Registration and set M365_TENANT_ID, M365_CLIENT_ID, and M365_CLIENT_SECRET secrets.',
      diagnosticsLog,
      nextSteps: [
        '1. Register ETRHRMS Email Service in Microsoft Entra ID App Registrations.',
        '2. Obtain Tenant ID, Application (Client) ID, and generate a Client Secret.',
        '3. Run PowerShell script register_exchange_sendas.ps1 to grant SMTP.SendAsApp permission for tilahun_hr_officer@ethiopianre.com.',
        '4. Set M365_TENANT_ID, M365_CLIENT_ID, and M365_CLIENT_SECRET in Firebase Functions Secrets / Environment.'
      ]
    });
  }

  try {
    diagnosticsLog.push(`1. Requesting OAuth 2.0 access token from Microsoft Entra ID...`);
    const accessToken = await getM365AccessToken(tenantId, clientId, clientSecret);
    diagnosticsLog.push(`✓ OAuth 2.0 Access Token acquired successfully! Token length: ${accessToken.length} bytes`);

    diagnosticsLog.push(`2. Configuring Nodemailer XOAUTH2 SMTP Transport (smtp.office365.com:587)...`);
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false, // STARTTLS
      auth: {
        type: 'OAuth2',
        user: senderEmail,
        accessToken: accessToken
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: true
      }
    });

    diagnosticsLog.push(`3. Verifying SMTP connection and STARTTLS handshake...`);
    await transporter.verify();
    diagnosticsLog.push(`✓ SMTP STARTTLS Handshake and XOAUTH2 Authentication Verified!`);

    if (recipientEmail) {
      diagnosticsLog.push(`4. Dispatching Test Email to ${recipientEmail}...`);
      const info = await transporter.sendMail({
        from: `"${process.env.M365_SENDER_NAME || 'Ethiopian Reinsurance HRMS'}" <${senderEmail}>`,
        to: recipientEmail,
        subject: 'ETRHRMS - Microsoft 365 SMTP OAuth 2.0 Integration Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; rounded: 12px; padding: 24px;">
            <div style="background-color: #002B5B; padding: 16px; text-align: center; border-radius: 8px 8px 0 0;">
              <h2 style="color: #FED100; margin: 0;">Ethiopian Reinsurance S.C.</h2>
              <p style="color: #ffffff; font-size: 12px; margin: 4px 0 0 0;">የኢትዮጵያ ጠለፋ መድን አ.ማ. | HRMS</p>
            </div>
            <div style="padding: 20px; background-color: #ffffff;">
              <h3 style="color: #002B5B; margin-top: 0;">Microsoft 365 SMTP OAuth 2.0 Connection Verified</h3>
              <p style="color: #334155; font-size: 14px; line-height: 1.6;">
                This test email confirms that <strong>ETRHRMS</strong> has successfully connected to Microsoft 365 Exchange Online using <strong>SMTP XOAUTH2 Modern Authentication</strong>.
              </p>
              <div style="background-color: #f8fafc; padding: 12px; border-left: 4px solid #002B5B; font-size: 12px; color: #475569;">
                <p style="margin: 2px 0;"><strong>Sender Mailbox:</strong> ${senderEmail}</p>
                <p style="margin: 2px 0;"><strong>SMTP Server:</strong> smtp.office365.com:587 (STARTTLS)</p>
                <p style="margin: 2px 0;"><strong>Authentication:</strong> OAuth 2.0 Client Credentials (XOAUTH2)</p>
                <p style="margin: 2px 0;"><strong>Timestamp:</strong> ${new Date().toUTCString()}</p>
              </div>
            </div>
            <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 11px; color: #64748b; border-radius: 0 0 8px 8px;">
              © ${new Date().getFullYear()} Ethiopian Reinsurance S.C. All rights reserved.
            </div>
          </div>
        `
      });
      diagnosticsLog.push(`✓ Test Email Dispatched Successfully! Message ID: ${info.messageId}`);
    }

    return res.status(200).json({
      success: true,
      status: 'connected',
      message: 'Microsoft 365 SMTP XOAUTH2 Authentication and Connection Succeeded!',
      diagnosticsLog
    });

  } catch (err: any) {
    diagnosticsLog.push(`[ERROR] ${err.message || 'Unknown SMTP error'}`);
    return res.status(200).json({
      success: false,
      status: 'error',
      message: err.message || 'SMTP Connection Test Failed',
      diagnosticsLog
    });
  }
});

// API ROUTE: Send General HRMS Email
app.post('/api/email/send', async (req, res) => {
  const { recipientEmail, subject, bodyHtml, senderName, category } = req.body || {};

  if (!recipientEmail || !subject || !bodyHtml) {
    return res.status(400).json({ error: 'Missing required parameters: recipientEmail, subject, bodyHtml' });
  }

  const tenantId = process.env.M365_TENANT_ID;
  const clientId = process.env.M365_CLIENT_ID;
  const clientSecret = process.env.M365_CLIENT_SECRET;
  const senderEmail = process.env.M365_SENDER_EMAIL || 'tilahun_hr_officer@ethiopianre.com';

  if (!tenantId || !clientId || !clientSecret) {
    return res.status(200).json({
      success: false,
      status: 'pending_entra_setup',
      message: 'Email logged as Pending - Microsoft 365 Entra ID secrets not yet configured.'
    });
  }

  try {
    const accessToken = await getM365AccessToken(tenantId, clientId, clientSecret);
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        type: 'OAuth2',
        user: senderEmail,
        accessToken
      }
    });

    const info = await transporter.sendMail({
      from: `"${senderName || 'Ethiopian Reinsurance HRMS'}" <${senderEmail}>`,
      to: recipientEmail,
      subject,
      html: bodyHtml
    });

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      status: 'Sent'
    });
  } catch (err: any) {
    console.error('Send mail error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to send email'
    });
  }
});

// GET status endpoint
app.get('/api/email/status', (_req, res) => {
  const hasTenantId = Boolean(process.env.M365_TENANT_ID);
  const hasClientId = Boolean(process.env.M365_CLIENT_ID);
  const hasClientSecret = Boolean(process.env.M365_CLIENT_SECRET);
  const isConfigured = hasTenantId && hasClientId && hasClientSecret;

  return res.json({
    provider: 'Microsoft 365 Exchange Online',
    mailboxType: 'Shared Mailbox',
    senderEmail: process.env.M365_SENDER_EMAIL || 'tilahun_hr_officer@ethiopianre.com',
    senderDisplayName: 'Ethiopian Reinsurance HRMS',
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    encryption: 'STARTTLS (TLS 1.2+)',
    authMechanism: 'OAuth 2.0 (XOAUTH2)',
    authFlow: 'Microsoft Entra ID Client Credentials Flow',
    status: isConfigured ? 'Configured' : 'Pending Entra ID Setup',
    configuredSecrets: {
      tenantId: hasTenantId,
      clientId: hasClientId,
      clientSecret: hasClientSecret
    }
  });
});

// Vite middleware in dev mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`ETRHRMS Server running on http://localhost:${PORT}`);
  });
}

startServer();
