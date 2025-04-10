import { createUser, getUserById } from "./dynamo-functions.js"
import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, ConfirmSignUpCommand, GetUserCommand, GlobalSignOutCommand, AdminGetUserCommand, ResendConfirmationCodeCommand } from "@aws-sdk/client-cognito-identity-provider";
import z from "zod";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { badRequestResponse, errorResponse, notFoundResponse, successResponse, unauthorizedResponse } from "./responses.js";
dotenv.config();

// Connect to Cognito
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


export const login = async (event) => {
    console.log("Received login request");
    const body = JSON.parse(event.body);
    const email = body.email;
    const password = body.password;
    try {
        const authCommand = new InitiateAuthCommand({
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: CLIENT_ID,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password
            }
        });
        const authResponse = await cognitoClient.send(authCommand);
        const idToken = authResponse.AuthenticationResult.IdToken
        const accessToken = authResponse.AuthenticationResult.AccessToken;
        var decodedToken = jwt.decode(idToken); // get unchanging user id from token
        decodedToken = decodedToken["cognito:username"];

        await createUser(decodedToken, email);
        return successResponse({
            authenticated: true, userId: decodedToken,
            accessToken: accessToken, idToken: idToken
        });
    } catch {
        return unauthorizedResponse("Wrong email or password");
    }
};

export const register = async (event) => {
    console.log("Received register request");
    const body = JSON.parse(event.body);

    const result = signUpSchema.safeParse(body);
    if (!result.success)
        return badRequestResponse(result.error.errors[0].message)

    try {
        const signUpCommand = new SignUpCommand({
            ClientId: CLIENT_ID,
            Username: body.email,
            Password: body.password,
            UserAttributes: [{ Name: "email", Value: body.email }],
        });
        await cognitoClient.send(signUpCommand);
        return successResponse({ message: "Verification email sent." });
    } catch (error) {
        if (error.name === "UsernameExistsException")
            return badRequestResponse("Email already in use!");
        return errorResponse("Registration failed");
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
        return successResponse({ message: "Email verified" });
    } catch {
        return badRequestResponse("Invalid verification code");
    }
};

// Resend email verification route
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
        return successResponse({ message: "Verification code resent" });
    } catch (error) {
        console.error("Resend verification error:", error);
        return notFoundResponse("User not found" );
    }
};

// Logout route
export const logout = async (event) => {
    console.log("Received logout request");
    try {
        const token = event.headers.Authorization || event.headers.authorization;
        const signOutCommand = new GlobalSignOutCommand({ AccessToken: token });
        await cognitoClient.send(signOutCommand);
        return successResponse({ message: "Logout successful" });
    } catch {
        return errorResponse("Logout failed");
    }
};

// Check if user is authenticated
export const authCheck = async (event) => {
    console.log("Received auth check request");
    try {
        const token = event.headers.Authorization || event.headers.authorization;
        if (!token) return badRequestResponse("No token provided");
        const getUserCommand = new GetUserCommand({ AccessToken: token });
        const user = await cognitoClient.send(getUserCommand);
        // console.log(`User authenticated with token ${token.slice(0, 4)}...${token.slice(-4)}`);
        return successResponse({ authenticated: true, user: user.Username });
    } catch {
        return unauthorizedResponse("Invalid or expired token");
    }
};

export const getAuthThenUser = async (event) => {
    const auth = await authCheck(event);
    if (auth.statusCode !== 200) return null;
    const parsedBody = JSON.parse(auth.body);
    const userId = parsedBody.user;
    const user = await getUserById(userId);
    return user;
}
