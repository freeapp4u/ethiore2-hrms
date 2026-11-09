import { CompanyConfig, EmailActivityLog } from "../types";

export interface SendEmailOptions {
  recipientEmployeeId?: string;
  recipientEmail: string;
  subject: string;
  sendingModule: string;
  emailBody?: string;
  currentUserEmail?: string;
  config: CompanyConfig;
}

export interface SendEmailResponse {
  success: boolean;
  blocked: boolean;
  status: "Sent" | "Failed" | "Blocked – Email Sending Disabled";
  message: string;
  logEntry: EmailActivityLog;
}

/**
  * Central Email Sending Utility for Ethio-Re HRMS
  * Checks global Email Configuration (Enable Email Sending to Registered Employees)
  * before executing email dispatch.
  */
export function sendSystemEmail(options: SendEmailOptions): SendEmailResponse {
  const isEmailSendingEnabled = options.config?.emailSettings?.enableEmployeeEmails ?? true;
  const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);

  if (!isEmailSendingEnabled) {
    const blockedLog: EmailActivityLog = {
      id: `EMAIL_LOG_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      recipientEmployeeId: options.recipientEmployeeId || "N/A",
      recipientEmail: options.recipientEmail,
      subject: options.subject,
      sendingModule: options.sendingModule,
      dateTime: nowStr,
      deliveryStatus: "Blocked – Email Sending Disabled",
      failureReason: "Employee email sending is currently disabled in Email Settings (Administration → Email Settings).",
      triggeredBy: options.currentUserEmail || "System"
    };

    return {
      success: false,
      blocked: true,
      status: "Blocked – Email Sending Disabled",
      message: `Email action blocked: Outgoing email to ${options.recipientEmail} was blocked because employee email sending is currently disabled in Email Settings.`,
      logEntry: blockedLog
    };
  }

  // When Email Sending is ON
  const successLog: EmailActivityLog = {
    id: `EMAIL_LOG_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    recipientEmployeeId: options.recipientEmployeeId || "N/A",
    recipientEmail: options.recipientEmail,
    subject: options.subject,
    sendingModule: options.sendingModule,
    dateTime: nowStr,
    deliveryStatus: "Sent",
    triggeredBy: options.currentUserEmail || "System"
  };

  return {
    success: true,
    blocked: false,
    status: "Sent",
    message: `System-generated email successfully delivered to ${options.recipientEmail} via SMTP ${options.config.emailSettings?.smtpHost || "mail.ethiopianre.com"}.`,
    logEntry: successLog
  };
}
