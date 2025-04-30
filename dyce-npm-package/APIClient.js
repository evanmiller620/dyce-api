const apiKey = import.meta.env.VITE_API_KEY;


class APIClient {
  constructor(token) {
    this.baseURL = "http://localhost:8080"; // Local
    // this.baseURL = "https://0fxllf5l0m.execute-api.us-east-1.amazonaws.com/main/"; // Deployed
    this.token = token;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, method = 'POST', body = null) {
    try {
      var options = {
        method: method,
        // credentials: 'include',
        // mode: 'cors',
      };

      if (body) {
        options.body = JSON.stringify(body);
      }
      if (this.token) {
        options.headers = {
          'Content-Type': 'application/json',
          'Authorization': `${this.token}`,
          "x-api-key": apiKey
        }
      } else {
        options.headers = {
          'Content-Type': 'application/json',
          "x-api-key": apiKey
        }
      }

      const response = await fetch(`${this.baseURL}/${endpoint}`, options);
      return response;
    } catch (error) {
      throw new Error("Request failed: ", error);
    }
  }

// ==============================
// API Key Functions
// ==============================

  async getApiKeys() {
    return this.request('get-api-keys', 'GET');
  }

  async generateApiKey(name, user) {
    return this.request('generate-api-key', 'POST', { name: name, user: user });
  }

  async deleteApiKey(name) {
    return this.request('delete-api-key', 'POST', { name });
  }

// ==============================
// Wallet Functions
// ==============================

  async getWallet(apiKey) {
    return this.request('get-wallet', 'POST', { key: apiKey });
  }

  async updateWallet(key, wallet) {
    return this.request('set-wallet', 'POST', { keyName: key, walletName: wallet });
  }

  async getWallets() {
    return this.request('get-wallets', 'GET');
  }

  async deleteWallet(name) {
    return this.request('remove-wallet', 'POST', { name: name });
  }

  async addWallet(name, walletAddress, walletKey) {
    return this.request('add-wallet', 'POST', { name: name, address: walletAddress, key: walletKey });
  }

// ==============================
// History Functions
// ==============================

  async getUsageHistory(keyName) {
    try {
      const res = await this.request('get-usage-history', 'POST', { keyName: keyName });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data.useCounts;
    } catch (error) {
      console.error("Failed to get usage history: ", error);
      return {};
    }
  }

  async getTxHistory(keyName) {
    try {
      const res = await this.request('get-tx-history', 'POST', { keyName: keyName });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data.txAmounts;
    } catch (error) {
      console.error("Failed to get transaction history: ", error);
      return {};
    }
  }

  async getFeeHistory(keyName) {
    try {
      const res = await this.request('get-fee-history', 'POST', { keyName: keyName });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data.feeAmounts;
    } catch (error) {
      console.error("Failed to get transaction fee history: ", error);
      return {};
    }
  }

  async getWalletHistory(walletAddress, contractAddress) {
    try {
      const res = await this.request('get-wallet-history', 'POST', { walletAddress, contractAddress });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data.balanceHistory;
    } catch (error) {
      console.error("Failed to get wallet history: ", error);
      return [];
    }
  }

// ==============================
// Auth Functions
// ==============================

  async register(credentials) {
    return this.request('register', 'POST', credentials);
  }

  async verifyEmail(credentials) {
    return this.request('verify-email', 'POST', credentials);
  }

  async resendVerification(credentials) {
    return this.request('resend-verification', 'POST', credentials);
  }

  async login(credentials) {
    return this.request('login', 'POST', credentials);
  }

  async authCheck(token = this.token) {
    if (!token) {
      return { authenticated: false, message: "No token provided" };
    }
    return this.request('auth-check', 'GET');
  }

  async logout() {
    return this.request('logout', 'POST');
  }

  async specifyEndpoint(endpoint, method, body = null) {
    if (method === 'POST') {
      return this.request(endpoint, 'POST', body);
    }
    if (method === 'GET') {
      return this.request(endpoint, 'GET');
    }
  }
}
export default APIClient;
