/**
 * Ethiopian Reinsurance S.C. Responsive HTML Email Templates
 * Fully compatible with Microsoft Outlook and desktop/mobile email clients.
 */

export interface TemplateData {
  employeeName: string;
  title: string;
  details: string;
  actionUrl?: string;
  actionText?: string;
  metadataFields?: { label: string; value: string }[];
  dateTime?: string;
}

export function generateBrandedHtmlTemplate(data: TemplateData): string {
  const currentYear = new Date().getFullYear();
  const timestamp = data.dateTime || new Date().toUTCString();

  const metadataHtml = data.metadataFields && data.metadataFields.length > 0
    ? `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 16px 0; background-color: #f8fafc; border-left: 4px solid #002B5B; border-radius: 4px; padding: 12px;">
        ${data.metadataFields.map(f => `
          <tr>
            <td style="padding: 4px 8px; font-size: 13px; font-weight: bold; color: #002B5B; width: 140px;">${f.label}:</td>
            <td style="padding: 4px 8px; font-size: 13px; color: #334155;">${f.value}</td>
          </tr>
        `).join('')}
      </table>
    `
    : '';

  const actionButtonHtml = data.actionUrl
    ? `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
        <tr>
          <td align="center" bgcolor="#002B5B" style="border-radius: 8px;">
            <a href="${data.actionUrl}" target="_blank" style="font-size: 14px; font-family: Arial, sans-serif; font-weight: bold; color: #FED100; text-decoration: none; padding: 12px 24px; border-radius: 8px; border: 1px solid #001F44; display: inline-block;">
              ${data.actionText || 'View Details in ETRHRMS'}
            </a>
          </td>
        </tr>
      </table>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${data.title}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f1f5f9; font-family: Arial, Helvetica, sans-serif; }
  </style>
</head>
<body style="background-color: #f1f5f9; margin: 0; padding: 20px 0;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td bgcolor="#002B5B" style="padding: 24px; text-align: center;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <h1 style="color: #FED100; font-size: 22px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">Ethiopian Reinsurance S.C.</h1>
                    <p style="color: #ffffff; font-size: 13px; font-weight: bold; margin: 4px 0 0 0;">የኢትዮጵያ ጠለፋ መድን አ.ማ. | HRMS</p>
                    <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 8px 0 0 0;">Rising with Africa</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title Bar -->
          <tr>
            <td bgcolor="#001F44" style="padding: 12px 24px; border-top: 2px solid #FED100;">
              <h2 style="color: #ffffff; font-size: 16px; font-weight: bold; margin: 0;">${data.title}</h2>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 28px 24px; background-color: #ffffff;">
              <p style="font-size: 15px; font-weight: bold; color: #002B5B; margin-top: 0;">Dear ${data.employeeName},</p>
              
              <div style="font-size: 14px; color: #334155; line-height: 1.6; margin: 16px 0;">
                ${data.details}
              </div>

              ${metadataHtml}

              ${actionButtonHtml}

              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #64748b;">
                <p style="margin: 0;"><strong>Timestamp:</strong> ${timestamp}</p>
                <p style="margin: 4px 0 0 0;">This is an automated system notification from the Ethiopian Reinsurance HRMS Platform.</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#f8fafc" style="padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
              <p style="margin: 0; font-weight: bold; color: #002B5B;">Ethiopian Reinsurance S.C. (የኢትዮጵያ ጠለፋ መድን አ.ማ.)</p>
              <p style="margin: 4px 0 0 0;">Official HR Communication Service | Mailbox: tilahun_hr_officer@ethiopianre.com</p>
              <p style="margin: 4px 0 0 0;">© ${currentYear} Ethiopian Reinsurance S.C. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
