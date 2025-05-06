import express from "express";
import { generateApiKey, getApiKeys, deleteApiKey, setWallet, getWallet, rotateKey } from "../functions/dashboard-keys-functions.js";

const router = express.Router();

// Define routes
router.post("/generate-api-key", async (req, res) => {
    const response = await generateApiKey({ body: JSON.stringify(req.body), headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

router.get("/get-api-keys", async (req, res) => {
    const response = await getApiKeys({ headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

router.post("/delete-api-key", async (req, res) => {
    const response = await deleteApiKey({ body: JSON.stringify(req.body), headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

router.post("/set-wallet", async (req, res) => {
    const response = await setWallet({ body: JSON.stringify(req.body), headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

router.post("/get-wallet", async (req, res) => {
    const response = await getWallet({ body: JSON.stringify(req.body), headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

router.post("/rotate-key", async (req, res) => {
    const response = await rotateKey({ body: JSON.stringify(req.body), headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

export default router;
