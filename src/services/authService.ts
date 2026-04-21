import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";
import type { Configuration, RedirectRequest, AuthenticationResult, AccountInfo } from "@azure/msal-browser";

const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: import.meta.env.VITE_AZURE_AUTHORITY,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI,
  },
  cache: {
    cacheLocation: "sessionStorage",
  }
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest: RedirectRequest = {
  scopes: [import.meta.env.VITE_AZURE_SCOPE]
};

const AUTH_API_BASE = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8081';

export interface BackendTokenResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

function extractFirstName(account: AccountInfo): string {
  const fullName = account.name?.trim();

  if (fullName) {
    return fullName.split(" ")[0];
  }

  const emailName = account.username?.split("@")[0] || "User";
  const firstPart = emailName.split(/[._-]/)[0];

  return firstPart.charAt(0).toUpperCase() + firstPart.slice(1).toLowerCase();
}

function extractRole(account: AccountInfo): string {
  const email = account.username?.toLowerCase() || "";

  if (email.includes("student")) {
    return "Student";
  }

  if (email.includes("staff")) {
    return "Staff";
  }

  return "User";
}

function storeUserDetails(account: AccountInfo) {
  const firstName = extractFirstName(account);
  const role = extractRole(account);

  localStorage.setItem("userFirstName", firstName);
  localStorage.setItem("userRole", role);
  localStorage.setItem("userFullName", account.name || firstName);
  localStorage.setItem("userEmail", account.username || "");
}

export const authService = {
  _initPromise: null as Promise<AuthenticationResult | null> | null,

  async initialize() {
    if (!this._initPromise) {
      this._initPromise = (async () => {
        await msalInstance.initialize();

        const response = await msalInstance.handleRedirectPromise();

        if (response?.account) {
          storeUserDetails(response.account);
          msalInstance.setActiveAccount(response.account);
        }

        const existingAccount = msalInstance.getAllAccounts()[0];
        if (existingAccount) {
          msalInstance.setActiveAccount(existingAccount);
          storeUserDetails(existingAccount);
        }

        return response;
      })();
    }
    return this._initPromise;
  },

  async login() {
    console.log("[login] MSAL config:", {
      clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
      authority: import.meta.env.VITE_AZURE_AUTHORITY,
      redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI,
      scope: import.meta.env.VITE_AZURE_SCOPE,
    });
    await this.initialize();

    try {
      const currentAccounts = msalInstance.getAllAccounts();

      if (currentAccounts.length > 0) {
        const account = currentAccounts[0];
        msalInstance.setActiveAccount(account);
        storeUserDetails(account);
        return account;
      }

      const request = { scopes: ["openid", "profile", "User.Read", "offline_access"] };
      await msalInstance.loginRedirect(request);

    } catch (error: any) {
      if (error.errorCode !== "interaction_in_progress") {
        console.error("Login failed:", error);
      }
      throw error;
    }
  },

  logout() {
    this.clearBackendTokens();
    localStorage.removeItem("userFirstName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userFullName");
    localStorage.removeItem("userEmail");
    return msalInstance.logoutRedirect();
  },

  getCurrentUser() {
    const account = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0] || null;

    if (!account) return null;

    return {
      fullName: account.name || "User",
      firstName: extractFirstName(account),
      role: extractRole(account),
      email: account.username || "",
    };
  },

  async getAzureToken(): Promise<string | null> {
    const account = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
    if (!account) return null;

    try {
      const tokenResponse: AuthenticationResult = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });
      return tokenResponse.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        try {
          await msalInstance.acquireTokenRedirect({
            ...loginRequest,
            account: account
          });
          return null;
        } catch (redirectError) {
          console.error("Redirect token acquisition failed:", redirectError);
          throw redirectError;
        }
      }
      console.error("Azure token acquisition failed:", error);
      throw error;
    }
  },

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

  async getValidBackendToken(): Promise<BackendTokenResult | null> {
    const token = this.getBackendAccessToken();
    const expiry = this.getBackendTokenExpiry();

    if (token && expiry && expiry.getTime() - Date.now() > 2 * 60 * 1000) {
      return { accessToken: token, refreshToken: sessionStorage.getItem('refreshToken')!, expiresIn: Math.floor((expiry.getTime() - Date.now()) / 1000) };
    }

    const refreshed = await this.refreshBackendToken();
    if (refreshed) return refreshed;

    return await this.exchangeToken();
  },

  async getToken(): Promise<string | null> {
    const result = await this.getValidBackendToken();
    return result?.accessToken ?? null;
  }
};
