# DyceAPI JavaScript API Library
This library provides convenient access to the Dyce API from JavaScript.

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