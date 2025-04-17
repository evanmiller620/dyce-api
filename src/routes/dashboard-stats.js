import express from "express";
import { getUsageHistory, getTxHistory, getFeeHistory } from "../functions/dashboard-stats-functions.js";

const router = express.Router();

router.post("/get-usage-history", async (req, res) => {
    const response = await getUsageHistory({ body: JSON.stringify(req.body), headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

router.post("/get-tx-history", async (req, res) => {
    const response = await getTxHistory({ body: JSON.stringify(req.body), headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

router.post("/get-fee-history", async (req, res) => {
    const response = await getFeeHistory({ body: JSON.stringify(req.body), headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

export default router;