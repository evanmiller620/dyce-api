import express from "express";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Connect to DYNAMO
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamo = DynamoDBDocumentClient.from(client);
const USERS_TABLE = "DyceTable"; // Change this to your actual DynamoDB table name

// Helper function to get a user by id
const getUserById = async (id) => {
    const getUserCommand = new GetCommand({
        TableName: USERS_TABLE,
        Key: { id: id },
    });

    const { Item } = await dynamo.send(getUserCommand);
    return Item;
}

// Middleware requiring authentication
const requireAuth = async (req, res, next) => {
    if (!req.session.userId)
        return res.status(401).json({ message: "You must be logged in to access this route" });
    const user = await getUserById(req.session.userId);
    if (!user)
        return res.status(404).json({ message: "User not found" });
    req.user = user;
    next();
};

// Add wallet route
router.post("/add-wallet", requireAuth, async (req, res) => {
    console.log("Received add wallet request");

    const { name, address, key } = req.body;
    if (!name) return res.status(400).json({ message: "Wallet name required" });
    if (!address) return res.status(400).json({ message: "Wallet address required" });
    if (!key) return res.status(400).json({ message: "Wallet private key required" });
    
    if (req.user.wallets && req.user.wallets.some((wallet) => wallet.name === name))
        return res.status(400).json({ message: "Wallet name already in use" });

    const newWallet = { name, address, key }

    const command = new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { id: req.user.id },
        UpdateExpression: "SET wallets = list_append(wallets, :newWallet)",
        ExpressionAttributeValues: { ":newWallet": [newWallet] }
    });
    await dynamo.send(command);
    
    res.json({ message: "Successfully added wallet!" });
});

// Get wallets route
router.get("/get-wallets", requireAuth, async (req, res) => {
    console.log("Received get wallets request");

    const formattedWallets = req.user.wallets?.map(({ name, address, key }) => ({
        name,
        address,
        key
    })) || [];
    res.json({ wallets: formattedWallets });
});

// Revoke API key route
router.post("/remove-wallet", requireAuth, async (req, res) => {
    console.log("Received remove wallet request");

    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Wallet name required" });

    const updatedWallets = req.user.wallets?.filter(wallet => wallet.name !== name) || [];
    
    const command = new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { id: req.user.id },
        UpdateExpression: "SET wallets = :wallets",
        ExpressionAttributeValues: { ":wallets": updatedWallets }
    });
    await dynamo.send(command);

    res.json({ message: "Wallet removed successfully" });
});

export default router;