/**
 * Microsoft 365 Exchange Online OAuth 2.0 Modern Authentication Helper
 * Handles Client Credentials Flow via Microsoft Entra ID with scope: https://outlook.office365.com/.default
 */

export interface M365TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let cachedToken: string | null = null;
let tokenExpiryTime: number = 0;

export async function fetchM365OAuthToken(
  tenantId: string,
  clientId: string,
  clientSecret: string
): Promise<string> {
  const now = Date.now();
  // Return cached token if valid for at least 3 minutes
  if (cachedToken && tokenExpiryTime > now + 180000) {
    return cachedToken;
  }

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
    const errorBody = await response.text();
    throw new Error(`Microsoft Entra ID Token acquisition failed [${response.status}]: ${errorBody}`);
  }

  const data = (await response.json()) as M365TokenResponse;
  cachedToken = data.access_token;
  tokenExpiryTime = Date.now() + data.expires_in * 1000;

  return cachedToken;
}
