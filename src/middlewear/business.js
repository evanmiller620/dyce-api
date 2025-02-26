import express from 'express';
const router = express.Router();

const business = async (event, context) => {
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Get all posts" }),
    };
}

// Lambda
export const handler = business;
// local testing
export const business_handler_local = async (req, res) => {
    const response = await business({ body: JSON.stringify(req.body) });
    res.status(response.statusCode).json(JSON.parse(response.body));
};
