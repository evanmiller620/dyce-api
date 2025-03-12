// import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.5/ethers.js";
import { ethers } from "ethers";
const window = globalThis;


// const CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // Ethereum Mainnet USDT
const CONTRACT_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789"; // Sepolia Testnet LINK
const ERC20_ABI = [
    "function decimals() view returns (uint8)",
    "function balanceOf(address owner) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transfer(address recipient, uint256 amount) returns (bool)"
];

var provider;

export const connectWallet = () => {
    if (!window.ethereum) throw new Error("MetaMask not installed!");
    provider = new ethers.BrowserProvider(window.ethereum);
}

export const getWalletAddress = async () => {
    if (!provider) throw new Error("Must connect to wallet first!");
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    return address;
}

export const approveLimit = async (address, amount) => {
    if (!provider) throw new Error("Must connect to wallet first!");
    const signer = await provider.getSigner();
    console.log("Approving spending limit...");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ERC20_ABI, signer);
    const decimals = await contract.decimals();
    const approveAmount = ethers.parseUnits(amount.toString(), decimals);
    const tx = await contract.approve(address, approveAmount);
    await tx.wait();
    console.log("Approved spending limit!");
    return tx.hash;
}

export const transferTokens = async (recipient, amount) => {
    try {
        if (!provider) throw new Error("Must connect to wallet first!");
        const signer = await provider.getSigner();
        // console.log("Transferring tokens...");

        const contract = new ethers.Contract(CONTRACT_ADDRESS, ERC20_ABI, signer);
        // console.log("Contract: ", contract);
        const decimals = await contract.decimals();
        // console.log("Decimals: ", decimals);
        const transferAmount = ethers.parseUnits(amount.toString(), decimals);
        // console.log("Transfer amount: ", transferAmount);
        const tx = await contract.transfer(recipient, transferAmount);
        // console.log("Transaction: ", tx);
        await tx.wait();

        // console.log("Transfer successful!");
        return tx.hash;
    } catch (error) {
        // console.error("Failed to transfer tokens: ", error);
        throw error;
    }
    
};
