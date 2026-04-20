import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";
import type { Configuration, RedirectRequest, AuthenticationResult } from "@azure/msal-browser";

const msalConfig: Configuration = {
  auth: {
    clientId: "6011c93e-17a3-4d85-b297-49422fc7fe97",
    authority: "https://login.microsoftonline.com/dcd857fa-da1c-42e4-801b-702d52e946b1",
    redirectUri: "http://localhost:5173",
  },
  cache: {
    cacheLocation: "sessionStorage",
  }
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest: RedirectRequest = {
  scopes: ["api://6011c93e-17a3-4d85-b297-49422fc7fe97/access_as_user"]
};

const AUTH_API_BASE = 'http://localhost:8081';

export interface BackendTokenResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export const authService = {
  // Track initialization state to prevent redundant calls
  isInitialized: false,

  async initialize() {
    if (!this.isInitialized) {
      await msalInstance.initialize();
      this.isInitialized = true;
    }
    return msalInstance.handleRedirectPromise();
  },

  async login() {
    // Ensure MSAL is initialized before attempting login
    await this.initialize();

    try {
      // 1. Actually check if there are already accounts
      const currentAccounts = msalInstance.getAllAccounts();
      if (currentAccounts.length > 0) {
        // User is already logged in
        return currentAccounts[0]; 
      }

      // 2. If no accounts, redirect to Microsoft login
      // Include offline_access so Azure AD issues a refresh token
      const request = { scopes: ["openid", "profile", "User.Read", "offline_access"] };
      await msalInstance.loginRedirect(request);
      // Page navigates away — no return value

    } catch (error: any) {
      // 3. Handle the specific "interaction_in_progress" error
      if (error.errorCode === "interaction_in_progress") {
        console.warn("An interaction is already in progress. Please check for an open popup window.");
      } else {
        console.error("Login failed:", error);
      }
      throw error;
    }
  },

  logout() {
    this.clearBackendTokens();
    return msalInstance.logoutRedirect();
  },

  // ── Azure AD token (used only for the initial exchange) ──

  async getAzureToken(): Promise<string | null> {
    const account = msalInstance.getAllAccounts()[0];
    if (!account) return null;

    try {
      const tokenResponse: AuthenticationResult = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });
      return tokenResponse.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        await msalInstance.acquireTokenRedirect({ ...loginRequest, account });
        return null;
      }
      console.error("Azure token acquisition failed:", error);
      throw error;
    }
  },

  // ── Backend token management ──

  /** Exchange an Azure AD token for platform access + refresh tokens. */
  async exchangeToken(): Promise<BackendTokenResult | null> {
    const azureToken = await this.getAzureToken();
    if (!azureToken) return null;

    const response = await fetch(`${AUTH_API_BASE}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ azureToken }),
    });

    if (!response.ok) {
      console.error('Token exchange failed:', response.status);
      return null;
    }

    const data: BackendTokenResult = await response.json();
    this.storeBackendTokens(data);
    return data;
  },

  /** Use the stored refresh token to get a new access + refresh token pair. */
  async refreshBackendToken(): Promise<BackendTokenResult | null> {
    const refreshToken = sessionStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    const response = await fetch(`${AUTH_API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      this.clearBackendTokens();
      return null;
    }

    const data: BackendTokenResult = await response.json();
    this.storeBackendTokens(data);
    return data;
  },

  storeBackendTokens(tokens: BackendTokenResult) {
    sessionStorage.setItem('backendAccessToken', tokens.accessToken);
    sessionStorage.setItem('refreshToken', tokens.refreshToken);
    sessionStorage.setItem('tokenExpiry', String(Date.now() + tokens.expiresIn * 1000));
  },

  clearBackendTokens() {
    sessionStorage.removeItem('backendAccessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('tokenExpiry');
  },

  getBackendAccessToken(): string | null {
    return sessionStorage.getItem('backendAccessToken');
  },

  getBackendTokenExpiry(): Date | null {
    const ms = sessionStorage.getItem('tokenExpiry');
    return ms ? new Date(Number(ms)) : null;
  },

  /**
   * Get a valid backend access token. Tries (in order):
   * 1. Return the cached token if still valid
   * 2. Refresh using the stored refresh token
   * 3. Full exchange with a fresh Azure AD token
   */
  async getValidBackendToken(): Promise<BackendTokenResult | null> {
    const token = this.getBackendAccessToken();
    const expiry = this.getBackendTokenExpiry();

    // Still valid with ≥ 2 min buffer
    if (token && expiry && expiry.getTime() - Date.now() > 2 * 60 * 1000) {
      return { accessToken: token, refreshToken: sessionStorage.getItem('refreshToken')!, expiresIn: Math.floor((expiry.getTime() - Date.now()) / 1000) };
    }

    // Try refresh
    const refreshed = await this.refreshBackendToken();
    if (refreshed) return refreshed;

    // Fallback: full exchange
    return await this.exchangeToken();
  },

  // Keep legacy getToken for backwards compatibility
  async getToken(): Promise<string | null> {
    const result = await this.getValidBackendToken();
    return result?.accessToken ?? null;
  }
};