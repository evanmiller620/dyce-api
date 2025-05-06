import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand, DeleteCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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
export const createUser = async (username, email) => {
    const command = new PutCommand({
        TableName: BUSINESS_USERS_TABLE,
        Item: { id: username, email: email, apiKeys: [], wallets: [] },
        ConditionExpression: "attribute_not_exists(id)",
    });
    try {
        await dynamo.send(command);
    } catch (err) {
        if (err.name !== "ConditionalCheckFailedException") throw err;
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
            useCounts: {},
            txAmounts: {},
            feeAmounts: {},
        },
    });
    await dynamo.send(command);
}

// Rotate an API key: copy old key data to new key, then delete old key
export const rotateKeyDynamo = async (oldKey, newKey) => {
    console.log(`Rotating key ${oldKey} to ${newKey}`);

    const { Item } = await dynamo.send(new GetCommand({
        TableName: KEYS_TABLE,
        Key: { key: oldKey },
    }));

    if (!Item) {
        console.error("Old key not found.");
        throw new Error("Old key not found.");
    }

    // Create new item with safety check
    try {
        await dynamo.send(new PutCommand({
            TableName: KEYS_TABLE,
            Item: {
                ...Item,
                key: newKey,
            },
            ConditionExpression: "attribute_not_exists(#k)",
            ExpressionAttributeNames: { "#k": "key" }
        }));
        console.log("New key inserted.");
    } catch (err) {
        console.error("Put failed:", err);
        throw new Error("Failed to create new key, aborting rotation.");
    }

    // Only delete if put was successful
    try {
        await deleteKey(oldKey);
        console.log("Old key deleted.");
    } catch (err) {
        console.error("Failed to delete old key:", err);
        throw err;
    }
};


// Delete API key
export const deleteKey = async (key) => {
    const command = new DeleteCommand({
        TableName: KEYS_TABLE,
        Key: { key: key },
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
// History Tracking
// ==============================

// Increment the use count of an API key for the day
export const updateUseCount = async (key) => {
    const date = new Date().toISOString().split('T')[0];
    const command = new UpdateCommand({
        TableName: KEYS_TABLE,
        Key: { key: key },
        UpdateExpression: "ADD useCounts.#date :useCount",
        ExpressionAttributeNames: { "#date": date },
        ExpressionAttributeValues: { ":useCount": 1 },
    });
    await dynamo.send(command);
}

// Get the map of dates to use counts for an API key
export const getUseCounts = async (key) => {
    const command = new GetCommand({
        TableName: KEYS_TABLE,
        Key: { key: key },
        ProjectionExpression: "useCounts"
    });
    const response = await dynamo.send(command);
    return response.Item?.useCounts || {};
};

// Add transfer amount to API key history for the day
export const updateTxAmount = async (key, amount) => {
    const date = new Date().toISOString().split('T')[0];
    const command = new UpdateCommand({
        TableName: KEYS_TABLE,
        Key: { key: key },
        UpdateExpression: "ADD txAmounts.#date :txAmount",
        ExpressionAttributeNames: { "#date": date },
        ExpressionAttributeValues: { ":txAmount": amount },
    });
    await dynamo.send(command);
}

// Get the map of dates to transaction amounts for an API key
export const getTxAmounts = async (key) => {
    const command = new GetCommand({
        TableName: KEYS_TABLE,
        Key: { key: key },
        ProjectionExpression: "txAmounts"
    });
    const response = await dynamo.send(command);
    return response.Item?.txAmounts || {};
};

// Add transfer fee amount to API key history for the day
export const updateFeeAmount = async (key, amount) => {
    const date = new Date().toISOString().split('T')[0];
    const command = new UpdateCommand({
        TableName: KEYS_TABLE,
        Key: { key: key },
        UpdateExpression: "ADD feeAmounts.#date :feeAmount",
        ExpressionAttributeNames: { "#date": date },
        ExpressionAttributeValues: { ":feeAmount": amount },
    });
    await dynamo.send(command);
}

// Get the map of dates to transaction fee amounts for an API key
export const getFeeAmounts = async (key) => {
    const command = new GetCommand({
        TableName: KEYS_TABLE,
        Key: { key: key },
        ProjectionExpression: "feeAmounts"
    });
    const response = await dynamo.send(command);
    return response.Item?.feeAmounts || {};
};

// ==============================
// Wallet Management
// ==============================

// Add a wallet for user
export const addNewWallet = async (userId, name, address, key) => {
    const newWallet = { name, address, key };
    const command = new UpdateCommand({
        TableName: BUSINESS_USERS_TABLE,
        Key: { id: userId },
        UpdateExpression: "SET wallets = list_append(if_not_exists(wallets, :emptyList), :newWallet)",
        ExpressionAttributeValues: {
            ":newWallet": [newWallet],
            ":emptyList": [],
        },
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

// ==============================
// Client User Management
// ==============================

export const getOrAddClientUser = async (userId) => {
    const command = new GetCommand({
        TableName: CLIENT_USERS_TABLE,
        Key: { id: userId },
    });
    const { Item } = await dynamo.send(command);
    if (!Item) {
        const command = new PutCommand({
            TableName: CLIENT_USERS_TABLE,
            Item: { id: userId, apiKeys: {} },
        });
        await dynamo.send(command);
    }
    return Item;
}

export const addClientKeyIfNotExists = async (userId, apiKey) => {
    const command = new UpdateCommand({
        TableName: CLIENT_USERS_TABLE,
        Key: { id: userId },
        UpdateExpression: "SET apiKeys.#apiKey = :empty",
        ExpressionAttributeNames: {
            "#apiKey": apiKey,
        },
        ExpressionAttributeValues: {
            ":empty": [],
        },
        ConditionExpression: "attribute_not_exists(apiKeys.#apiKey)"
    });
    try {
        await dynamo.send(command);
    } catch (err) {
        if (err.name !== "ConditionalCheckFailedException") throw err;
    }
};

export const addClientWallet = async (userId, apiKey, wallet) => {
    const command = new UpdateCommand({
        TableName: CLIENT_USERS_TABLE,
        Key: { id: userId },
        UpdateExpression: "SET apiKeys.#apiKey = list_append(apiKeys.#apiKey, :newWallet)",
        ConditionExpression: "NOT contains(apiKeys.#apiKey, :wallet)",
        ExpressionAttributeNames: {
            "#apiKey": apiKey,
        },
        ExpressionAttributeValues: {
            ":newWallet": [wallet],
            ":wallet": wallet,
        },
    });
    try {
        await dynamo.send(command);
    } catch (err) {
        if (err.name !== "ConditionalCheckFailedException") throw err;
    }
};

export const getClientWallets = async (userId, apiKey) => {
    const command = new GetCommand({
        TableName: CLIENT_USERS_TABLE,
        Key: { id: userId },
        ProjectionExpression: "apiKeys.#apiKey",
        ExpressionAttributeNames: {
            "#apiKey": apiKey,
        }
    });
    const { Item } = await dynamo.send(command);
    return Item?.apiKeys?.[apiKey] || null;
};