import express from "express"
import { getWalletAddress, approveSpending, requestPayment, permitSpending, receivePayment } from "../functions/payments-functions.js"

const router = express.Router();

router.get("/get-wallet-address", async (req, res) => {
    const response = await getWalletAddress({ body: JSON.stringify(req.body), headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

router.post("/approve-spending", async (req, res) => {
    const response = await approveSpending({ body: JSON.stringify(req.body), headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});


router.post("/request-payment", async (req, res) => {
    const response = await requestPayment({ body: JSON.stringify(req.body), headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

router.post("/permit-spending", async (req, res) => {
    const response = await permitSpending({ body: JSON.stringify(req.body), headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
})

router.post("/receive-payment", async (req, res) => {
    const response = await receivePayment({ body: JSON.stringify(req.body), headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

export default router;