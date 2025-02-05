import express from 'express';
import { ethers } from 'ethers';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

// const provider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/" + process.env.INFURA_API_KEY);
const provider = new ethers.JsonRpcProvider("https://rpc-sepolia.rockx.com"); // Sepolia Testnet provider

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) throw new Error("Private key not set");
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// const CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // Ethereum Mainnet USDT
const CONTRACT_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789"; // Sepolia Testnet LINK
const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)"
]
const contract = new ethers.Contract(CONTRACT_ADDRESS, ERC20_ABI, wallet);

app.post('/transaction', async (req, res) => {
  try {
    const { address, amount } = req.body;

    if (!address) return res.status(400).json({ error: "Account address required" });
    if (!amount)  return res.status(400).json({ error: "Transfer amount required" });

    console.log("Receiving payment from", address);
    const decimals = await contract.decimals();
    const balance = await contract.balanceOf(address);
    console.log("Account balance is", ethers.formatUnits(balance, decimals));

    const tx = await contract.transferFrom(address, wallet.address, ethers.parseUnits(amount.toString(), decimals));
    console.log("Transaction hash:", tx.hash);

    await tx.wait();
    const newBalance = await contract.balanceOf(address);
    console.log("New account balance is", ethers.formatUnits(newBalance, decimals));

    res.json({ address, balance: newBalance.toString() });

  } catch (error) {
    console.error("Error during transaction:", error);
    res.status(500).json({ error: "Error during transaction", details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})