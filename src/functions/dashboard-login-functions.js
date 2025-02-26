import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    SignUpCommand,
    ConfirmSignUpCommand,
    GetUserCommand,
    // GlobalSignOutCommand,
    AdminGetUserCommand,
    ResendConfirmationCodeCommand
} from "@aws-sdk/client-cognito-identity-provider";
import z from "zod";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
// import { v4 as uuidv4 } from 'uuid';
// import bcrypt from "bcryptjs";
// import { id } from "ethers";
dotenv.config();


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
// const getUserById = async (user_id) => {
//     const getUserCommand = new GetCommand({
//         TableName: USERS_TABLE,
//         Key: {
//             id: user_id,
//         },
//     });

//     const { Item } = await dynamo.send(getUserCommand);
//     return Item;
// }

// // helper function to create new db entry for user if not existing. only used once so merged
// const checkAndPutUser = async (idToken, email) => {
//     try {
//         const existingUser = await getUserById(idToken);

//         if (existingUser) {
//             console.log("User already exists. Skipping insert.");
//         } else {
//             const putCommand = new PutCommand({
//                 TableName: USERS_TABLE,
//                 Item: {
//                     id: idToken,
//                     email: email,
//                     apiKeys: [],
//                     wallets: [],
//                 },
//             });

//             await dynamo.send(putCommand);
//             console.log("New user inserted.");
//         }
//     } catch (error) {
//         console.error("Error checking or inserting user:", error);
//     }
// };

// Login route
export const login = async (event) => {
    console.log("Received login request");
    const body = JSON.parse(event.body);

    const email = body.email;

    try {
        const authCommand = new InitiateAuthCommand({
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: CLIENT_ID,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: body.password
            }
        });

        const authResponse = await cognitoClient.send(authCommand);
        console.log("Login successful");
        const idToken = authResponse.AuthenticationResult.IdToken
        var decodedToken = jwt.decode(idToken); // get unchanging user id from token
        decodedToken = decodedToken["cognito:username"];

        const getUserCommand = new GetCommand({
            TableName: USERS_TABLE,
            Key: { id: decodedToken },
        });
        const { Item } = await dynamo.send(getUserCommand);
        // if user doesn't already exist in table, add them
        if (!Item) {
            const putCommand = new PutCommand({
                TableName: USERS_TABLE,
                Item: { id: decodedToken, email: body.email, apiKeys: [], wallets: [] },
            });
            await dynamo.send(putCommand);
        }

        // req.session.userId = decodedToken;
        // req.session.accessToken = authResponse.AuthenticationResult.AccessToken;

        return {
            statusCode: 200,
            body: JSON.stringify({ authenticated: true, userId: decodedToken, accessToken: authResponse.AuthenticationResult.AccessToken }),
        };
    } catch (error) {
        console.error("Login error:", error);
        return { statusCode: 401, body: JSON.stringify({ message: "Wrong email or password" }) };
    }
};

export const register = async (event) => {
    console.log("Received register request");
    const body = JSON.parse(event.body);

    const result = signUpSchema.safeParse(body);
    if (!result.success) {
        return { statusCode: 400, body: JSON.stringify({ message: result.error.errors[0].message }) };
    }
    try {
        const signUpCommand = new SignUpCommand({
            ClientId: CLIENT_ID,
            Username: body.email,
            Password: body.password,
            UserAttributes: [{ Name: "email", Value: body.email }],
        });
        await cognitoClient.send(signUpCommand);
        return { statusCode: 201, body: JSON.stringify({ message: "Verification email sent." }) };
    } catch (error) {
        
        if (error.name === "UsernameExistsException") {
            console.error("Registration error:", error.name);
            return { statusCode: 401, body: JSON.stringify({ message: "Email already in use!" }) };
        }
        console.error("Registration error:", error);
        return { statusCode: 500, body: JSON.stringify({ message: "Registration failed" }) };
    }
};

// Email verification route
export const verifyEmail = async (event) => {
    console.log("Received verify email request");
    const { email, code } = JSON.parse(event.body);
    try {
        const confirmCommand = new ConfirmSignUpCommand({
            ClientId: CLIENT_ID,
            Username: email,
            ConfirmationCode: code,
        });
        await cognitoClient.send(confirmCommand);
        return { statusCode: 200, body: JSON.stringify({ message: "Email verified" }) };
    } catch (error) {
        console.log("Verification error:", error);
        return { statusCode: 400, body: JSON.stringify({ message: "Invalid verification code" }) };
    }
};

export const resendVerification = async (event) => {
    console.log("Received resend verification request");
    const { email } = JSON.parse(event.body);
    try {
        const adminCommand = new AdminGetUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: email,
        });
        await cognitoClient.send(adminCommand);

        const resendCommand = new ResendConfirmationCodeCommand({
            ClientId: CLIENT_ID,
            Username: email,
        });
        await cognitoClient.send(resendCommand);
        return { statusCode: 200, body: JSON.stringify({ message: "Verification code resent" }) };
    } catch (error) {
        console.error("Resend verification error:", error);
        return { statusCode: 404, body: JSON.stringify({ message: "User not found" }) };
    }
};

// Logout route
// didn't get working. since state is saved in client, logout just deletes the token currently
// we need a way to comunicate with cognito to invalidate the token
export const logout = async (event) => {
    console.log("Received logout request");
    console.log(event);
    return { statusCode: 200, body: JSON.stringify({ message: "Logout successful" }) };
    // try { 
    //     const signOutCommand = new GlobalSignOutCommand({ AccessToken: token });
    //     await cognitoClient.send(signOutCommand);
    //     return { statusCode: 200, body: JSON.stringify({ message: "Logout successful" }) };
    // } catch (error) {
    //     console.log("Logout error:", error);
    //     return { statusCode: 400, body: JSON.stringify({ message: "Logout failed" }) };
    // }
};

// check if user is authenticated
export const authCheck = async (event) => {
    console.log("Received auth check request");
    try {
        const token = event.headers.Authorization || event.headers.authorization;
        if (!token) {
            console.log("No token provided");
            return {
                statusCode: 401,
                body: JSON.stringify({ authenticated: false, message: "No token provided" }),
            };
        }

        const getUserCommand = new GetUserCommand({ AccessToken: token });
        const user = await cognitoClient.send(getUserCommand);
        console.log("User authenticated");
        return {
            statusCode: 200,
            body: JSON.stringify({ authenticated: true, user: user.Username }),
        };
    } catch (error) {
        console.error("Auth check error:", error);
        return {
            statusCode: 401,
            body: JSON.stringify({ authenticated: false, message: "Invalid or expired token" }),
        };
    }
};