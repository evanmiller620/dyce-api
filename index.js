import express from "express";
import session from "express-session";
// import MongoStore from "connect-mongo";
import DynamoDBStore from "dynamodb-store";
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import awsServerlessExpress from "aws-serverless-express";
import dotenv from "dotenv";
dotenv.config();

import {business_handler_local} from "./src/middlewear/business.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.AWS_EXECUTION_ENV)
  import("cors").then(({ default: cors }) => { app.use(cors({ origin: 'http://localhost:5173', credentials: true })); });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DATABASE
AWS.config.update({
  region: "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamoStore = new DynamoDBStore({
  table: "DyceTable",
  AWSConfigJSON: {
    region: process.env.AWS_REGION,
  },
});

app.use(
  session({
    secret: process.env.SECRET  || "default-secret", // needs a default for actions
    resave: false,
    saveUninitialized: false,
    store: dynamoStore,
  })
);

// ROUTES
const routesPath = path.join(__dirname, "src/routes");
fs.readdirSync(routesPath).forEach((file) => {
  import(`./src/routes/${file}`).then((route) => {
    app.use("/", route.default);
  }).catch((err) => {
    console.error(`Failed to load route: ${file}`, err);
  });;
});

app.get("/", (req, res) => {
  console.log("Connection established to root");
  res.json({ message: "API root connection" });
});

app.get("/business", business_handler_local);

let server;
let handler;

if (process.env.AWS_EXECUTION_ENV) {
  // Running in AWS Lambda
  const server = awsServerlessExpress.createServer(app);
  handler = (event, context) => {
    awsServerlessExpress.proxy(server, event, context);
  };
} else {
  // Running locally
  server = app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
  });
}

// AWS Lambda handler
export { handler };
// Local server
export {app, server};
