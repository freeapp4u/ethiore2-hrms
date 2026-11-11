# ETHIOPIAN REINSURANCE S.C. (ETRHRMS)
## Microsoft 365 Exchange Online SMTP OAuth 2.0 Integration & Setup Guide

This guide provides step-by-step instructions for the **Microsoft 365 Global Administrator / Exchange Administrator** and the **ETRHRMS Developer** to complete the integration of Microsoft 365 Exchange Online email services using SMTP with OAuth 2.0 Modern Authentication (`XOAUTH2`).

---

### CONFIGURATION OVERVIEW
- **Provider:** Microsoft 365 Exchange Online
- **Mailbox Type:** Shared Mailbox
- **Sender Mailbox:** `tilahun_hr_officer@ethiopianre.com`
- **Sender Display Name:** `Ethiopian Reinsurance HRMS`
- **SMTP Host:** `smtp.office365.com`
- **SMTP Port:** `587`
- **Encryption:** `STARTTLS` (TLS 1.2+)
- **Authentication:** OAuth 2.0 Modern Authentication (`XOAUTH2`)
- **Flow:** Microsoft Entra ID Client Credentials Flow (Application Permissions)

---

### PART 1: MICROSOFT 365 ADMINISTRATOR STEPS

#### Step 1: Required Microsoft 365 Administrator Permissions
Ensure you have the following administrator roles before proceeding:
- **Global Administrator** OR **Application Administrator** (in Microsoft Entra ID)
- **Exchange Administrator** (in Microsoft 365 Admin Center)

---

