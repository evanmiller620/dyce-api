import express from "express";
import dotenv from "dotenv";
import { generateApiKey, getApiKeys, deleteApiKey, useApiKey, setWallet, getWallet } from "../functions/dashboard-keys-functions.js";
dotenv.config();

const router = express.Router();

// Define routes
router.post("/generate-api-key", async (req, res) => {
    const response = await generateApiKey({ body: JSON.stringify(req.body) });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

router.post("/get-api-keys", async (req, res) => {
    const response = await getApiKeys({ body: JSON.stringify(req.body) });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

router.post("/delete-api-key", async (req, res) => {
    const response = await deleteApiKey({ body: JSON.stringify(req.body) });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

router.post("/use-api-key", async (req, res) => {
    const response = await useApiKey({ body: JSON.stringify(req.body) });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

router.post("/set-wallet", async (req, res) => {
    const response = await setWallet({ body: JSON.stringify(req.body) });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

router.post("/get-wallet", async (req, res) => {
    const response = await getWallet({ headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

export default router;
