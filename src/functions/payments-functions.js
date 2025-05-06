import { ethers } from 'ethers'

import { getKey, getUserById, getOrAddClientUser, addClientWallet, addClientKeyIfNotExists, getClientWallets, updateUseCount, updateTxAmount, updateFeeAmount } from './dynamo-functions.js';
import { EtherscanProvider } from 'ethers';
import { badRequestResponse, notFoundResponse, successResponse, unauthorizedResponse } from './responses.js';
import dotenv from "dotenv";
dotenv.config();

// ==============================
// Payment Endpoint Functions
// ==============================

export const getWalletAddress = async (event) => {
    console.log("Received get wallet address request");
    const key = event.headers["x-api-key"];
    if (!key) return unauthorizedResponse("API key required")

    const apiKey = await getKey(key);
    if (!apiKey) return unauthorizedResponse("Invalid API key");

    const user = await getUserById(apiKey.userId);
    const wallet = user.wallets.find(wallet => wallet.name == apiKey.wallet)
    if (!wallet) return notFoundResponse("No wallet set for API key");

    return successResponse({ address: wallet.address });
};

export const approveSpending = async (event) => {
    console.log("Received approve spending request");
    const key = event.headers["x-api-key"];
    if (!key) return unauthorizedResponse("API key required");

    const apiKey = await getKey(key);
    if (!apiKey) return unauthorizedResponse("Invalid API key");

    const { userId, wallet, amount } = JSON.parse(event.body);
    if (!userId || !wallet || !amount)
        return badRequestResponse("User ID, wallet address, and approve amount required");

    const user = await getOrAddClientUser(userId);
    if (!user?.apiKeys?.[apiKey.key]?.wallets?.[wallet])
        await addClientKeyIfNotExists(userId, apiKey.key);
    await addClientWallet(userId, apiKey.key, wallet);
    await updateUseCount(apiKey.key);
    return successResponse({ message: "Spending approved successfully" });
}

export const permitSpending = async (event) => {
    console.log("Received permit spending request");
    const key = event.headers["x-api-key"];
    if (!key) return unauthorizedResponse("API key required");

    const apiKey = await getKey(key);
    if (!apiKey) return unauthorizedResponse("Invalid API key");

    const businessUser = await getUserById(apiKey.userId);
    const businessWallet = businessUser.wallets.find(wallet => wallet.name == apiKey.wallet)
    if (!businessWallet) return notFoundResponse("No wallet set for API key");

    const { userId, permit, contractAddress } = JSON.parse(event.body);
    if (!userId || !permit || !contractAddress)
        return badRequestResponse("User ID, permit, and contract address required");

    // Submit permit to blockchain
    const fee = await submitPermit(permit, businessWallet.key, contractAddress);
    console.log(fee);

    // Add wallet address to list of payment sources
    const { owner } = permit;
    const user = await getOrAddClientUser(userId);
    if (!user?.apiKeys?.[apiKey.key]?.wallets?.[owner])
        await addClientKeyIfNotExists(userId, apiKey.key);
    await addClientWallet(userId, apiKey.key, owner);

    // Update history
    await updateUseCount(apiKey.key);
    await updateFeeAmount(apiKey.key, fee);
    return successResponse({ message: "Permit submitted successfully" });
}

export const requestPayment = async (event) => {
    console.log("Received request payment request");
    const key = event.headers["x-api-key"];
    if (!key) return unauthorizedResponse("API key required");

    const apiKey = await getKey(key);
    if (!apiKey) return unauthorizedResponse("Invalid API key");

    const { userId, amount, contractAddress } = JSON.parse(event.body);
    if (!userId || !amount || !contractAddress)
        return badRequestResponse("User ID, payment amount, and contract address required" );

    const businessUser = await getUserById(apiKey.userId);
    const businessWallet = businessUser.wallets.find(wallet => wallet.name == apiKey.wallet)
    if (!businessWallet) return notFoundResponse("No wallet set for API key");

    const wallets = await getClientWallets(userId, apiKey.key);
    if (!wallets) return badRequestResponse("No spending approved");

    var total = 0;
    var walletAllowances = {}
    for (const wallet of wallets) {
        const allowance = await getWalletAllowance(wallet, businessWallet.address, contractAddress);
        if (allowance == 0) continue;
        walletAllowances[wallet] = allowance;
        total += allowance;
    }
    if (amount > total)
        return badRequestResponse("Insufficient spending limit");

    var remainingTransferAmount = amount;
    var totalFees = 0;
    for (const wallet in walletAllowances) {
        if (!remainingTransferAmount) break;
        const transferAmount = Math.min(walletAllowances[wallet], remainingTransferAmount);
        try{
            totalFees += await transfer(wallet, businessWallet.address, businessWallet.key, transferAmount, contractAddress);
        } catch (error) {
            console.error("Transfer error:", error);
            return badRequestResponse("Transfer failed: " + error.message);
        }
        remainingTransferAmount -= transferAmount;
    }

    await updateUseCount(apiKey.key);
    await updateTxAmount(apiKey.key, amount);
    await updateFeeAmount(apiKey.key, totalFees);
    return successResponse({ message: "Processed payment successfully" });
};

