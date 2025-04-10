import express from "express";
import { addWallet, getWallets, removeWallet } from "../functions/dashboard-wallets-functions.js";

const router = express.Router();

// Define routes
router.post("/add-wallet", async (req, res) => {
    const response = await addWallet({ body: JSON.stringify(req.body), headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

router.get("/get-wallets", async (req, res) => {
    const response = await getWallets({ headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

router.post("/remove-wallet", async (req, res) => {
    const response = await removeWallet({ body: JSON.stringify(req.body), headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

export default router;