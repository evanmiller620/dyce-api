import express from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Connect to MongoDB
mongoose.connect(process.env.DB_STRING)
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.error("MongoDB connection error:", err));

// Define MongoDB user data fields
const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String,
    verified: Boolean,
    verificationToken: String,
    apiKeys: [{
        name: String,
        key: { type: String, unique: true },
        useCount: { type: Number, default: 0 }
    }]
});
const User = mongoose.model("User", userSchema)

// Middleware requiring authentication
const requireAuth = async (req, res, next) => {
    if (!req.session.user)
        return res.status(401).json({ message: "You must be logged in to access this route" });
    const user = await User.findOne({ email: req.session.user });
    if (!user)
        return res.status(404).json({ message: "User not found" });
    req.user = user;
    next();
}

// Generate API key route
router.post("/generate-api-key", requireAuth, async (req, res) => {
    console.log("Received generate key request");

    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Key name required" });
    
    if (req.user.apiKeys.some((key) => key.name === name))
        return res.status(400).json({ message: "Key name already in use" });
        
    const newKey = { name, key: crypto.randomBytes(32).toString("hex") };
    req.user.apiKeys.push(newKey);
    await req.user.save();
    
    res.json({ apiKey: newKey });
});

// Get API keys route
router.get("/get-api-keys", requireAuth, async (req, res) => {
    console.log("Received get keys request");
    
    const formattedKeys = req.user.apiKeys.map(({ name, key, useCount }) => ({
        name,
        key: `${key.slice(0, 4)}...${key.slice(-4)}`,
        useCount
    }));
    res.json({ apiKeys: formattedKeys });
});

// Revoke API key route
router.post("/delete-api-key", requireAuth, async (req, res) => {
    console.log("Received delete key request");

    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "API key name required" });

    req.user.apiKeys = req.user.apiKeys.filter(apiKey => apiKey.name !== name);
    await req.user.save();

    res.json({ message: "API key deleted successfully" });
});

// Middleware requiring API key
const requireKey = async (req, res, next) => {
    const apiKey = req.headers['apikey'];
    if (!apiKey)
        return res.status(401).json({ message: "API key required" });
    const user = await User.findOne({ "apiKeys.key": apiKey });
    if (!user)
        return res.status(401).json({ message: "Invalid API key" });
    
    const apiKeyEntry = user.apiKeys.find(entry => entry.key === apiKey);
    apiKeyEntry.useCount += 1;
    await user.save();

    req.user = user;
    req.apiKeyEntry = apiKeyEntry;
    next();
}

// Use API key route (example)
router.post("/use-api-key", requireKey, async (req, res) => {
    console.log("Received use key request");

    res.json({ message: "API Key used successfully", useCount: req.apiKeyEntry.useCount })
});

export default router;