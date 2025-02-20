import express from "express";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import crypto from "crypto";
import z from "zod";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Connect to dynamo
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamo = DynamoDBDocumentClient.from(client);

const USERS_TABLE = "DyceTable";

// Define sign up fields
const signUpSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
});

// Helper function to get a user by email
const getUserByEmail = async (email) => {
    const command = new ScanCommand({
        TableName: USERS_TABLE,
        FilterExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email },
    });

    const { Items } = await dynamo.send(command);
    return Items.length ? Items[0] : null;
};

// Login route
router.post("/login", async (req, res) => {
    console.log("Received login request");

    const user = await getUserByEmail(req.body.email);
    if (user && user.verified && (await bcrypt.compare(req.body.password, user.password))) {
        req.session.user = user.email;
        return res.json({ user: req.session.user });
    }

    res.status(401).json({ message: "Wrong email or password" });
});

router.post("/register", async (req, res) => {
    console.log("Received register request");

    const result = signUpSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(401).json({ message: result.error.errors[0].message });
    }

    const { email, password } = result.data;

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
        return res.status(401).json({ message: "Email already in use!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(20).toString("hex");

    const command = new PutCommand({
        TableName: USERS_TABLE,
        Item: {
            email,
            password: hashedPassword,
            verified: false,
            verificationToken,
        },
    });

    await dynamo.send(command);

    // Send verification email
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD },
    });

    const verificationLink = `http://localhost:5173/verify?token=${verificationToken}`;
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Email Verification",
        text: `Please verify your email address by clicking the link below:\n\n${verificationLink}`,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(201).json({ message: "Verification email sent" });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ message: "Failed to send verification email" });
    }
});

// Email verification route
router.get("/verify-email", async (req, res) => {
    console.log("Received verify email request");

    const { token } = req.query;
    const user = await getUserByEmail(token);

    if (!user) return res.status(400).json({ message: "Invalid verification link" });

    const command = new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { email: user.email },
        UpdateExpression: "SET verified = :verified, verificationToken = :null",
        ExpressionAttributeValues: {
            ":verified": true,
            ":null": null,
        },
    });

    await dynamo.send(command);

    req.session.user = user.email;
    res.json({ user: req.session.user });
});

// Logout route
router.post("/logout", (req, res) => {
    console.log("Received logout request");

    req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ message: "Logout successful" });
    });
});

// Dashboard data route
router.get("/auth-check", (req, res) => {
    console.log("Received authorization check request");

    if (req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
});

export default router;