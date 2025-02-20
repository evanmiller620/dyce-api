import express from "express";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Connect to DYNAMO
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamo = DynamoDBDocumentClient.from(client);
const USERS_TABLE = "DyceTable"; // Change this to your actual DynamoDB table name

const getUserByEmail = async (email) => {
    const command = new GetCommand({ TableName: USERS_TABLE, Key: { email } });
    const { Item } = await dynamo.send(command);
    return Item;
};

// Middleware requiring authentication
const requireAuth = async (req, res, next) => {
    if (!req.session.user)
        return res.status(401).json({ message: "You must be logged in to access this route" });
    const user = await getUserByEmail(req.session.user);
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
    
    if (req.user.apiKeys && req.user.apiKeys.some((key) => key.name === name))
        return res.status(400).json({ message: "Key name already in use" });
        
    const newKey = { name, key: crypto.randomBytes(32).toString("hex"), useCount: 0 };
    const updatedApiKeys = req.user.apiKeys ? [...req.user.apiKeys, newKey] : [newKey];

    const command = new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { email: req.user.email },
        UpdateExpression: "SET apiKeys = :apiKeys",
        ExpressionAttributeValues: { ":apiKeys": updatedApiKeys }
    });
    await dynamo.send(command);
    
    res.json({ apiKey: newKey });
});

// Get API keys route
router.get("/get-api-keys", requireAuth, async (req, res) => {
    console.log("Received get keys request");

    const formattedKeys = req.user.apiKeys?.map(({ name, key, useCount }) => ({
        name,
        key: `${key.slice(0, 4)}...${key.slice(-4)}`,
        useCount
    })) || [];
    res.json({ apiKeys: formattedKeys });
});

// Revoke API key route
router.post("/delete-api-key", requireAuth, async (req, res) => {
    console.log("Received delete key request");

    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "API key name required" });

    const updatedApiKeys = req.user.apiKeys?.filter(apiKey => apiKey.name !== name) || [];
    
    const command = new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { email: req.user.email },
        UpdateExpression: "SET apiKeys = :apiKeys",
        ExpressionAttributeValues: { ":apiKeys": updatedApiKeys }
    });
    await dynamo.send(command);

    res.json({ message: "API key deleted successfully" });
});

// Middleware requiring API key
const requireKey = async (req, res, next) => {
    const apiKey = req.headers['apikey'];
    if (!apiKey)
        return res.status(401).json({ message: "API key required" });
    
    const command = new ScanCommand({
        TableName: USERS_TABLE,
        FilterExpression: "contains(apiKeys, :apiKey)",
        ExpressionAttributeValues: { ":apiKey": apiKey },
    });
    const { Items } = await dynamo.send(command);
    const user = Items?.[0];

    if (!user)
        return res.status(401).json({ message: "Invalid API key" });
    
    const apiKeyEntry = user.apiKeys.find(entry => entry.key === apiKey);
    apiKeyEntry.useCount += 1;

    const updateCommand = new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { email: user.email },
        UpdateExpression: "SET apiKeys = :apiKeys",
        ExpressionAttributeValues: { ":apiKeys": user.apiKeys }
    });
    await dynamo.send(updateCommand);

    req.user = user;
    req.apiKeyEntry = apiKeyEntry;
    next();
};

// Use API key route (example)
router.post("/use-api-key", requireKey, async (req, res) => {
    console.log("Received use key request");

    res.json({ message: "API Key used successfully", useCount: req.apiKeyEntry.useCount });
});

export default router;