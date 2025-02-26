import express from "express";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand, UpdateCommand, ScanCommand, DeleteCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Connect to DYNAMO
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamo = DynamoDBDocumentClient.from(client);
const USERS_TABLE = "DyceTable";
const KEYS_TABLE = "KeyTable";

// Helper function to get a user by email
const getUserByEmail = async (email) => {
    const command = new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: "email-index",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email },
    });

    const { Items } = await dynamo.send(command);
    return Items.length ? Items[0] : null;
};

// Helper function to get a user by id
const getUserById = async (id) => {
    const getUserCommand = new GetCommand({
        TableName: USERS_TABLE,
        Key: { id: id },
    });
    const { Item } = await dynamo.send(getUserCommand);
    return Item;
}

// Helper function to get an API key data
const getKey = async (key) => {
    const getKeyCommand = new GetCommand({
        TableName: KEYS_TABLE,
        Key: { key: key },
    });
    const { Item } = await dynamo.send(getKeyCommand);
    return Item;
}

// Helper function to get list of a user's API keys
const getKeysByUser = async (id) => {
    const command = new QueryCommand({
        TableName: KEYS_TABLE,
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: { ":userId": id },
    });

    const { Items } = await dynamo.send(command);
    return Items.length ? Items : null;
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

// Generate API key route
router.post("/generate-api-key", requireAuth, async (req, res) => {
    console.log("Received generate key request");

    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Key name required" });

    const userKeys = await getKeysByUser(req.user.id);
    if (userKeys?.some(apiKey => apiKey.name === name))
        return res.status(400).json({ message: "Key name already in use!" });

    const newKey = crypto.randomBytes(32).toString("hex")

    const command = new PutCommand({
        TableName: KEYS_TABLE,
        Item: {
            key: newKey,
            userId: req.user.id,
            name: name,
            wallet: req.user.wallets.length ? req.user.wallets[0].name : null,
            useCount: 0,
        },
    });
    await dynamo.send(command);
    
    res.json({ apiKey: newKey });
});

// Get API keys route
router.get("/get-api-keys", requireAuth, async (req, res) => {
    console.log("Received get keys request");

    const apiKeys = await getKeysByUser(req.user.id);
    const formattedKeys = apiKeys?.map(({ key, userId, name, wallet, useCount }) => ({
        name,
        key: `${key.slice(0, 4)}...${key.slice(-4)}`,
        wallet: wallet,
        useCount,
    })) || [];
    res.json({ apiKeys: formattedKeys });
});

// Revoke API key route
router.post("/delete-api-key", requireAuth, async (req, res) => {
    console.log("Received delete key request");

    const { name } = req.body;
    if (!name)
        return res.status(400).json({ message: "API key name required" });

    const userKeys = await getKeysByUser(req.user.id);
    const apiKey = userKeys.find(apiKey => apiKey.name === name);
    
    const command = new DeleteCommand({
        TableName: KEYS_TABLE,
        Key: { key: apiKey.key },
    });
    await dynamo.send(command);

    res.json({ message: "API key deleted successfully" });
});

// Middleware requiring API key
const requireKey = async (req, res, next) => {
    const key = req.headers['apikey'];

    if (!key)
        return res.status(401).json({ message: "API key required" });
    
    const apiKey = await getKey(key);
    if (!apiKey)
        return res.status(401).json({ message: "Invalid API key" });

    const command = new UpdateCommand({
        TableName: KEYS_TABLE,
        Key: { key: apiKey.key },
        UpdateExpression: "SET useCount = :useCount",
        ExpressionAttributeValues: {
            ":useCount": apiKey.useCount + 1
        }
    })
    await dynamo.send(command);

    req.apiKey = apiKey;
    next();
};

// Use API key route (example)
router.post("/use-api-key", requireKey, async (req, res) => {
    console.log("Received use key request");

    res.json({ message: "API Key used successfully", useCount: req.apiKey.useCount });
});

// Set API key wallet route
router.post("/set-wallet", requireAuth, async (req, res) => {
    console.log("Received set wallet request");

    const { keyName, walletName } = req.body;

    const wallet = req.user.wallets.find(wallet => wallet.name === walletName);
    const userKeys = await getKeysByUser(req.user.id);
    const key = userKeys.find(apiKey => apiKey.name === keyName).key;

    const command = new UpdateCommand({
        TableName: KEYS_TABLE,
        Key: { key: key },
        UpdateExpression: "SET wallet = :wallet",
        ExpressionAttributeValues: {
            ":wallet": wallet.name
        }
    })
    await dynamo.send(command);

    res.json({ message: "Set wallet successfully" });
});

// Get API key wallet address route
router.post("/get-wallet", requireKey, async (req, res) => {
    console.log("Received get wallet address request");

    res.json({ address: req.apiKey.wallet });
});

export default router;