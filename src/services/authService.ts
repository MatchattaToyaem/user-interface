import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";
import type { Configuration, RedirectRequest } from "@azure/msal-browser";

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
      const request = { scopes: ["openid", "profile", "User.Read"] };
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
    return msalInstance.logoutRedirect();
  },

  async getToken() {
    const account = msalInstance.getAllAccounts()[0];
    if (!account) return null;

    try {
      // Attempt to get the token silently without prompting the user
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: account
      });
      console.log("Access token:", tokenResponse.accessToken);
      return tokenResponse.accessToken;

    } catch (error) {
      // Fallback: If silent request fails, ask the user to interact
      if (error instanceof InteractionRequiredAuthError) {
        try {
          await msalInstance.acquireTokenRedirect({
            ...loginRequest,
            account: account
          });
          // Page navigates away for re-authentication
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