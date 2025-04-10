export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export const badRequestResponse = (message) => ({
    statusCode: 400,
    headers: corsHeaders,
    body: JSON.stringify({ message })
});

export const unauthorizedResponse = (message) => ({
    statusCode: 401,
    headers: corsHeaders,
    body: JSON.stringify({ message })
});

export const notFoundResponse = (message) => ({
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ message })
});

export const successResponse = (body) => ({
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify(body)
});

export const createdResponse = (body) => ({
    statusCode: 201,
    headers: corsHeaders,
    body: JSON.stringify(body)
});

export const errorResponse = (message) => ({
    statusCode: 500,
    headers: corsHeaders,
    body: JSON.stringify({ message })
});