#### Step 2: Register ETRHRMS Email Service in Microsoft Entra ID
1. Log in to the [Microsoft Entra Admin Center](https://entra.microsoft.com/).
2. Navigate to **Identity → Applications → App registrations**.
3. Click **+ New registration**.
4. Enter Registration Details:
   - **Name:** `ETRHRMS Email Service`
   - **Supported account types:** `Accounts in this organizational directory only (Single tenant - Ethiopian Reinsurance)`
   - **Redirect URI:** Leave blank (Client Credentials Flow does not use redirect URIs).
5. Click **Register**.

---

#### Step 3: Obtain Tenant ID and Application (Client) ID
1. On the **Overview** page of the registered app:
   - Copy the **Application (client) ID** (e.g., `a1b2c3d4-e5f6-7890-abcd-1234567890ab`).
   - Copy the **Directory (tenant) ID** (e.g., `f8e7d6c5-b4a3-2109-8765-432109876543`).
2. Navigate to **Identity → Applications → Enterprise applications**.
3. Search for `ETRHRMS Email Service` and copy the **Object ID** under Enterprise Application details (Note: This is distinct from the App Registration Object ID).

---

#### Step 4: Create and Securely Store Client Secret
1. In App Registrations, navigate to **Certificates & secrets → Client secrets**.
2. Click **+ New client secret**.
3. Add description: `ETRHRMS SMTP XOAUTH2 Production Secret`.
4. Set expiration (e.g., 24 months / Custom).
5. Click **Add**.
6. **CRITICAL:** Immediately copy the **Value** column of the client secret. Store it securely in a password manager. (It will not be displayed again).

---

#### Step 5: Configure API Permissions
1. In App Registrations, navigate to **API permissions**.
2. Click **+ Add a permission** → select **Office 365 Exchange Online**.
3. Choose **Application permissions**.
4. Select `full_access_as_app` or `SMTP.SendAsApp`.
5. Click **Add permissions**.
6. Click **Grant admin consent for Ethiopian Reinsurance S.C.** and confirm.

---

#### Step 6: Register Service Principal & Application Access Policy in Exchange Online
Open **PowerShell** on your workstation and install Exchange Online V3 module:

```powershell
Install-Module -Name ExchangeOnlineManagement -Scope CurrentUser
```

Run the automated script located at `/scripts/register_exchange_sendas.ps1`:

```powershell
.\scripts\register_exchange_sendas.ps1 `
  -AppId "YOUR_APPLICATION_CLIENT_ID" `
  -ServicePrincipalObjectId "YOUR_ENTERPRISE_APP_OBJECT_ID" `
  -SharedMailbox "tilahun_hr_officer@ethiopianre.com"
```

Manual PowerShell Commands Equivalent:
```powershell
# 1. Connect to Exchange Online
Connect-ExchangeOnline

# 2. Register Service Principal
New-ServicePrincipal -AppId <Client-ID> -ServiceId <Enterprise-App-Object-ID> -DisplayName "ETRHRMS Email Service"

# 3. Restrict Access Policy to tilahun_hr_officer@ethiopianre.com
New-ApplicationAccessPolicy -AppId <Client-ID> -PolicyScopeGroupId "tilahun_hr_officer@ethiopianre.com" -AccessRight RestrictAccess -Description "Restrict ETRHRMS Email service to shared mailbox."

# 4. Enable SMTP AUTH for Shared Mailbox
Set-CASMailbox -Identity "tilahun_hr_officer@ethiopianre.com" -SmtpClientAuthenticationDisabled $false

# 5. Test Access Policy
Test-ApplicationAccessPolicy -AppId <Client-ID> -Identity "tilahun_hr_officer@ethiopianre.com"
```

---

### PART 2: ETRHRMS DEVELOPER & DEPLOYMENT STEPS

#### Step 7: Environment Configuration
Update `.env` or Firebase environment configuration:

```env
M365_TENANT_ID=your_directory_tenant_id
M365_CLIENT_ID=your_application_client_id
M365_CLIENT_SECRET=your_client_secret_value
M365_SENDER_EMAIL=tilahun_hr_officer@ethiopianre.com
M365_SENDER_NAME=Ethiopian Reinsurance HRMS
```

---

#### Step 8: Firebase Secret Manager Setup
Set the production secrets in Firebase Secret Manager for Cloud Functions:

```bash
firebase secrets:set M365_TENANT_ID
firebase secrets:set M365_CLIENT_ID
firebase secrets:set M365_CLIENT_SECRET
firebase secrets:set M365_SENDER_EMAIL
```

---

#### Step 9: Required npm Dependencies
Dependencies installed in `package.json` and `/functions/package.json`:
- `nodemailer`: `^6.9.10`
- `firebase-admin`: `^12.0.0`
- `firebase-functions`: `^5.0.0`
- `@types/nodemailer`: `^6.4.14`

---

#### Step 10: Local Testing & Validation
1. Start local ETRHRMS full-stack dev server: `npm run dev`
2. Open ETRHRMS as Administrator → navigate to **Administration → Company Settings → Email Configuration**.
3. Click **Test M365 Connection & XOAUTH2**.
4. Enter recipient email (e.g. `admin@ethiopianre.com`) and click **Send Test Email**.
5. Verify step-by-step diagnostic log:
   - OAuth 2.0 token acquisition from `https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token`
   - Nodemailer STARTTLS on `smtp.office365.com:587`
   - XOAUTH2 handshake
   - Email dispatch to recipient inbox.

---

#### Step 11: Firebase Cloud Functions Deployment
Deploy the backend email function to Firebase:

```bash
cd functions
npm run build
firebase deploy --only functions
```

---

#### Step 12: Troubleshooting Matrix

| Issue / Error | Cause | Solution |
|---|---|---|
| `535 5.7.139 Authentication unsuccessful, SmtpClientAuthenticationDisabled` | SMTP AUTH is disabled at tenant or mailbox level | Run `Set-CASMailbox -Identity tilahun_hr_officer@ethiopianre.com -SmtpClientAuthenticationDisabled $false` |
| `554 5.7.1 Client does not have permissions to send on behalf of the sender` | Service Principal not registered or `SMTP.SendAsApp` policy missing | Run `New-ServicePrincipal` and `New-ApplicationAccessPolicy` in Exchange Online |
| `AADSTS700016: Application with identifier was not found` | Invalid `M365_CLIENT_ID` or `M365_TENANT_ID` | Check App Registration Client ID and Directory Tenant ID in Entra Admin Center |
| `AADSTS7000215: Invalid client secret is provided` | Expired or incorrect `M365_CLIENT_SECRET` | Generate a new Client Secret in Entra ID and update Firebase Secret Manager |

---
*© Ethiopian Reinsurance S.C. | System Administration & Security Documentation*
