import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.5/ethers.js";
// Note: should copy ethers library locally instead of loading from CDN for security reasons, change this later

async function connectToMetaMask() {
  if (!window.ethereum) {
    console.error("MetaMask is not installed!");
    return null;
  }

  try {
    // Request account access from MetaMask
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const account = accounts[0];
    console.log("Connected account:", account);
    return account;
  } catch (error) {
    console.error("Error connecting to MetaMask:", error);
    return null;
  }
}

async function sendSignedTransactionToBackend(transactionData) {
  const response = await fetch("http://localhost:3000/sendTransaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transactionData),
  });

  const result = await response.json();
  console.log("Backend response:", result);
}

let account;

document.getElementById("connect-wallet").onclick = async () => {
  console.log("Attempting to connect...");
  account = await connectToMetaMask();
  if (account) {
    console.log("Connected to wallet:", account);
  }
};

document.getElementById("send-transaction").onclick = async () => {
  if (account) {
    // Send wallet address or other transaction details to the backend
    sendSignedTransactionToBackend({ account });
  } else {
    console.error("Not connected to wallet!");
  }
};
