import { getAuthThenUser } from "./dashboard-login-functions.js";
import { getUseCounts, getTxAmounts, getKeysByUser, getFeeAmounts } from "./dynamo-functions.js"
import { notFoundResponse, successResponse, unauthorizedResponse } from "./responses.js";

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

// Get transaction history route
export const getFeeHistory = async (event) => {
    console.log("Received get transaction fee history request");
    const user = await getAuthThenUser(event);
    if (!user) return unauthorizedResponse("Unauthorized");

    const { keyName } = JSON.parse(event.body);
    const userKeys = await getKeysByUser(user.id);
    if (!userKeys) return notFoundResponse("API keys not found");
    const key = userKeys.find(apiKey => apiKey.name === keyName)?.key;
    if (!key) return notFoundResponse("API key not found");

    const feeAmounts = await getFeeAmounts(key);
    return successResponse({ feeAmounts });
};