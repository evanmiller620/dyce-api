import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.5/ethers.js";

const provider = new ethers.BrowserProvider(window.ethereum);
let signer, address;

// const CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // Ethereum Mainnet USDT
const CONTRACT_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789"; // Sepolia Testnet LINK
const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];
let contract;

const BUSINESS_ADDRESS = "0xA5C567e77af88EEf2c42B7000FC24BDEaf140001"; // Will fetch this with API later

async function connectWallet() {
  if (!window.ethereum) {
    console.error("MetaMask not installed!");
    return;
  }

  try {
    signer = await provider.getSigner();
    address = await signer.getAddress();
    contract = new ethers.Contract(CONTRACT_ADDRESS, ERC20_ABI, signer);
  } catch (error) {
    console.error("Error connecting to MetaMask:", error);
  }
}

async function approveSpending(amount) {
  if (!contract) {
    console.error("Must connect to wallet first!");
    return;
  }

  const decimals = await contract.decimals();
  const transferAmount = ethers.parseUnits(amount.toString(), decimals);
  const tx = await contract.approve(BUSINESS_ADDRESS, transferAmount);
  console.log("Approval transaction hash:", tx.hash);

  await tx.wait();
  console.log("Approval confirmed!");
}

async function sendTransaction(amount) {
  if (!address) {
    console.error("Must connect to wallet first!");
    return;
  }

  const response = await fetch("http://localhost:3000/transaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, amount })
  });

  const result = await response.json();
  console.log("Backend response:", result);
}

document.getElementById("connect-wallet").onclick = async () => {
  await connectWallet();
};

document.getElementById("approve-spending").onclick = async () => {
  const limit = parseFloat(document.getElementById("spending-limit").value);
  console.log(limit);
  await approveSpending(limit);
};

document.getElementById("send-transaction").onclick = async () => {
  const amount = parseFloat(document.getElementById("transact-amount").value);
  console.log(amount);
  await sendTransaction(amount);
};