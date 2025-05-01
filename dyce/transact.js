import { ethers } from "ethers";
const window = globalThis;

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

export const approveLimit = async (address, amount, contractAddress) => {
    if (!provider) throw new Error("Must connect to wallet first!");
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, ERC20_ABI, signer);
    const decimals = await contract.decimals();
    const approveAmount = ethers.parseUnits(amount.toString(), decimals);
    const tx = await contract.approve(address, approveAmount);
    await tx.wait();
    return tx.hash;
}

export const transferTokens = async (recipient, amount, contractAddress) => {
    if (!provider) throw new Error("Must connect to wallet first!");
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, ERC20_ABI, signer);
    const decimals = await contract.decimals();
    const transferAmount = ethers.parseUnits(amount.toString(), decimals);
    const tx = await contract.transfer(recipient, transferAmount);
    await tx.wait();
    return tx.hash;
};