export const receivePayment = async (event) => {
    console.log("Received receive payment request");
    const key = event.headers["x-api-key"];
    if (!key) return unauthorizedResponse("API key required");

    const apiKey = await getKey(key);
    if (!apiKey) return unauthorizedResponse("Invalid API key");

    const businessUser = await getUserById(apiKey.userId);
    const businessWallet = businessUser.wallets.find(wallet => wallet.name == apiKey.wallet)
    if (!businessWallet) return notFoundResponse("No wallet set for API key");

    const { permit, contractAddress } = JSON.parse(event.body);
    if (!permit || !contractAddress)
        return badRequestResponse("Permit and contract address required");

    // Submit permit to blockchain
    const { amount, fees } = await submitReceive(permit, businessWallet.key, contractAddress);

    // Update history
    await updateUseCount(apiKey.key);
    await updateTxAmount(apiKey.key, amount);
    await updateFeeAmount(apiKey.key, fees);
    return successResponse({ message: "Payment received successfully" });
}

// ==============================
// Transaction Functions
// ==============================

const provider = new EtherscanProvider("sepolia", process.env.ETHERSCAN_KEY);
const ERC20_ABI = [
    "function decimals() view returns (uint8)",
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function name() view returns (string)",
    "function version() view returns (string)"
]

const ERC2612_ABI = [
    "function permit(address owner, address spender, uint value, uint deadline, uint8 v, bytes32 r, bytes32 s) external",
    "function nonces(address owner) external view returns (uint)",
    "function DOMAIN_SEPARATOR() external view returns (bytes32)"
]

const ERC3009_ABI = [
    "function receiveWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external"
]

export const getWalletBalance = async (address, contractAddress) => {
    const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);
    const decimals = await contract.decimals();
    try {
        const balance = await contract.balanceOf(address);
        return ethers.formatUnits(balance, decimals);
    } catch {
        return "???";
    }
}

export const getWalletAllowance = async (owner, spender, contractAddress) => {
    const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);
    const decimals = await contract.decimals();
    try {
        const balance = await contract.allowance(owner, spender);
        return Number(ethers.formatUnits(balance, decimals));
    } catch (err) {
        console.log(err);
        return 0;
    }
}

export const verifyWallet = async (address, privateKey) => {
    try {
        const wallet = new ethers.Wallet(privateKey);
        return wallet.address == address;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const transfer = async (srcAddress, destAddress, privateKey, amount, contractAddress) => {
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, ERC20_ABI, wallet);
    const decimals = await contract.decimals();
    const srcBalance = parseFloat(ethers.formatUnits(await contract.balanceOf(srcAddress), decimals));

    if (srcBalance < amount)
        throw new Error(`Insufficient balance: ${srcBalance} available but ${amount} required.`);

    const tx = await contract.transferFrom(srcAddress, destAddress, ethers.parseUnits(amount.toString(), decimals));
    const receipt = await tx.wait();
    return parseFloat(ethers.formatEther(receipt.gasUsed * receipt.gasPrice));
}

const submitPermit = async (permit, privateKey, contractAddress) => {
    const { owner, spender, value, deadline, v, r, s, nonce } = permit;
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, [...ERC20_ABI, ...ERC2612_ABI], wallet);
    const chainId = (await provider.getNetwork()).chainId;

    const domain = {
        name: await contract.name(),
        version: await contract.version(),
        chainId: chainId,
        verifyingContract: contractAddress
    };
    const types = {
        Permit: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
        ]
    };
    const values = { owner, spender, value, nonce, deadline };

    // Verify signature before submitting permit
    const signerAddress = ethers.verifyTypedData(domain, types, values, { r, s, v });
    if (signerAddress.toLowerCase() !== owner.toLowerCase())
        throw new Error("Invalid signature: signer does not match owner");
    
    const tx = await contract.permit(owner, spender, value, deadline, v, r, s);
    const receipt = await tx.wait();
    return parseFloat(ethers.formatEther(receipt.gasUsed * receipt.gasPrice));
}

const submitReceive = async (permit, privateKey, contractAddress) => {
    const { v, r, s, from, to, value, validAfter, validBefore, nonce } = permit;

    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, [...ERC20_ABI, ...ERC2612_ABI, ...ERC3009_ABI], wallet);
    const chainId = (await provider.getNetwork()).chainId;

    const domain = {
        name: await contract.name(),
        version: await contract.version(),
        chainId: chainId,
        verifyingContract: contractAddress
    };
    const types = {
        ReceiveWithAuthorization: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "validAfter", type: "uint256" },
            { name: "validBefore", type: "uint256" },
            { name: "nonce", type: "bytes32" },
        ]
    };
    const values = { from, to, value, validAfter, validBefore, nonce };

    // Verify signature before submitting permit
    const signerAddress = ethers.verifyTypedData(domain, types, values, { r, s, v });
    if (signerAddress.toLowerCase() !== from.toLowerCase())
        throw new Error("Invalid signature: signer does not match owner");
    
    const tx = await contract.receiveWithAuthorization(from, to, value, validAfter, validBefore, nonce, v, r, s);
    const receipt = await tx.wait();
    return {
        amount: ethers.formatUnits(permit.value, await contract.decimals()),
        fees: parseFloat(ethers.formatEther(receipt.gasUsed * receipt.gasPrice))
    }
}