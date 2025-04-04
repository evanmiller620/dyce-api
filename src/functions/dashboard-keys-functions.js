// import express from "express";
import crypto from "crypto";
import { getAuthThenUser } from "./dashboard-login-functions.js";
import { getKey, createKey, deleteKey, getKeysByUser, setWalletName } from "./dynamo-functions.js"
import dotenv from "dotenv";
import { badRequestResponse, createdResponse, notFoundResponse, successResponse, unauthorizedResponse } from "./responses.js";
dotenv.config();

// Generate API key route
export const generateApiKey = async (event) => {
    console.log("Received generate key request");
    const user = await getAuthThenUser(event);
    if (!user) return unauthorizedResponse("Unauthorized");
    const { name } = JSON.parse(event.body);
    if (!name) return badRequestResponse("Key name required");

    const userKeys = await getKeysByUser(user.id);
    if (userKeys?.some(apiKey => apiKey.name === name))
        return badRequestResponse("Key name already in use!");
    const newKey = crypto.randomBytes(32).toString("hex")
    await createKey(newKey, user.id, name, user.wallets.length ? user.wallets[0].name : null)
    return createdResponse({ apiKey: newKey });
};

// Get API keys route
export const getApiKeys = async (event) => {
    console.log("Received get keys request");
    const user = await getAuthThenUser(event);
    if (!user) return unauthorizedResponse("Unauthorized");

    const apiKeys = await getKeysByUser(user.id);
    const formattedKeys = apiKeys?.map(({ key, name, wallet, useCount }) => ({
        name,
        key: `${key.slice(0, 4)}...${key.slice(-4)}`,
        wallet: wallet,
        useCount,
    })) || [];
    return successResponse({ apiKeys: formattedKeys });
};

// Revoke API key route
export const deleteApiKey = async (event) => {
    console.log("Received delete key request");
    const user = await getAuthThenUser(event);
    if (!user) return unauthorizedResponse("Unauthorized");
    const { name } = JSON.parse(event.body);
    if (!name) return badRequestResponse("API key name required");

    const userKeys = await getKeysByUser(user.id);
    const apiKey = userKeys.find(apiKey => apiKey.name === name);
    await deleteKey(apiKey.key);
    return successResponse({ message: "API key deleted successfully" });
};

// Set API key wallet route
export const setWallet = async (event) => {
    console.log("Received set wallet request");
    const user = await getAuthThenUser(event);
    if (!user) return unauthorizedResponse("Unauthorized");

    const { keyName, walletName } = JSON.parse(event.body);
    if (!keyName || !walletName)
        return badRequestResponse("Key and wallet name required");
    const wallet = user.wallets.find(wallet => wallet.name === walletName);
    if (!wallet) return notFoundResponse("Wallet not found");

    const userKeys = await getKeysByUser(user.id);
    if (!userKeys) return notFoundResponse("API keys not found");

    const key = userKeys.find(apiKey => apiKey.name === keyName)?.key;
    if (!key) return notFoundResponse("API key not found");

    await setWalletName(key, wallet.name);
    return successResponse({ message: "Set wallet successfully" });
};

export const getWallet = async (event) => {
    console.log("Received get wallet address request");
    const user = await getAuthThenUser(event);
    if (!user) return unauthorizedResponse("Unauthorized");
    const { key } = JSON.parse(event.body);
    if (!key) return badRequestResponse("API key required");

    const apiKey = await getKey(key);
    if (!apiKey) return notFoundResponse("API key not found");

    return successResponse({ address: apiKey.wallet });
};