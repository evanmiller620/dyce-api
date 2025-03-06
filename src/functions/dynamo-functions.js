import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";
dotenv.config();

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamo = DynamoDBDocumentClient.from(client);
const KEYS_TABLE = "KeyTable";
const BUSINESS_USERS_TABLE = "DyceTable"
const CLIENT_USERS_TABLE = "UserTable"

// ==============================
// Authorization
// ==============================

// Get user by their userID
export const getUserById = async (id) => {
    const getUserCommand = new GetCommand({
        TableName: BUSINESS_USERS_TABLE,
        Key: { id: id },
    });
    const { Item } = await dynamo.send(getUserCommand);
    return Item;
}

// Get user from table (or add if not in table)
export const getOrAddUser = async (username, email) => {
    const command = new GetCommand({
        TableName: BUSINESS_USERS_TABLE,
        Key: { id: username },
    });
    const { Item } = await dynamo.send(command);
    if (!Item) {
        const putCommand = new PutCommand({
            TableName: BUSINESS_USERS_TABLE,
            Item: { id: decodedToken, email: email, apiKeys: [], wallets: [] },
        });
        await dynamo.send(putCommand);
    }
}

// ==============================
// API Key Management
// ==============================

// Get API key data
export const getKey = async (key) => {
    const command = new GetCommand({
        TableName: KEYS_TABLE,
        Key: { key: key },
    });
    const { Item } = await dynamo.send(command);
    return Item;
}

// Create API key
export const createKey = async (key, userId, name, walletName) => {
    const command = new PutCommand({
        TableName: KEYS_TABLE,
        Item: {
            key: key,
            userId: userId,
            name: name,
            wallet: walletName,
            useCount: 0,
        },
    });
    await dynamo.send(command);
}

// Delete API key
export const deleteKey = async (key) => {
    const command = new DeleteCommand({
        TableName: KEYS_TABLE,
        Key: { key: key },
    });
    await dynamo.send(command);
}

// Set the use count of an API key
export const setUseCount = async (key, count) => {
    const command = new UpdateCommand({
        TableName: KEYS_TABLE,
        Key: { key: key },
        UpdateExpression: "SET useCount = :useCount",
        ExpressionAttributeValues: { ":useCount": count },
    });
    await dynamo.send(command);
}

// Set the wallet name assigned to an API key
export const setWalletName = async (key, walletName) => {
    const command = new UpdateCommand({
        TableName: KEYS_TABLE,
        Key: { key },
        UpdateExpression: "SET wallet = :wallet",
        ExpressionAttributeValues: { ":wallet": walletName },
    });
    await dynamo.send(command);
}

// Get list of a user's API keys
export const getKeysByUser = async (userId) => {
    const command = new QueryCommand({
        TableName: KEYS_TABLE,
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: { ":userId": userId },
    });

    const { Items } = await dynamo.send(command);
    return Items.length ? Items : [];
}

// ==============================
// Wallet Management
// ==============================

// Add a wallet for user
export const addNewWallet = async (userId, name, address, key) => {
    const newWallet = { name, address, key };
    const command = new UpdateCommand({
        TableName: BUSINESS_USERS_TABLE,
        Key: { id: userId },
        UpdateExpression: "SET wallets = list_append(wallets, :newWallet)",
        ExpressionAttributeValues: { ":newWallet": [newWallet] },
    });
    await dynamo.send(command);
}

// Update list of wallets for user
export const updateWallets = async (userId, wallets) => {
    const command = new UpdateCommand({
        TableName: BUSINESS_USERS_TABLE,
        Key: { id: userId },
        UpdateExpression: "SET wallets = :wallets",
        ExpressionAttributeValues: { ":wallets": wallets },
    });
    await dynamo.send(command);
}