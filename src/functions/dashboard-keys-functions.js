// import express from "express";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();


// Connect to DYNAMO
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamo = DynamoDBDocumentClient.from(client);
const KEYS_TABLE = "KeyTable";
// const USERS_TABLE = "DyceTable";

// Helper function to get a user by email
// const getUserByEmail = async (email) => {
//     const command = new QueryCommand({
//         TableName: USERS_TABLE,
//         IndexName: "email-index",
//         KeyConditionExpression: "email = :email",
//         ExpressionAttributeValues: { ":email": email },
//     });

//     const { Items } = await dynamo.send(command);
//     return Items.length ? Items[0] : null;
// };

// Helper function to get a user by id
// const getUserById = async (id) => {
//     const getUserCommand = new GetCommand({
//         TableName: USERS_TABLE,
//         Key: { id: id },
//     });
//     const { Item } = await dynamo.send(getUserCommand);
//     return Item;
// }

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
// const requireAuth = async (req, res, next) => {
//     if (!req.session.userId)
//         return res.status(401).json({ message: "You must be logged in to access this route" });
//     const user = await getUserById(req.session.userId);
//     if (!user)
//         return res.status(404).json({ message: "User not found" });
//     req.user = user;
//     next();
// };

// Generate API key route
export const generateApiKey = async (event) => {
    console.log("Received generate key request");
    const { name, user } = JSON.parse(event.body);

    if (!name) return { statusCode: 400, body: JSON.stringify({ message: "Key name required" }) };
    if (!user) return { statusCode: 400, body: JSON.stringify({ message: "User not found" }) };

    const userKeys = await getKeysByUser(user);
    if (userKeys?.some(apiKey => apiKey.name === name)) {
        return { statusCode: 400, body: JSON.stringify({ message: "Key name already in use!" }) };
    }
    const newKey = crypto.randomBytes(32).toString("hex")

    const command = new PutCommand({
        TableName: KEYS_TABLE,
        Item: {
            key: newKey,
            userId: user,
            name: name,
            wallet: user.wallets.length ? user.wallets[0].name : null,
            useCount: 0,
        },
    });
    await dynamo.send(command);
    console.log(newKey);
    return { statusCode: 200, body: JSON.stringify({ apiKey: newKey }) };
};

// Get API keys route
export const getApiKeys = async (event) => {
    console.log("Received get keys request");
    console.log(event)
    const { user } = JSON.parse(event.body);
    console.log(user);
    if (!user) return { statusCode: 400, body: JSON.stringify({ message: "User not found" }) };

    const apiKeys = await getKeysByUser(user);
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

    const { name, user } = JSON.parse(event.body);
    if (!name) return { statusCode: 400, body: JSON.stringify({ message: "API key name required" }) };
    if (!user) return { statusCode: 400, body: JSON.stringify({ message: "User not found" }) };

    const userKeys = await getKeysByUser(user);
    const apiKey = userKeys.find(apiKey => apiKey.name === name);
    
    const command = new DeleteCommand({
        TableName: KEYS_TABLE,
        Key: { key: apiKey.key },
    });
    await dynamo.send(command);

    return { statusCode: 200, body: JSON.stringify({ message: "API key deleted successfully" }) };
};

// Middleware requiring API key
// const requireKey = async (req, res, next) => {
//     const key = req.headers['apikey'];

//     if (!key)
//         return res.status(401).json({ message: "API key required" });
    
//     const apiKey = await getKey(key);
//     if (!apiKey)
//         return res.status(401).json({ message: "Invalid API key" });

//     const command = new UpdateCommand({
//         TableName: KEYS_TABLE,
//         Key: { key: apiKey.key },
//         UpdateExpression: "SET useCount = :useCount",
//         ExpressionAttributeValues: {
//             ":useCount": apiKey.useCount + 1
//         }
//     })
//     await dynamo.send(command);

//     req.apiKey = apiKey;
//     next();
// };

// Use API key route (example)
export const useApiKey = async (event) => {
    console.log("Received use key request");

    const key = event.headers.apikey;
    if (!key) return { statusCode: 401, body: JSON.stringify({ message: "API key required" }) };

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

    const { keyName, walletName, user } = JSON.parse(event.body);
    const wallet = user.wallets.find(wallet => wallet.name === walletName);
    if (!wallet) return { statusCode: 400, body: JSON.stringify({ message: "Wallet not found" }) };

    if (!user) return { statusCode: 400, body: JSON.stringify({ message: "User not found" }) };
    const userKeys = await getKeysByUser(user);
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
    const key = event.headers.apikey;
    if (!key) return { statusCode: 401, body: JSON.stringify({ message: "API key required" }) };

    const apiKey = await getKey(key);
    if (!apiKey) return { statusCode: 401, body: JSON.stringify({ message: "Invalid API key" }) };

    return { statusCode: 200, body: JSON.stringify({ address: apiKey.wallet }) };
};