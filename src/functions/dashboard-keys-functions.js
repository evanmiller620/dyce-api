// import express from "express";
import crypto from "crypto";
import { getAuthThenUser } from "./dashboard-login-functions.js";
import { getKey, createKey, deleteKey, getKeysByUser, setWalletName } from "./dynamo-functions.js"
import dotenv from "dotenv";
dotenv.config();

// Generate API key route
export const generateApiKey = async (event) => {
    console.log("Received generate key request");
    const { name } = JSON.parse(event.body);
    if (!name) return {
        statusCode: 400, headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }, body: JSON.stringify({ message: "Key name required" })
    };
    const user = await getAuthThenUser(event);
    if (!user) return {
        statusCode: 401, headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }, body: JSON.stringify({ message: "Unauthorized" })
    };

    const userKeys = await getKeysByUser(user.id);
    if (userKeys?.some(apiKey => apiKey.name === name)) {
        return {
            statusCode: 400, headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            }, body: JSON.stringify({ message: "Key name already in use!" })
        };
    }
    const newKey = crypto.randomBytes(32).toString("hex")
    await createKey(newKey, user.id, name, user.wallets.length ? user.wallets[0].name : null)
    return {
        statusCode: 200, headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }, body: JSON.stringify({ apiKey: newKey })
    };
};

// Get API keys route
export const getApiKeys = async (event) => {
    console.log("Received get keys request");
    const user = await getAuthThenUser(event);
    if (!user) return {
        statusCode: 401, headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }, body: JSON.stringify({ message: "Unauthorized" })
    };

    const apiKeys = await getKeysByUser(user.id);
    const formattedKeys = apiKeys?.map(({ key, name, wallet, useCount }) => ({
        name,
        key: `${key.slice(0, 4)}...${key.slice(-4)}`,
        wallet: wallet,
        useCount,
    })) || [];
    return {
        statusCode: 200, headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }, body: JSON.stringify({ apiKeys: formattedKeys })
    };
};

// Revoke API key route
export const deleteApiKey = async (event) => {
    console.log("Received delete key request");
    const user = await getAuthThenUser(event);
    if (!user) return {
        statusCode: 401, headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }, body: JSON.stringify({ message: "Unauthorized" })
    };

    const { name } = JSON.parse(event.body);
    if (!name) return {
        statusCode: 400, headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }, body: JSON.stringify({ message: "API key name required" })
    };
    if (!user) return {
        statusCode: 400, headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }, body: JSON.stringify({ message: "User not found" })
    };

    const userKeys = await getKeysByUser(user.id);
    const apiKey = userKeys.find(apiKey => apiKey.name === name);
    await deleteKey(apiKey.key);
    return {
        statusCode: 200, headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }, body: JSON.stringify({ message: "API key deleted successfully" })
    };
};

// Set API key wallet route
export const setWallet = async (event) => {
    console.log("Received set wallet request");
    const user = await getAuthThenUser(event);
    if (!user) return {
        statusCode: 401, headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }, body: JSON.stringify({ message: "Unauthorized" })
    };

    const { keyName, walletName } = JSON.parse(event.body);
    if (!keyName) return {
        statusCode: 400, headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }, body: JSON.stringify({ message: "API key name required" })
    };
    if (!walletName) return {
        statusCode: 400, headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }, body: JSON.stringify({ message: "Wallet name required" })
    };
    const wallet = user.wallets.find(wallet => wallet.name === walletName);
    if (!wallet) return {
        statusCode: 400, headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }, body: JSON.stringify({ message: "Wallet not found" })
    };

    const userKeys = await getKeysByUser(user.id);
    if (!userKeys) return {
        statusCode: 400, headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }, body: JSON.stringify({ message: "API keys not found" })
    };
    const key = userKeys.find(apiKey => apiKey.name === keyName)?.key;
    if (!key) return {
        statusCode: 404, headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }, body: JSON.stringify({ message: "API key not found" })
    };

    await setWalletName(key, wallet.name);
    return {
        statusCode: 200, headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }, body: JSON.stringify({ message: "Set wallet successfully" })
    };
};

export const getWallet = async (event) => {
    console.log("Received get wallet address request");
    const user = await getAuthThenUser(event);
    if (!user) return {
        statusCode: 401, headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }, body: JSON.stringify({ message: "Unauthorized" })
    };
    const { key } = JSON.parse(event.body);
    if (!key) return {
        statusCode: 401, headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }, body: JSON.stringify({ message: "API key required" })
    };

    const apiKey = await getKey(key);
    if (!apiKey) return {
        statusCode: 401, headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }, body: JSON.stringify({ message: "Invalid API key" })
    };

    return {
        statusCode: 200, headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }, body: JSON.stringify({ address: apiKey.wallet })
    };
};