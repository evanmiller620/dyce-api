# **Dyce API**

## **Project Overview**
We are building an API that fundamentally changes how users pay for online services by leveraging **USDT stablecoins** for transactions. This API will allow businesses to charge users directly from their **MetaMask** wallets in a seamless and secure way, using **Ethers.js** to handle blockchain interactions. The value of **USDT** is tied to real-world currencies such as USD, making it less volatile compared to traditional cryptocurrencies like Bitcoin or Ethereum.

This API aims to simplify cryptocurrency payments for businesses and users, providing essential features like **subscriptions**, **pay-as-you-go services**, and **transaction tracking**.

---

## **Why Use Dyce**
Dyce API solves a challenge in the adoption of cryptocurrency for real-world applications: making payments simple, stable, and developer-accessible. While many crypto payment systems are complex or volatile, Dyce uses USDT stablecoins to provide price stability and easy accounting. By integrating directly with popular wallets like MetaMask and using serverless architecture on AWS, Dyce eliminates infrastructure overhead for businesses while enabling customer transactions. Whether you're building a SaaS platform, an on-demand service, or a decentralized application, Dyce provides the tools to accept crypto payments with ease.

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
The API will offer three key endpoints for use for handling user transactions. These are defined in more depth in the [API documentation](dyce/README.md)

### **User Management**
The dyce dashboard will provide a full suite of tools that can be used for viewing transaction history and performance as well as connecting new business wallets and managing existing wallets and keys.

---

## Tech Stack

| Layer             | Tool/Service                | Purpose                          |
|------------------|-----------------------------|----------------------------------|
| Authentication   | AWS Cognito                 | User identity and session mgmt   |
| Backend Logic     | AWS Lambda + Node.js        | Serverless function execution    |
| API Gateway      | AWS API Gateway             | REST API endpoint management     |
| Data Storage     | AWS DynamoDB                | Serverless NoSQL database        |
| Wallet Handling  | MetaMask + Ethers.js        | Blockchain wallet integration    |
| Framework        | Express.js                  | Web framework for routing logic  |

---

## **How to Get Started**

### **1. Clone the Repository**
```bash
git clone https://github.com/your-username/dyce-api.git
cd dyce-api
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Environment Configuration**
Create a `.env` file with your credentials and configuration:
```env
AWS_REGION=your-region
PORT=your-dev-port
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
COGNITO_USER_POOL_ID=your-cognito-user-pool-id
COGNITO_CLIENT_ID=your-client-id
ETHERSCAN_KEY=your-etherscan-key
```
### **4. Start the Server**
```bash
npm start
```

---

## Contributing

We welcome contributions!

- Fork the repo
- Create a feature branch (`git checkout -b feature/my-feature`)
- Commit your changes (`git commit -m 'Add feature'`)
- Push to the branch (`git push origin feature/my-feature`)
- Open a Pull Request and we shall review it and go from there

---

## License

This project is licensed under the [MIT License](LICENSE). 