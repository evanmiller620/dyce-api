import { connectWallet, approveLimit, getWalletAddress, transferTokens, permitLimit, receivePayment } from "./transact";

const CONTRACT_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

class Dyce {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = "https://0fxllf5l0m.execute-api.us-east-1.amazonaws.com/main/";
    
    try {
      connectWallet();
      this.connected = true;
    } catch (error) {
      console.log(error)
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
      await approveLimit(businessWallet, parseFloat(amount), CONTRACT_ADDRESS);
    } catch (Error) {
      console.error(Error);
      return false;
    }
    try {
      const response = await this.request('approve-spending', 'POST', {
        userId: userId, wallet: clientWallet, amount: parseFloat(amount)
      });
      const data = await response.json();
      if (!response.ok) {
        console.error(data.message || "Failed to set new spending limit in database!");
        return false;
      }
    } catch (Error) {
      console.error(Error);
      return false;
    }
    return true;
  }

  async permitSpending(userId, amount) {
    if (!this.connected) throw new Error("Failed to connect to MetaMask!");
    const businessWallet = await this.getWalletAddress();

    // Generate permit
    let permit;
    try {
      permit = await permitLimit(businessWallet, parseFloat(amount), CONTRACT_ADDRESS);
    } catch (Error) {
      console.error(Error);
      return false
    }

    // Send permit
    try {
      const response = await this.request('permit-spending', 'POST', { userId, permit, contractAddress: CONTRACT_ADDRESS });
      const data = await response.json();
      if (!response.ok) {
        console.error(data.message || "Failed to send permit!");
        return false;
      }
    } catch (Error) {
      console.error(Error);
      return false;
    }
    return true;
  }

  async requestPayment(userId, amount) {
    const response = await this.request('request-payment', 'POST', { userId: userId, amount: parseFloat(amount), contractAddress: CONTRACT_ADDRESS });
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
      await transferTokens(businessWallet, parseFloat(amount), CONTRACT_ADDRESS);
    } catch (Error) {
      console.error("Failed to transfer tokens!");
      console.log(Error);
      return false;
    }
    return true;
  }

  async receivePayment(amount) {
    if (!this.connected) throw new Error("Failed to connect to MetaMask!");
    const businessWallet = await this.getWalletAddress();

    // Generate permit
    let permit;
    try {
      permit = await receivePayment(businessWallet, parseFloat(amount), CONTRACT_ADDRESS);
    } catch (Error) {
      console.error("Failed to transfer tokens!");
      console.log(Error);
      return false;
    }

    // Send permit
    try {
      const response = await this.request('receive-payment', 'POST', { permit, contractAddress: CONTRACT_ADDRESS });
      const data = await response.json();
      if (!response.ok) {
        console.error(data.message || "Failed to send permit!");
        return false;
      }
    } catch (Error) {
      console.error(Error);
      return false;
    }
    return true;
  }
}

export default Dyce;