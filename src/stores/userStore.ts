import { defineStore } from 'pinia';
import type { AccountInfo } from '@azure/msal-browser';

export const useUserStore = defineStore('user', {
  state: () => ({
    account: null as AccountInfo | null,
    isAuthenticated: false,
  }),
  actions: {
    setAccount(account: AccountInfo | null) {
      this.account = account;
      this.isAuthenticated = !!account;
    }
  }
});