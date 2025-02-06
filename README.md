# **Dyce API**

## **Project Overview**
We are building an API that fundamentally changes how users pay for online services by leveraging **USDT stablecoins** for transactions. This API will allow businesses to charge users directly from their **MetaMask** wallets in a seamless and secure way, using **Ethers.js** to handle blockchain interactions. The value of **USDT** is tied to real-world currencies such as USD, making it less volatile compared to traditional cryptocurrencies like Bitcoin or Ethereum.

This API aims to simplify cryptocurrency payments for businesses and users, providing essential features like **subscriptions**, **pay-as-you-go services**, and **transaction tracking**.

--- 

## **Core Features**
The minimum viable product (MVP) will include the following core features:

- **Account Registration:** Users can register and authenticate to use the API using **AWS Cognito**.
- **Transaction Execution:** Enable online payments using USDT through integration with MetaMask and Ethers.js.
- **Transaction History Dashboard:** Businesses can track transaction history for their users, stored in **AWS DynamoDB**.
- **Subscription Management:** Track and manage recurring subscription payments, stored in **AWS DynamoDB**.
- **Pay-as-you-go Payments:** Enable users to pay for services as they use them, directly from their crypto wallets.

---

## **Key Endpoints**
The API will offer several key endpoints, which will be defined in the future once they are created

### **User Management**

### **Transaction Management**

### **Subscription Management**

### **Pay-as-you-go**

---

## **Tech Stack**
- **AWS Lambda** – Serverless functions for running the API.
- **AWS API Gateway** – Exposes the Lambda functions as REST endpoints.
- **AWS Cognito** – User authentication and management.
- **AWS DynamoDB** – Database for transaction and user management.
- **AWS S3** – Storage for handling file uploads (e.g., receipts or invoices).
- **MetaMask** – Browser extension for managing Ethereum-based wallets.
- **Ethers.js** – JavaScript library for interacting with the Ethereum blockchain (for MetaMask transactions).
- **Node.js** – Backend runtime.
- **Express.js** – API framework.

---

## **How to Get Started**

### **1. Clone the Repository**
```bash
git clone https://github.com/your-repo/crypto-payment-api.git
cd crypto-payment-api
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Environment Configuration**
Create a `.env` file with your credentials and configuration:
```env
COINBASE_API_KEY=your-coinbase-api-key
METAMASK_API_KEY=your-metamask-api-key
DATABASE_URL=your-database-url
JWT_SECRET=your-jwt-secret
```
