# DyceAPI JavaScript API Library
This library provides convenient access to the Dyce API from JavaScript.


## Overview
This project aims to revolutionize the way users pay for online services by introducing a cryptocurrency pay-as-you-go pricing model. Many existing subscription models, including tiered subscriptions, can be costly for users who don't fully utilize the service. Our API addresses this issue by leveraging stablecoin technology to enable direct, flexible payments based on actual usage.


## Installation
```bash
npm install dyce
```

## Usage
```js
import Dyce from "dyce"

const dyce = new Dyce(process.env['DYCE_API_KEY']);

const userId = "user_123"
const amount = 10

// Get payment from user wallet (with approval)
const success = dyce.transferTokens(amount);
if (success) console.log("Executed payment!");
else console.error("Failed to execute payment!");

// Approve amount to be taken from user's wallet
const success = dyce.approveSpending(userId, amount);
if (success) console.log("Approved spending!");
else console.error("Failed to approve spending!");

// Get payment from user wallet (without approval)
const success = dyce.requestPayment(userId, amount);
if (success) console.log("Executed payment!");
else console.error("Failed to execute payment!");
```

# Dashboard API Documentation

All requests require an x-api-key header:
```json
{ "x-api-key": string }
```

## Payments Endpoints

### `get-wallet-address`
- **Description**: Retrieves the address for a specified wallet.
- **Method**: `GET`
- **Request Parameters**: `walletId`
- **Response**:

On success:
```json
200 OK
{ "address": string }
```
On failure:
```json
404 Not Found
{ "message": "API key required/not found" }
```
```json
401 Unauthorized
{ "message": "No wallet set for API key" }
```

### `approve-spending`
- **Description**: Approves spending from a specified wallet. Used for pay-as-you-go transactions.
- **Method**: `POST`
- **Request Body**:
  ```json
  { "userId": string, "wallet": string- wallet address, "amount": number }
  ```
- **Response**:

On success:
```json
200 OK
{ "message": "Spending approved" }
```
On failure:
```json
400 Bad Request
{ "message": "User ID, wallet address, and approve amount required" }
```
```json
401 Unauthorized
{ "message": "Invalid API key" }
```

### `request-payment`
- **Description**: Requests a payment to a specified address. Regular transaction endpoint.
- **Method**: `POST`
- **Request Body**:
  ```json
  { "userId": string, "amount": number }
  ```
- **Response**:

On success:
```json
200 OK
{ "message": "Processed payment successfully" }
```
On failure:
```json
400 Bad Request
{ "message": "User ID and payment amount required/No spending approved/Insufficient spending limit" }
```
```json
401 Unauthorized
{ "message": "API key required/Invalid" }
```
```json
404 Not Found
{ "message": "No wallet set for API key" }
```


## Maintainers

This project is maintained by a dedicated team of two students.
