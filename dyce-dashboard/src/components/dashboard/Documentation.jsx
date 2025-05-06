import React from 'react';
import '@/assets/styles/Dashboard.css'

const endpoints = [
  {
    name: 'get-wallet-address',
    method: 'GET',
    path: '/get-wallet-address',
    description: 'Retrieves the address for a specified wallet.',
    requestBody: null,
    responses: [
      { code: 200, body: `{ "address": "string" }` },
      { code: 404, body: `{ "message": "API key required/not found" }` },
      { code: 401, body: `{ "message": "No wallet set for API key" }` }
    ]
  },
  {
    name: 'approve-spending',
    method: 'POST',
    path: '/approve-spending',
    description: 'Approves spending from a specified wallet for pay-as-you-go transactions.',
    requestBody: `{ "userId": "string", "wallet": "string", "amount": number }`,
    responses: [
      { code: 200, body: `{ "message": "Spending approved" }` },
      { code: 400, body: `{ "message": "User ID, wallet address, and approve amount required" }` },
      { code: 401, body: `{ "message": "Invalid API key" }` }
    ]
  },
  {
    name: 'request-payment',
    method: 'POST',
    path: '/request-payment',
    description: 'Requests a one-time payment from a user (non-preapproved).',
    requestBody: `{ "userId": "string", "amount": number }`,
    responses: [
      { code: 200, body: `{ "message": "Processed payment successfully" }` },
      { code: 400, body: `{ "message": "User ID and payment amount required/No spending approved/Insufficient spending limit" }` },
      { code: 401, body: `{ "message": "API key required/Invalid" }` },
      { code: 404, body: `{ "message": "No wallet set for API key" }` }
    ]
  },
  {
    name: 'permit-spending',
    method: 'POST',
    path: '/permit-spending',
    description: 'Submits a signed EIP-2612 permit for a user, allowing spending without requiring a MetaMask popup.',
    requestBody: `{ "userId": "string", "permit": { ... }, "contractAddress": "string" }`,
    responses: [
      { code: 200, body: `{ "message": "Permit submitted successfully" }` },
      { code: 400, body: `{ "message": "User ID, permit, and contract address required" }` },
      { code: 401, body: `{ "message": "API key required/Invalid" }` },
      { code: 404, body: `{ "message": "No wallet set for API key" }` }
    ]
  },
  {
    name: 'receive-payment',
    method: 'POST',
    path: '/receive-payment',
    description: 'Submits a permit to collect payment from a user’s wallet. This completes a pay-as-you-go transaction.',
    requestBody: `{ "permit": { ... }, "contractAddress": "string" }`,
    responses: [
      { code: 200, body: `{ "message": "Payment received successfully" }` },
      { code: 400, body: `{ "message": "Permit and contract address required" }` },
      { code: 401, body: `{ "message": "API key required/Invalid" }` },
      { code: 404, body: `{ "message": "No wallet set for API key" }` }
    ]
  }
];

const Documentation = () => {
  return (
    <div className="dashboard-wrapper">
      <div className="header-container">
        <h1>Dyce API Documentation</h1>
      </div>

      <div className="body-container"  style={{ margin: 10 }}>
       

        <section id="endpoints">
          <h2 className="title">Endpoints</h2>

          {endpoints.map((ep, idx) => (
            <div className="endpoint-block" key={idx}>
              <h3><code>{ep.method} {ep.path}</code></h3>
              <p>{ep.description}</p>
              {ep.requestBody && (
                <p><strong>Body:</strong> <code>{ep.requestBody}</code></p>
              )}
              {ep.responses && (
                <>
                  <p><strong>Responses:</strong></p>
                  <ul>
                    {ep.responses.map((res, i) => (
                      <li key={i}>
                        <code>{res.code}</code>: <code>{res.body}</code>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))}
        </section>

        <section id="auth" style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 className="title">Authentication</h2>
          <p>
            <strong>All endpoints require authentication via an API key.</strong><br />
            Include your key in the <code>x-api-key</code> request header for secure access.
          </p>
        </section>

        <section id="usage">
          <h2 className="title">Usage Example</h2>
          <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#eee', padding: '10px', borderRadius: '5px' }}>
            <code>{
`const contractAddress = "0xContract";
const permit = {
  // Example EIP-2612 permit structure
  owner: wallet,
  spender: contractAddress,
  value: amount,
  deadline: Date.now() + 3600000,
  v: 28,
  r: "0x...",
  s: "0x..."
};

// 1. Get the business wallet address
const walletAddress = await dyce.getWalletAddress();
console.log("Business wallet:", walletAddress);

// 2. Approve amount to be spent later (backend state)
const approved = await dyce.approveSpending(userId, wallet, amount);
if (approved) console.log("Approved spending");
else console.error("Failed to approve");

// 3. Submit signed permit for future spending
const permitResult = await dyce.permitSpending(userId, permit, contractAddress);
if (permitResult) console.log("Permit submitted");
else console.error("Permit failed");

// 4. Request payment from user (regular charge)
const paymentResult = await dyce.requestPayment(userId, amount);
if (paymentResult) console.log("Requested payment");
else console.error("Payment request failed");

// 5. Receive payment using submitted permit
const receiveResult = await dyce.receivePayment(permit, contractAddress);
if (receiveResult) console.log("Payment received");
else console.error("Payment receive failed");`
            }</code>
          </pre>
        </section>
      </div>
    </div>
  );
};

export default Documentation;
