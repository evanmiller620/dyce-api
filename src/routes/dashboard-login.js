import express from "express";
import { login, register, verifyEmail, resendVerification, logout, authCheck } from "../functions/dashboard-login-functions.js";

const router = express.Router();

// Define routes
router.post("/login", async (req, res) => {
    const response = await login({ body: JSON.stringify(req.body), headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

router.post("/register", async (req, res) => {
    const response = await register({ body: JSON.stringify(req.body), headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

router.post("/verify-email", async (req, res) => {
    const response = await verifyEmail({ body: JSON.stringify(req.body), headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

router.post("/resend-verification", async (req, res) => {
    const response = await resendVerification({ body: JSON.stringify(req.body), headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

router.post("/logout", async (req, res) => {
    const response = await logout({ body: JSON.stringify(req.body), headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

router.get("/auth-check", async (req, res) => {
    const response = await authCheck({ headers: req.headers });
    res.status(response.statusCode).json(JSON.parse(response.body));
});

export default router;
