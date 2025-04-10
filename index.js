import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import awsServerlessExpress from "aws-serverless-express";
import bodyParser from "body-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

const routesPath = path.join(__dirname, "src/routes");
fs.readdirSync(routesPath).forEach((file) => {
  import(`./src/routes/${file}`).then((route) => {
    app.use("/", route.default);
  });
});

app.get("/", (req, res) => {
  console.log("Connection established to root");
  res.json({ message: "API root connection" });
});

let server;

if (process.env.AWS_EXECUTION_ENV) {
  // Running in AWS Lambda
  const server = awsServerlessExpress.createServer(app);
  exports.handler = (event, context) => {
    awsServerlessExpress.proxy(server, event, context);
  };
} else {
  // Running locally
  server = app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
  });
}

export {app, server};
