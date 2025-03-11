import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.5/ethers.js";
const window = globalThis;

// const CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // Ethereum Mainnet USDT
const CONTRACT_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789"; // Sepolia Testnet LINK
const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
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

export const getWalletBalance = async (address) => {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ERC20_ABI, provider);
    const decimals = await contract.decimals();
    try {
        const balance = await contract.balanceOf(address);
        return ethers.formatUnits(balance, decimals);
    } catch {
        return "???";
    }
}

export const approveLimit = async (address, amount) => {
    if (!provider) throw new Error("Must connect to wallet first!");
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ERC20_ABI, signer);
    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    if (ethers.formatUnits(balance, decimals) < amount)
        throw new Error("Approve amount is greater than wallet balance!");
    const approveAmount = ethers.parseUnits(amount.toString(), decimals);
    const tx = await contract.approve(address, approveAmount);
    await tx.wait();
    return tx.hash;
}