import { ethers } from 'ethers'

import { getKey, getUserById, getOrAddClientUser, setSpendingLimit, decreaseSpendingLimit, addClientKeyIfNotExists, getClientKey } from './dynamo-functions.js';

// ==============================
// Payment Endpoint Functions
// ==============================

export const getWalletAddress = async (event) => {
    console.log("Received get wallet address request");
    const key = event.headers["x-api-key"];
    if (!key) return { statusCode: 401, body: JSON.stringify({ message: "API key required" }) };

    const apiKey = await getKey(key);
    if (!apiKey) return { statusCode: 401, body: JSON.stringify({ message: "Invalid API key" }) };

    const user = await getUserById(apiKey.userId);
    const wallet = user.wallets.find(wallet => wallet.name == apiKey.wallet)
    if (!wallet) return { statusCode: 401, body: JSON.stringify({ message: "No wallet set for API key" }) };

    return { statusCode: 200, body: JSON.stringify({ address: wallet.address }) };
};

export const approveSpending = async (event) => {
    console.log("Received approve spending request");
    const key = event.headers["x-api-key"];
    if (!key) return { statusCode: 401, body: JSON.stringify({ message: "API key required" }) };

    const { userId, wallet, amount } = JSON.parse(event.body);
    if (!userId || !wallet || !amount)
      return { statusCode: 401, body: JSON.stringify({ message: "User ID, wallet address, and approve amount required" }) };

    const apiKey = await getKey(key);
    if (!apiKey) return { statusCode: 401, body: JSON.stringify({ message: "Invalid API key" }) };

    const user = await getOrAddClientUser(userId);
    if (!user?.apiKeys?.[apiKey.key]?.wallets?.[wallet]) await addClientKeyIfNotExists(userId, apiKey.key);
    setSpendingLimit(userId, apiKey.key, wallet, amount);
    return { statusCode: 200, body: JSON.stringify({ message: "Spending approved successfully" }) };
}

// WARNING: Literally zero error catching, will break if you do anything sus
export const requestPayment = async (event) => {
    console.log("Received request payment request");
    const key = event.headers["x-api-key"];
    if (!key) return { statusCode: 401, body: JSON.stringify({ message: "API key required" }) };

    const { userId, amount } = JSON.parse(event.body);
    if (!userId || !amount)
        return { statusCode: 401, body: JSON.stringify({ message: "User ID and payment amount required" }) };

    const apiKey = await getKey(key);
    if (!apiKey) return { statusCode: 401, body: JSON.stringify({ message: "Invalid API key" }) };

    const businessUser = await getUserById(apiKey.userId);
    const businessWallet = businessUser.wallets.find(wallet => wallet.name == apiKey.wallet)
    if (!businessWallet) return { statusCode: 401, body: JSON.stringify({ message: "No wallet set for API key" }) };

    const wallets = await getClientKey(userId, apiKey.key);
    const total = Object.values(wallets).reduce((sum, value) => sum + value, 0);
    if (amount > total)
        return { statusCode: 400, body: JSON.stringify({ message: "Insufficient spending limit" }) };
    // Should probably check the actual spending limits rather than relying on the database entries

    var remainingTransferAmount = amount;
    for (const [wallet, limit] of Object.entries(wallets)) {
        if (!remainingTransferAmount) return;
        const transferAmount = Math.min(limit, remainingTransferAmount);
        const txHash = await transfer(wallet, businessWallet.address, businessWallet.key, transferAmount);
        decreaseSpendingLimit(userId, apiKey.key, wallet, transferAmount);
        remainingTransferAmount -= transferAmount;
        console.log(txHash);
    }

    return { statusCode: 200, body: JSON.stringify({ message: "Processed payment successfully" }) };
    // To do: make this return the transaction hashes
};

// ==============================
// Transaction Functions
// ==============================

// const provider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/" + process.env.INFURA_API_KEY);
const provider = new ethers.JsonRpcProvider("https://rpc-sepolia.rockx.com"); // Sepolia Testnet provider
// const CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // Ethereum Mainnet USDT
const CONTRACT_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789"; // Sepolia Testnet LINK
const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)"
]

export const getWalletBalance = async (address) => {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ERC20_ABI, provider);
    const decimals = await contract.decimals();
    const balance = await contract.balanceOf(address);
    return ethers.formatUnits(balance, decimals);
}

const transfer = async (srcAddress, destAddress, privateKey, amount) => {
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ERC20_ABI, wallet);
    const decimals = await contract.decimals();
    const srcBalance = parseFloat(ethers.formatUnits(await contract.balanceOf(srcAddress), decimals));

    if (srcBalance < amount)
        throw new Error(`Insufficient balance: ${srcBalance} available but ${amount} required.`);

    const tx = await contract.transferFrom(srcAddress, destAddress, ethers.parseUnits(amount.toString(), decimals));
    await tx.wait();
    return tx.hash;
}