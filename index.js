const http = require('http');

// Define the port and hostname
const hostname = '127.0.0.1';
const port = 3000;

// Create the HTTP server
const server = http.createServer((req, res) => {
    res.statusCode = 200; // HTTP status code for OK
    res.setHeader('Content-Type', 'text/plain'); // Content type
    res.end('Hello, World!\n'); // Response message
});

// Start the server and listen on the specified port
server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});