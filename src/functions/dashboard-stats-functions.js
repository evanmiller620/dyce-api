import { getAuthThenUser } from "./dashboard-login-functions.js";
import { getUseCounts, getTxAmounts, getKeysByUser } from "./dynamo-functions.js"
import { badRequestResponse, createdResponse, notFoundResponse, successResponse, unauthorizedResponse } from "./responses.js";

// Get Use
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

// Get use counts route
export const getUsageHistory = async (event) => {
    console.log("Received get usage history request");
    const user = await getAuthThenUser(event);
    if (!user) return unauthorizedResponse("Unauthorized");

    const { keyName } = JSON.parse(event.body);
    const userKeys = await getKeysByUser(user.id);
    if (!userKeys) return notFoundResponse("API keys not found");
    const key = userKeys.find(apiKey => apiKey.name === keyName)?.key;
    if (!key) return notFoundResponse("API key not found");

    const useCounts = await getUseCounts(key);
    return successResponse({ useCounts });
};

// Get transaction history route
export const getTxHistory = async (event) => {
    console.log("Received get transaction history request");
    const user = await getAuthThenUser(event);
    if (!user) return unauthorizedResponse("Unauthorized");

    const { keyName } = JSON.parse(event.body);
    const userKeys = await getKeysByUser(user.id);
    if (!userKeys) return notFoundResponse("API keys not found");
    const key = userKeys.find(apiKey => apiKey.name === keyName)?.key;
    if (!key) return notFoundResponse("API key not found");

    const txAmounts = await getTxAmounts(key);
    return successResponse({ txAmounts });
};