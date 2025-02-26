import express from "express";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { 
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    SignUpCommand,
    ConfirmSignUpCommand,
    GetUserCommand,
    GlobalSignOutCommand,
    AdminGetUserCommand,
    ResendConfirmationCodeCommand
} from "@aws-sdk/client-cognito-identity-provider";
// import bcrypt from "bcryptjs";
import z from "zod";
// import { v4 as uuidv4 } from 'uuid';
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
// import { id } from "ethers";
dotenv.config();

const router = express.Router();

// Connect to dynamo
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamo = DynamoDBDocumentClient.from(client);
const USERS_TABLE = "DyceTable";

// connecto to cognito
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

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
// const getUserByEmail = async (email) => {
//     const command = new QueryCommand({
//         TableName: USERS_TABLE,
//         IndexName: "email-index",
//         KeyConditionExpression: "email = :email",
//         ExpressionAttributeValues: { ":email": email },
//     });

//     const { Items } = await dynamo.send(command);
//     return Items.length ? Items[0] : null;
// };

// Helper function to get a user by id
const getUserById = async (user_id) => {
    const getUserCommand = new GetCommand({
        TableName: USERS_TABLE,
        Key: { 
            id: user_id ,
        },
    });

    const { Item } = await dynamo.send(getUserCommand);
    return Item;
}

const checkAndPutUser = async (idToken, email) => {
    try {
        const existingUser = await getUserById(idToken);

        if (existingUser) {
            console.log("User already exists. Skipping insert.");
        } else {
            const putCommand = new PutCommand({
                TableName: USERS_TABLE,
                Item: {
                    id: idToken,
                    email: email,
                    apiKeys: [],
                    wallets: [],
                },
            });

            await dynamo.send(putCommand);
            console.log("New user inserted.");
        }
    } catch (error) {
        console.error("Error checking or inserting user:", error);
    }
};

// Login route
router.post("/login", async (req, res) => {
    console.log("Received login request");

    try {
        const authCommand = new InitiateAuthCommand({
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: CLIENT_ID,
            AuthParameters: {
                USERNAME: req.body.email,
                PASSWORD: req.body.password
            }
        });

        const authResponse = await cognitoClient.send(authCommand);
        console.log("Login successful");
        const idToken = authResponse.AuthenticationResult.IdToken
        const email = req.body.email;
        var decodedToken = jwt.decode(idToken); // get unchanging user id from token
        decodedToken = decodedToken["cognito:username"];
        checkAndPutUser(decodedToken, email);

        req.session.userId = decodedToken;
        req.session.accessToken = authResponse.AuthenticationResult.AccessToken;
        req.session.refreshToken = authResponse.AuthenticationResult.RefreshToken;
        
        return res.json({ 
            authenticated: true,
            userId: req.session.userId
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(401).json({ message: "Wrong email or password" });
    }
});

router.post("/register", async (req, res) => {
    console.log("Received register request");

    const result = signUpSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(401).json({ message: result.error.errors[0].message });
    }
    console.log("We got here")

    const { email, password } = result.data;
    res.status(201).json({ 
        message: "Verification email sent. Please check your inbox for the verification code." 
    });
    try {
        const signUpCommand = new SignUpCommand({
            ClientId: CLIENT_ID,
            Username: email,
            Password: password,
            UserAttributes: [
                {
                    Name: "email",
                    Value: email
                }
            ]
        });
        console.log("we got here")

        await cognitoClient.send(signUpCommand);
        console.log("Sent verification")
        
        res.status(201).json({ 
            message: "Verification email sent. Please check your inbox for the verification code." 
        });
    } catch (error) {
        console.error("Registration error:", error);
        if (error.name === "UsernameExistsException") {
            return res.status(401).json({ message: "Email already in use!" });
        }
        res.status(500).json({ message: "Registration failed" });
    }
});

// Email verification route
router.post("/verify-email", async (req, res) => {
    console.log("Received verify email request");
    const { email, code } = req.body;
    if (!email || !code) {
        return res.status(400).json({ message: "Email and verification code are required" });
    }
    try {
        const confirmCommand = new ConfirmSignUpCommand({
            ClientId: CLIENT_ID,
            Username: email,
            ConfirmationCode: code
        });

        await cognitoClient.send(confirmCommand);

        res.json({user: req.session.idToken });
    } catch (error) {
        console.error("Verification error:", error);
        if (error.message && error.message.includes("Current status is CONFIRMED")) {
            return res.status(400).json({ message: "Email already verified" });
        }
        res.status(400).json({ message: "Invalid verification code. Try resending" });
    }
});

router.post("/resend-verification", async (req, res) => {
    console.log("Received resend verification request");
    
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    try {
      // Check if the user exists in Cognito
      const adminGetUserCommand = new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email
      });
      
      await cognitoClient.send(adminGetUserCommand);
      
      // If the user exists, resend the verification code
      const resendConfirmationCommand = new ResendConfirmationCodeCommand({
        ClientId: CLIENT_ID,
        Username: email
      });
      
      await cognitoClient.send(resendConfirmationCommand);
      
      res.json({ message: "Verification code resent successfully" });
    } catch (error) {
      console.error("Resend verification error:", error);
      
      if (error.name === "UserNotFoundException") {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(500).json({ message: "Failed to resend verification code" });
    }
  });

// Logout route
router.post("/logout", async (req, res) => {
    console.log("Received logout request");

    if (req.session.accessToken) {
        try {
            // Sign out from Cognito
            const signOutCommand = new GlobalSignOutCommand({
                AccessToken: req.session.accessToken
            });
            
            await cognitoClient.send(signOutCommand);
        } catch (error) {
            console.error("Logout error:", error);
            // Continue with local logout even if Cognito logout fails
        }
    }

    req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ message: "Logout successful" });
    });
});

// Dashboard data route
router.get("/auth-check", async (req, res) => {
    console.log("Received authorization check request");

    if (!req.session.userId) {
        return res.json({ authenticated: false });
    }

    try {
        // Verify the access token is still valid sothere can't be stale state fr fr
        const getUserCommand = new GetUserCommand({
            AccessToken: req.session.accessToken
        });
        
        await cognitoClient.send(getUserCommand);
        console.log("User is authenticated");
        console.log("User ID:", req.session.userId);
        res.json({ 
            authenticated: true,
            user: req.session.userId
        });
    } catch (error) {
        console.error("Auth check error:", error);
        req.session.destroy(() => {
            res.clearCookie("connect.sid");
            res.json({ authenticated: false });
        });
    }
});

export default router;