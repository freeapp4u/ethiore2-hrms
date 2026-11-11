import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendM365Email, SendEmailOptions } from './emailService';

admin.initializeApp();

/**
 * Firebase Cloud Function: sendEmailNotification
 * Centralized email delivery service using Microsoft 365 Exchange Online SMTP XOAUTH2.
 * Uses Firebase Secret Manager: M365_TENANT_ID, M365_CLIENT_ID, M365_CLIENT_SECRET, M365_SENDER_EMAIL
 */
export const sendEmailNotification = functions.runWith({
  secrets: ['M365_TENANT_ID', 'M365_CLIENT_ID', 'M365_CLIENT_SECRET', 'M365_SENDER_EMAIL']
}).https.onCall(async (data: SendEmailOptions, context) => {
  // Enforce auth check if required
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The request must be authenticated with Firebase Auth.');
  }

  const logRef = admin.firestore().collection('email_delivery_logs').doc();
  const emailLogData = {
    id: logRef.id,
    recipient: data.recipientEmail,
    sender: process.env.M365_SENDER_EMAIL || 'tilahun_hr_officer@ethiopianre.com',
    subject: data.title,
    notificationCategory: data.category || 'General Notification',
    relatedRecordId: data.relatedRecordId || '',
    dateTime: new Date().toISOString(),
    deliveryStatus: 'Processing',
    errorDetails: '',
    retryCount: 0,
    triggeredBy: context.auth.token.email || 'System'
  };

  await logRef.set(emailLogData);

  try {
    const result = await sendM365Email(data);

    await logRef.update({
      deliveryStatus: 'Sent',
      messageId: result.messageId,
      sentTimestamp: result.timestamp
    });

    return { success: true, messageId: result.messageId, logId: logRef.id };
  } catch (err: any) {
    console.error('sendEmailNotification error:', err);

    await logRef.update({
      deliveryStatus: 'Failed',
      errorDetails: err.message || 'Unknown delivery failure'
    });

    throw new functions.https.HttpsError('internal', err.message || 'Failed to deliver email.');
  }
});

/**
 * Firebase Cloud Function: testM365Connection
 * Administrator connection test for M365 Exchange Online SMTP OAuth 2.0.
 */
export const testM365Connection = functions.runWith({
  secrets: ['M365_TENANT_ID', 'M365_CLIENT_ID', 'M365_CLIENT_SECRET', 'M365_SENDER_EMAIL']
}).https.onCall(async (data: { recipientEmail?: string }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Administrator authentication required.');
  }

  try {
    const result = await sendM365Email({
      recipientEmail: data.recipientEmail || context.auth.token.email || 'tilahun_hr_officer@ethiopianre.com',
      employeeName: 'Administrator',
      title: 'M365 Cloud Function SMTP Connection Test',
      details: 'This test message confirms that the Firebase Cloud Function has successfully authenticated with Microsoft 365 Exchange Online using OAuth 2.0 Modern Auth (XOAUTH2).',
      category: 'System Diagnostics'
    });

    return { success: true, status: 'connected', messageId: result.messageId };
  } catch (err: any) {
    return { success: false, status: 'error', error: err.message };
  }
});
