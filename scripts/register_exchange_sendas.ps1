<#
.SYNOPSIS
    Exchange Online Application SMTP.SendAsApp Configuration Script for ETRHRMS
    
.DESCRIPTION
    This script configures Microsoft Exchange Online to authorize ETRHRMS (using Microsoft Entra ID OAuth 2.0 Client Credentials Flow)
    to send emails via SMTP XOAUTH2 using shared mailbox: tilahun_hr_officer@ethiopianre.com.

.PREREQUISITES
    1. Installed Exchange Online PowerShell module V3: Install-Module -Name ExchangeOnlineManagement -Scope CurrentUser
    2. Microsoft Entra ID Application Registration completed for ETRHRMS with Application Client ID.
    3. Global Administrator or Exchange Administrator privileges.

.EXAMPLE
    .\register_exchange_sendas.ps1 -AppId "YOUR_ENTRA_CLIENT_ID" -ServicePrincipalObjectId "YOUR_ENTERPRISE_APP_OBJECT_ID"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$AppId,
    
    [Parameter(Mandatory=$true)]
    [string]$ServicePrincipalObjectId,
    
    [Parameter(Mandatory=$false)]
    [string]$SharedMailbox = "tilahun_hr_officer@ethiopianre.com"
)

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host " ETHIOPIAN REINSURANCE HRMS - EXCHANGE ONLINE APPLICATION SMTP SETUP" -ForegroundColor Yellow
Write-Host "==========================================================================" -ForegroundColor Cyan

# 1. Connect to Exchange Online
Write-Host "`n[Step 1/5] Connecting to Exchange Online PowerShell..." -ForegroundColor Green
Connect-ExchangeOnline -ShowBanner:$false

# 2. Register Service Principal in Exchange Online
Write-Host "`n[Step 2/5] Registering Enterprise Application Service Principal in Exchange Online..." -ForegroundColor Green
$existingSp = Get-ServicePrincipal -Identity $AppId -ErrorAction SilentlyContinue

if (-not $existingSp) {
    Write-Host "Registering Service Principal for AppId: $AppId (Object ID: $ServicePrincipalObjectId)" -ForegroundColor Gray
    New-ServicePrincipal -AppId $AppId -ServiceId $ServicePrincipalObjectId -DisplayName "ETRHRMS Email Delivery Service"
    Write-Host "Service Principal registered successfully." -ForegroundColor Green
} else {
    Write-Host "Service Principal already registered in Exchange Online." -ForegroundColor Yellow
}

# 3. Restrict Application Access to Shared Mailbox Only (RBAC Security Policy)
Write-Host "`n[Step 3/5] Creating Application Access Policy restricted to $SharedMailbox..." -ForegroundColor Green
$policyName = "ETRHRMS_MailboxAccessPolicy"
$existingPolicy = Get-ApplicationAccessPolicy -Identity $policyName -ErrorAction SilentlyContinue

if (-not $existingPolicy) {
    # Create mail-enabled security group or apply directly to shared mailbox
    New-ApplicationAccessPolicy -AppId $AppId -PolicyScopeGroupId $SharedMailbox -AccessRight RestrictAccess -Description "Restricts ETRHRMS email application to tilahun_hr_officer@ethiopianre.com only."
    Write-Host "Application Access Policy created successfully." -ForegroundColor Green
} else {
    Write-Host "Application Access Policy '$policyName' already exists." -ForegroundColor Yellow
}

# 4. Enable SMTP Client Authentication on Shared Mailbox
Write-Host "`n[Step 4/5] Enabling SMTP Client Authentication for Shared Mailbox: $SharedMailbox..." -ForegroundColor Green
Set-CASMailbox -Identity $SharedMailbox -SmtpClientAuthenticationDisabled $false
Write-Host "SMTP Client Authentication enabled for $SharedMailbox." -ForegroundColor Green

# 5. Test Access Policy Authorization
Write-Host "`n[Step 5/5] Testing Application Access Policy Authorization..." -ForegroundColor Green
$testResult = Test-ApplicationAccessPolicy -AppId $AppId -Identity $SharedMailbox
Write-Host "Test Result for $SharedMailbox :" -ForegroundColor Gray
$testResult | Format-List AccessCheckResult, ResultMessage

Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host " SETUP COMPLETE! M365 Exchange Online is now prepared for ETRHRMS XOAUTH2." -ForegroundColor Green
Write-Host " Next Step: Set M365_TENANT_ID, M365_CLIENT_ID, and M365_CLIENT_SECRET in ETRHRMS." -ForegroundColor Yellow
Write-Host "==========================================================================" -ForegroundColor Cyan
