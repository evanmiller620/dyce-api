import { getAuthThenUser } from "./dashboard-login-functions.js";
import { getWalletBalance, verifyWallet } from "./payments-functions.js";
import { getKeysByUser, addNewWallet, updateWallets, setWalletName } from "./dynamo-functions.js"
import dotenv from "dotenv";
import { badRequestResponse, successResponse, unauthorizedResponse } from "./responses.js";
dotenv.config();

// Add wallet route
export const addWallet = async (event) => {
    console.log("Received add wallet request");
    const user = await getAuthThenUser(event);
    if (!user) return unauthorizedResponse("Unauthorized")
    const { name, address, key } = JSON.parse(event.body);
    if (!name || !address || !key)
        return badRequestResponse("Wallet name, address, and private key are required");
    if (user.wallets?.some(wallet => wallet.name === name))
        return badRequestResponse("Wallet name already in use");
    if (user.wallets?.some(wallet => wallet.address === address))
        return badRequestResponse("Wallet already added");

    const valid = await verifyWallet(address, key);
    if (!valid) return badRequestResponse("Invalid wallet credentials");

    await addNewWallet(user.id, name, address, key);
    return successResponse({ message: "Successfully added wallet!" });
};

// Get wallets route
export const getWallets = async (event) => {
    console.log("Received get wallets request");
    const user = await getAuthThenUser(event);
    if (!user) return unauthorizedResponse("Unauthorized");
    const formattedWallets = await Promise.all(
        user.wallets?.map(async ({ name, address }) => ({
            name,
            address,
            balance: await getWalletBalance(address)
        }))
    );
    return successResponse({ wallets: formattedWallets });
};

// Revoke wallet route
export const removeWallet = async (event) => {
    console.log("Received remove wallet request");
    const user = await getAuthThenUser(event);
    if (!user) return unauthorizedResponse("Unauthorized");
    const { name } = JSON.parse(event.body);
    if (!name) return badRequestResponse("Wallet name required");

    const updatedWallets = user.wallets?.filter(wallet => wallet.name !== name) || [];
    const userKeys = await getKeysByUser(user.id);
    for (let apiKey of userKeys)
        if (apiKey.wallet === name) await setWalletName(apiKey.key, null);
    await updateWallets(user.id, updatedWallets);
    return successResponse({ message: "Wallet removed successfully" });
};