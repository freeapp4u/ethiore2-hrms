import { CompanyConfig, EmailActivityLog, EmailTemplate } from "../types";

export interface DispatchEmailParams {
  recipientEmail: string;
  recipientEmployeeId?: string;
  employeeName: string;
  subject: string;
  category: "Authentication" | "Employee Management" | "Leave Management" | "Payroll" | "Administration";
  details: string;
  actionUrl?: string;
  actionText?: string;
  relatedRecordId?: string;
  triggeredBy: string;
  config: CompanyConfig;
  emailLogs: EmailActivityLog[];
  onUpdateEmailLogs: (newLogs: EmailActivityLog[]) => void;
}

export async function dispatchHrmsEmail(params: DispatchEmailParams): Promise<{ success: boolean; message: string; logItem: EmailActivityLog }> {
  const {
    recipientEmail,
    recipientEmployeeId,
    employeeName,
    subject,
    category,
    details,
    actionUrl,
    actionText,
    relatedRecordId,
    triggeredBy,
    config,
    emailLogs,
    onUpdateEmailLogs
  } = params;

  const emailSettings = config.emailSettings || {
    enableEmployeeEmails: true,
    provider: "Microsoft 365 Exchange Online",
    mailboxType: "Shared Mailbox",
    smtpHost: "smtp.office365.com",
    smtpPort: 587,
    encryption: "STARTTLS (TLS 1.2+)",
    authMechanism: "OAuth 2.0 (XOAUTH2)",
    authFlow: "Microsoft Entra ID Client Credentials Flow",
    smtpSenderEmail: "tilahun_hr_officer@ethiopianre.com",
    smtpSenderName: "Ethiopian Reinsurance HRMS",
    useTlsSsl: true,
    m365ConnectionStatus: "Pending Entra ID Administrator Setup"
  };

  const senderEmail = emailSettings.smtpSenderEmail || "tilahun_hr_officer@ethiopianre.com";
  const senderName = emailSettings.smtpSenderName || "Ethiopian Reinsurance HRMS";

  // Check 1: Master ON/OFF Switch for employee email sending
  if (!emailSettings.enableEmployeeEmails) {
    const blockedLog: EmailActivityLog = {
      id: `LOG_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      recipientEmployeeId,
      recipientEmail,
      senderEmail,
      subject,
      sendingModule: category,
      dateTime: new Date().toISOString().replace("T", " ").substring(0, 19),
      deliveryStatus: "Blocked – Email Sending Disabled",
      failureReason: "Master Employee Email Notification Switch is currently OFF.",
      relatedRecordId,
      retryCount: 0,
      triggeredBy
    };

    onUpdateEmailLogs([blockedLog, ...emailLogs]);
    return {
      success: false,
      message: "Email dispatch blocked: Employee email notifications are turned OFF in Administration settings.",
      logItem: blockedLog
    };
  }

  // Check 2: Category Notification Toggle Switch
  const toggles = emailSettings.notificationToggles || {
    authAlerts: true,
    employeeEvents: true,
    leaveWorkflow: true,
    payrollPayslips: true,
    securityAlerts: true
  };

  let isCategoryEnabled = true;
  if (category === "Authentication" && !toggles.authAlerts) isCategoryEnabled = false;
  if (category === "Employee Management" && !toggles.employeeEvents) isCategoryEnabled = false;
  if (category === "Leave Management" && !toggles.leaveWorkflow) isCategoryEnabled = false;
  if (category === "Payroll" && !toggles.payrollPayslips) isCategoryEnabled = false;
  if (category === "Administration" && !toggles.securityAlerts) isCategoryEnabled = false;

  if (!isCategoryEnabled) {
    const blockedLog: EmailActivityLog = {
      id: `LOG_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      recipientEmployeeId,
      recipientEmail,
      senderEmail,
      subject,
      sendingModule: category,
      dateTime: new Date().toISOString().replace("T", " ").substring(0, 19),
      deliveryStatus: "Blocked – Email Sending Disabled",
      failureReason: `Email notification category '${category}' is currently disabled in Email Settings.`,
      relatedRecordId,
      retryCount: 0,
      triggeredBy
    };

    onUpdateEmailLogs([blockedLog, ...emailLogs]);
    return {
      success: false,
      message: `Email dispatch blocked: Notification category '${category}' is disabled.`,
      logItem: blockedLog
    };
  }

  // Construct Responsive Ethiopian Reinsurance HTML Email Body
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #002B5B; padding: 20px; text-align: center;">
        <h2 style="color: #FED100; margin: 0; font-size: 20px; font-weight: bold;">Ethiopian Reinsurance S.C.</h2>
        <p style="color: #ffffff; font-size: 12px; margin: 4px 0 0 0; font-weight: bold;">የኢትዮጵያ ጠለፋ መድን አ.ማ. | HRMS</p>
      </div>
      <div style="background-color: #001F44; padding: 10px 20px; border-top: 2px solid #FED100;">
        <h3 style="color: #ffffff; margin: 0; font-size: 14px;">${subject}</h3>
      </div>
      <div style="padding: 24px; font-size: 14px; color: #334155; line-height: 1.6;">
        <p style="font-weight: bold; color: #002B5B; margin-top: 0;">Dear ${employeeName},</p>
        <p style="margin: 12px 0;">${details}</p>
        ${actionUrl ? `
          <div style="margin: 20px 0; text-align: center;">
            <a href="${actionUrl}" style="background-color: #002B5B; color: #FED100; font-weight: bold; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 13px; display: inline-block;">
              ${actionText || 'View Details in HRMS'}
            </a>
          </div>
        ` : ''}
        <div style="margin-top: 20px; padding-top: 12px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #64748b;">
          <p style="margin: 0;"><strong>Notification Category:</strong> ${category}</p>
          <p style="margin: 2px 0;"><strong>Sender Mailbox:</strong> ${senderEmail}</p>
          <p style="margin: 2px 0;"><strong>Timestamp:</strong> ${new Date().toUTCString()}</p>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 12px 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
        © ${new Date().getFullYear()} Ethiopian Reinsurance S.C. All rights reserved.
      </div>
    </div>
  `;

  // Attempt Backend Dispatch via /api/email/send
  try {
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientEmail,
        subject,
        bodyHtml: htmlBody,
        senderName,
        category
      })
    });

    const data = await res.json() as { success: boolean; status?: string; message?: string; error?: string };

    if (data.success && data.status === "Sent") {
      const sentLog: EmailActivityLog = {
        id: `LOG_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        recipientEmployeeId,
        recipientEmail,
        senderEmail,
        subject,
        sendingModule: category,
        dateTime: new Date().toISOString().replace("T", " ").substring(0, 19),
        deliveryStatus: "Sent",
        relatedRecordId,
        retryCount: 0,
        triggeredBy
      };
      onUpdateEmailLogs([sentLog, ...emailLogs]);
      return { success: true, message: "Email sent successfully via M365 Exchange Online SMTP XOAUTH2.", logItem: sentLog };
    } else {
      // Pending Entra ID configuration or SMTP failure
      const failureReason = data.message || data.error || "Microsoft 365 Entra ID setup pending.";
      const failedLog: EmailActivityLog = {
        id: `LOG_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        recipientEmployeeId,
        recipientEmail,
        senderEmail,
        subject,
        sendingModule: category,
        dateTime: new Date().toISOString().replace("T", " ").substring(0, 19),
        deliveryStatus: "Failed",
        failureReason,
        relatedRecordId,
        retryCount: 0,
        triggeredBy
      };
      onUpdateEmailLogs([failedLog, ...emailLogs]);
      return { success: false, message: `Email delivery queued/failed: ${failureReason}`, logItem: failedLog };
    }
  } catch (netErr: any) {
    const failedLog: EmailActivityLog = {
      id: `LOG_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      recipientEmployeeId,
      recipientEmail,
      senderEmail,
      subject,
      sendingModule: category,
      dateTime: new Date().toISOString().replace("T", " ").substring(0, 19),
      deliveryStatus: "Failed",
      failureReason: netErr?.message || "Network connection to M365 Email Service failed.",
      relatedRecordId,
      retryCount: 0,
      triggeredBy
    };
    onUpdateEmailLogs([failedLog, ...emailLogs]);
    return { success: false, message: `Email delivery failed: ${netErr?.message || 'Network error'}`, logItem: failedLog };
  }
}
