import { CognitoIdentityProviderClient, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import z from "zod";

const cognitoClient = new CognitoIdentityProviderClient({ region: "us-east-1" });
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const signUpSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
});
export const reg_handler = async (event) => {
    console.log("Received register request");

    try {
        const body = JSON.parse(event.body);

        // Validate request body
        const result = signUpSchema.safeParse(body);
        if (!result.success) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: result.error.errors[0].message })
            };
        }

        console.log("Validation passed");

        const { email, password } = result.data;

        const signUpCommand = new SignUpCommand({
            ClientId: CLIENT_ID,
            Username: email,
            Password: password,
            UserAttributes: [{ Name: "email", Value: email }]
        });

        console.log("Sending signup request...");

        await cognitoClient.send(signUpCommand);
        console.log("Sent verification email");

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: "Verification email sent. Please check your inbox for the verification code."
            })
        };

    } catch (error) {
        console.error("Registration error:", error);

        let statusCode = 500;
        let message = "Registration failed";

        if (error.name === "UsernameExistsException") {
            statusCode = 400;
            message = "Email already in use!";
        }

        return {
            statusCode,
            body: JSON.stringify({ message })
        };
    }
};


// const { SignUpCommand } = require("@aws-sdk/client-cognito-identity-provider");
// const { cognitoClient } = require("./cognitoClient"); // Import your Cognito client instance
// const express = require("express");

// const CLIENT_ID = process.env.CLIENT_ID;

// const registerHandler = async (event, context) => {
//     console.log("Received register request");

//     let body;
//     try {
//         body = event.body ? JSON.parse(event.body) : {};
//     } catch (error) {
//         return {
//             statusCode: 400,
//             body: JSON.stringify({ message: "Invalid JSON body" }),
//         };
//     }

//     const { email, password } = body;
    
//     try {
//         const signUpCommand = new SignUpCommand({
//             ClientId: CLIENT_ID,
//             Username: email,
//             Password: password,
//             UserAttributes: [{ Name: "email", Value: email }],
//         });

//         console.log("Sending sign-up request...");
//         await cognitoClient.send(signUpCommand);
//         console.log("Sign-up successful");

//         return {
//             statusCode: 201,
//             body: JSON.stringify({
//                 message: "Verification email sent. Please check your inbox for the verification code.",
//             }),
//         };
//     } catch (error) {
//         console.error("Registration error:", error);
//         return {
//             statusCode: error.name === "UsernameExistsException" ? 400 : 500,
//             body: JSON.stringify({
//                 message: error.name === "UsernameExistsException" ? "Email already in use!" : "Registration failed",
//             }),
//         };
//     }
// };

// // Export for Lambda
// module.exports.handler = registerHandler;

// // Export for Express (direct function use)
// module.exports.register = async (req, res) => {
//     const response = await registerHandler({ body: JSON.stringify(req.body) });
//     res.status(response.statusCode).json(JSON.parse(response.body));
// };
