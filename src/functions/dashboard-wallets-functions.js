import { getAuthThenUser } from "./dashboard-login-functions.js";
import { getWalletBalance, verifyWallet } from "./payments-functions.js";
import { getKeysByUser, addNewWallet, updateWallets, setWalletName } from "./dynamo-functions.js"
import dotenv from "dotenv";
import { badRequestResponse, errorResponse, successResponse, unauthorizedResponse } from "./responses.js";
dotenv.config();

// Add wallet route
export const addWallet = async (event) => {
    console.log("Received add wallet request");
    const user = await getAuthThenUser(event);
    if (!user) return unauthorizedResponse("Unauthorized")
    const { name, address, key } = JSON.parse(event.body);
    if (!name || !address || !key)
        return badRequestResponse("Wallet name, address, and private key are required");
    if (user.wallets?.some(wallet => wallet.name === name))
        return badRequestResponse("Wallet name already in use");
    if (user.wallets?.some(wallet => wallet.address === address))
        return badRequestResponse("Wallet already added");

    const valid = await verifyWallet(address, key);
    if (!valid) return badRequestResponse("Invalid wallet credentials");

    await addNewWallet(user.id, name, address, key);
    return successResponse({ message: "Successfully added wallet!" });
};

// Get wallets route
export const getWallets = async (event) => {
    console.log("Received get wallets request");
    const user = await getAuthThenUser(event);
    if (!user) return unauthorizedResponse("Unauthorized");
    const { contractAddress } = JSON.parse(event.body);
    if (!contractAddress) return badRequestResponse("Contract address required");
    const formattedWallets = await Promise.all(
        user.wallets?.map(async ({ name, address }) => ({
            name,
            address,
            balance: await getWalletBalance(address, contractAddress)
        }))
    );
    return successResponse({ wallets: formattedWallets });
};

// Revoke wallet route
export const removeWallet = async (event) => {
    console.log("Received remove wallet request");
    const user = await getAuthThenUser(event);
    if (!user) return unauthorizedResponse("Unauthorized");
    const { name } = JSON.parse(event.body);
    if (!name) return badRequestResponse("Wallet name required");

    const updatedWallets = user.wallets?.filter(wallet => wallet.name !== name) || [];
    const userKeys = await getKeysByUser(user.id);
    for (let apiKey of userKeys)
        if (apiKey.wallet === name) await setWalletName(apiKey.key, null);
    await updateWallets(user.id, updatedWallets);
    return successResponse({ message: "Wallet removed successfully" });
};

// Get wallet history route
export const getWalletHistory = async (event) => {
    console.log("Received get wallets request");
    const { walletAddress, contractAddress } = JSON.parse(event.body);
    if (!walletAddress) return badRequestResponse("Wallet address required");
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before request
    
    // Fetch token decimals through etherscan
    let decimals, url, response, data;
    if (contractAddress) {
      url = `https://api-sepolia.etherscan.io/api?module=proxy&action=eth_call&to=${contractAddress}&data=0x313ce567&tag=latest&apikey=${process.env.ETHERSCAN_KEY}`;
      response = await fetch(url);
      data = await response.json();
      if (!data.result) return errorResponse("Failed to get decimals");
      decimals = parseInt(data.result, 16);
    } else {
      decimals = 18;
    }
    // await sleep(250);

    // Fetch transactions through etherscan
    if (contractAddress) {
        url = `https://api-sepolia.etherscan.io/api?module=account&action=tokentx&contractaddress=${contractAddress}&address=${walletAddress}&startblock=0&endblock=99999999&sort=asc&apikey=${process.env.ETHERSCAN_KEY}`;
    } else {
        url = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&sort=asc&apikey=${process.env.ETHERSCAN_KEY}`;
    }
    response = await fetch(url);
    data = await response.json();
    if (data.status !== "1") return errorResponse(data.message);
    const transactions = data.result;
    // await sleep(250);

    // Compute balance over time from transactions
    let balance = BigInt(0);
    const balanceHistory = [];
  
    for (const tx of transactions) {
      const value = BigInt(tx.value);
      const gasUsed = BigInt(tx.gasUsed || "0");
      const gasPrice = BigInt(tx.gasPrice || "0");
      const fee = gasUsed * gasPrice;
  
      if (tx.to.toLowerCase() === walletAddress.toLowerCase()) {
        balance += value;
      } else if (tx.from.toLowerCase() === walletAddress.toLowerCase()) {
        balance -= value + (contractAddress ? BigInt(0) : fee);
      }
  
      balanceHistory.push({
        timestamp: Number(tx.timeStamp) * 1000,
        Balance: Number(balance) / (10 ** decimals)
      });
    }

    // Add current balance to history
    if (contractAddress) {
      url = `https://api-sepolia.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${walletAddress}&tag=latest&apikey=${process.env.ETHERSCAN_KEY}`;
    } else {
      url = `https://api-sepolia.etherscan.io/api?module=account&action=balance&address=${walletAddress}&startblock=0&endblock=99999999&sort=asc&apikey=${process.env.ETHERSCAN_KEY}`;
    }
    response = await fetch(url);
    data = await response.json();
    if (data.status !== "1") return errorResponse(data.message);
    balance = Number(data.result) / (10 ** decimals);
    balanceHistory.push({ timestamp: Date.now(), Balance: balance });
    // await sleep(250);

    return successResponse({ balanceHistory });
}