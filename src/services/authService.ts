import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";
import type { Configuration, RedirectRequest, AccountInfo } from "@azure/msal-browser";

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
  isInitialized: false,

  async initialize() {
    if (!this.isInitialized) {
      await msalInstance.initialize();
      this.isInitialized = true;
    }

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
  },

  async login() {
    await this.initialize();

    try {
      const currentAccounts = msalInstance.getAllAccounts();

      if (currentAccounts.length > 0) {
        const account = currentAccounts[0];
        msalInstance.setActiveAccount(account);
        storeUserDetails(account);
        return account;
      }

      const request = { scopes: ["openid", "profile", "User.Read"] };
      await msalInstance.loginRedirect(request);

    } catch (error: any) {
      if (error.errorCode === "interaction_in_progress") {
        console.warn("An interaction is already in progress.");
      } else {
        console.error("Login failed:", error);
      }
      throw error;
    }
  },

  logout() {
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

  async getToken() {
    const account = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
    if (!account) return null;

    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: account
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

      console.error("Token acquisition failed:", error);
      throw error;
    }
  }
};