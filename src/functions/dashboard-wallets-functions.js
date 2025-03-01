import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";
import { getAuthThenUser } from "./dashboard-login-functions.js";
dotenv.config();

// Connect to DYNAMO
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamo = DynamoDBDocumentClient.from(client);
const USERS_TABLE = "DyceTable";
const KEYS_TABLE = "KeyTable";

// Helper function to get list of a user's API keys
const getKeysByUser = async (id) => {
    const command = new QueryCommand({
        TableName: KEYS_TABLE,
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: { ":userId": id },
    });
    const { Items } = await dynamo.send(command);
    return Items.length ? Items : [];
};

// Add wallet route
export const addWallet = async (event) => {
    console.log("Received add wallet request");
    const user = await getAuthThenUser(event);
    if (!user) return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
    const { name, address, key } = JSON.parse(event.body);
    if (!name || !address || !key) return { statusCode: 400, body: JSON.stringify({ message: "Wallet name, address, and private key are required" }) };
    if (user.wallets?.some(wallet => wallet.name === name)) return { statusCode: 400, body: JSON.stringify({ message: "Wallet name already in use" }) };

    const newWallet = { name, address, key };
    const command = new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { id: user.id },
        UpdateExpression: "SET wallets = list_append(wallets, :newWallet)",
        ExpressionAttributeValues: { ":newWallet": [newWallet] },
    });
    await dynamo.send(command);
    return { statusCode: 200, body: JSON.stringify({ message: "Successfully added wallet!" }) };
};

// Get wallets route
export const getWallets = async (event) => {
    console.log("Received get wallets request");
    const user = await getAuthThenUser(event);
    if (!user) return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
    const formattedWallets = user.wallets?.map(({ name, address }) => ({
        name,
        address,
    })) || [];
    return { statusCode: 200, body: JSON.stringify({ wallets: formattedWallets }) };
};

// Revoke wallet route
export const removeWallet = async (event) => {
    console.log("Received remove wallet request");
    const user = await getAuthThenUser(event);
    if (!user) return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
    const { name } = JSON.parse(event.body);
    if (!name) return { statusCode: 400, body: JSON.stringify({ message: "Wallet name required" }) };

    const updatedWallets = user.wallets?.filter(wallet => wallet.name !== name) || [];
    const userKeys = await getKeysByUser(user.id);

    for (let apiKey of userKeys) {
        if (apiKey.wallet === name) {
            const command = new UpdateCommand({
                TableName: KEYS_TABLE,
                Key: { key: apiKey.key },
                UpdateExpression: "SET wallet = :wallet",
                ExpressionAttributeValues: { ":wallet": null },
            });
            await dynamo.send(command);
        }
    }

    const command = new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { id: user.id },
        UpdateExpression: "SET wallets = :wallets",
        ExpressionAttributeValues: { ":wallets": updatedWallets },
    });
    await dynamo.send(command);

    return { statusCode: 200, body: JSON.stringify({ message: "Wallet removed successfully" }) };
};

// Get wallet balance route
export const getWalletBalance = async (event) => {
    console.log("Received get wallet balance request");
    const user = await getAuthThenUser(event);
    if (!user) return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };

    const { name } = JSON.parse(event.body);
    if (!name) return { statusCode: 400, body: JSON.stringify({ message: "Wallet name required" }) };

    return { statusCode: 200, body: JSON.stringify({ message: "Wallet balance functionality not yet implemented" }) };
};