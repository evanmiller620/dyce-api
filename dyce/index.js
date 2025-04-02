import { connectWallet, approveLimit, getWalletAddress, transferTokens } from "./transact";

class Dyce {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = "http://localhost:8080";
    try {
      connectWallet();
      this.connected = true;
    } catch (error) {
      this.connected = false;
    }
  }

  async request(endpoint, method = 'POST', body = null) {
    try {
      const options = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          "x-api-key": this.apiKey
        },
        body: body ? JSON.stringify(body) : null
      };
      const response = await fetch(`${this.baseURL}/${endpoint}`, options);
      return response;
    } catch (error) {
      console.error("Request failed: ", error);
      throw new Error("Request failed: ", error);
    }
  }
  
  async getWalletAddress() {
    const response = await this.request('get-wallet-address', 'GET');
    const data = await response.json();
    if (!response.ok) {
      console.error(data.message || "Failed to get wallet address");
      return null;
    }
    return data.address;
  }

  async approveSpending(userId, amount) {
    if (!this.connected) throw new Error("Failed to connect to MetaMask!");
    const businessWallet = await this.getWalletAddress();
    const clientWallet = await getWalletAddress();
    try {
      await approveLimit(businessWallet, parseFloat(amount));
    } catch (Error) {
      console.error("Failed to approve spending!");
      return false;
    }
    try {
      const response = await this.request('approve-spending', 'POST', {
        userId: userId, wallet: clientWallet, amount: parseFloat(amount)
      });
      const data = response.json();
      if (!response.ok) {
        console.error(data.message || "Failed to set new spending limit in database!");
        return false;
      }
    } catch (Error) {
      console.log(Error);
      console.error("Failed to set new spending limit in database!");
      return false;
    }
    return true;
  }

  async requestPayment(userId, amount) {
    const response = await this.request('request-payment', 'POST', { userId: userId, amount: parseFloat(amount) });
    const data = await response.json();
    if (!response.ok) {
      console.error(data.message || "Failed to process payment!");
      return false;
    }
    return true;
  }

  async transferTokens(amount) {
    if (!this.connected) throw new Error("Failed to connect to MetaMask!");
    const businessWallet = await this.getWalletAddress();
    try {
      await transferTokens(businessWallet, parseFloat(amount));
    } catch (Error) {
      console.error("Failed to transfer tokens!");
      return false;
    }
    return true;
  }
}

export default Dyce;