import { getAuthThenUser } from "./dashboard-login-functions.js";
import { getKeysByUser, addNewWallet, updateWallets, setWalletName } from "./dynamo-functions.js"
import dotenv from "dotenv";
dotenv.config();

// Add wallet route
export const addWallet = async (event) => {
    console.log("Received add wallet request");
    const user = await getAuthThenUser(event);
    if (!user) return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
    const { name, address, key } = JSON.parse(event.body);
    if (!name || !address || !key) return { statusCode: 400, body: JSON.stringify({ message: "Wallet name, address, and private key are required" }) };
    if (user.wallets?.some(wallet => wallet.name === name)) return { statusCode: 400, body: JSON.stringify({ message: "Wallet name already in use" }) };

    await addNewWallet(user.id, name, address, key);
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
    for (let apiKey of userKeys)
        if (apiKey.wallet === name) await setWalletName(apiKey.key, null);
    await updateWallets(user.id, updatedWallets);
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