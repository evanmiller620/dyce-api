// import express from "express";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";
import dotenv from "dotenv";
import { getAuthThenUser } from "./dashboard-login-functions.js";
dotenv.config();


// Connect to DYNAMO
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamo = DynamoDBDocumentClient.from(client);
const KEYS_TABLE = "KeyTable";
// const USERS_TABLE = "DyceTable";

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

// Generate API key route
export const generateApiKey = async (event) => {
    console.log("Received generate key request");
    const { name } = JSON.parse(event.body);
    if (!name) return { statusCode: 400, body: JSON.stringify({ message: "Key name required" }) };
    const user = await getAuthThenUser(event);
    if (!user) return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };

    const userKeys = await getKeysByUser(user.id);
    if (userKeys?.some(apiKey => apiKey.name === name)) {
        return { statusCode: 400, body: JSON.stringify({ message: "Key name already in use!" }) };
    }
    const newKey = crypto.randomBytes(32).toString("hex")

    const command = new PutCommand({
        TableName: KEYS_TABLE,
        Item: {
            key: newKey,
            userId: user.id,
            name: name,
            wallet: user.wallets.length ? user.wallets[0].name : null,
            useCount: 0,
        },
    });
    await dynamo.send(command);
    return { statusCode: 200, body: JSON.stringify({ apiKey: newKey }) };
};

// Get API keys route
export const getApiKeys = async (event) => {
    console.log("Received get keys request");
    const user = await getAuthThenUser(event);
    if (!user) return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };

    const apiKeys = await getKeysByUser(user.id);
    const formattedKeys = apiKeys?.map(({ key, name, wallet, useCount }) => ({ //userId,
        name,
        key: `${key.slice(0, 4)}...${key.slice(-4)}`,
        wallet: wallet,
        useCount,
    })) || [];
    return { statusCode: 200, body: JSON.stringify({ apiKeys: formattedKeys }) };
};

// Revoke API key route
export const deleteApiKey = async (event) => {
    console.log("Received delete key request");
    const user = await getAuthThenUser(event);
    if (!user) return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };

    const { name } = JSON.parse(event.body);
    if (!name) return { statusCode: 400, body: JSON.stringify({ message: "API key name required" }) };
    if (!user) return { statusCode: 400, body: JSON.stringify({ message: "User not found" }) };

    const userKeys = await getKeysByUser(user.id);
    const apiKey = userKeys.find(apiKey => apiKey.name === name);

    const command = new DeleteCommand({
        TableName: KEYS_TABLE,
        Key: { key: apiKey.key },
    });
    await dynamo.send(command);

    return { statusCode: 200, body: JSON.stringify({ message: "API key deleted successfully" }) };
};


// Use API key route (example)
export const useApiKey = async (event) => {
    console.log("Received use key request");
    const { key } = JSON.parse(event.body);
    if (!key) return { statusCode: 401, body: JSON.stringify({ message: "API key required" }) };
    const user = await getAuthThenUser(event);
    if (!user) return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
    const apiKey = await getKey(key);
    if (!apiKey) return { statusCode: 401, body: JSON.stringify({ message: "Invalid API key" }) };

    const command = new UpdateCommand({
        TableName: KEYS_TABLE,
        Key: { key: apiKey.key },
        UpdateExpression: "SET useCount = :useCount",
        ExpressionAttributeValues: { ":useCount": apiKey.useCount + 1 },
    });
    await dynamo.send(command);

    return { statusCode: 200, body: JSON.stringify({ message: "API Key used successfully", useCount: apiKey.useCount }) };
};

// Set API key wallet route
export const setWallet = async (event) => {
    console.log("Received set wallet request");
    const user = await getAuthThenUser(event);
    if (!user) return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };

    const { keyName, walletName } = JSON.parse(event.body);
    if (!keyName) return { statusCode: 400, body: JSON.stringify({ message: "API key name required" }) };
    if (!walletName) return { statusCode: 400, body: JSON.stringify({ message: "Wallet name required" }) };
    const wallet = user.wallets.find(wallet => wallet.name === walletName);
    if (!wallet) return { statusCode: 400, body: JSON.stringify({ message: "Wallet not found" }) };
    if (!user) return { statusCode: 400, body: JSON.stringify({ message: "User not found" }) };

    const userKeys = await getKeysByUser(user.id);
    if (!userKeys) return { statusCode: 400, body: JSON.stringify({ message: "API keys not found" }) };
    const key = userKeys.find(apiKey => apiKey.name === keyName)?.key;
    if (!key) return { statusCode: 404, body: JSON.stringify({ message: "API key not found" }) };

    const command = new UpdateCommand({
        TableName: KEYS_TABLE,
        Key: { key },
        UpdateExpression: "SET wallet = :wallet",
        ExpressionAttributeValues: { ":wallet": wallet.name },
    });
    await dynamo.send(command);
    return { statusCode: 200, body: JSON.stringify({ message: "Set wallet successfully" }) };
};

export const getWallet = async (event) => {
    console.log("Received get wallet address request");
    const user = await getAuthThenUser(event);
    if (!user) return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
    const {key} = JSON.parse(event.body);
    if (!key) return { statusCode: 401, body: JSON.stringify({ message: "API key required" }) };

    const apiKey = await getKey(key);
    if (!apiKey) return { statusCode: 401, body: JSON.stringify({ message: "Invalid API key" }) };

    return { statusCode: 200, body: JSON.stringify({ address: apiKey.wallet }) };
};