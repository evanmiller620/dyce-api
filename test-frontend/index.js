const express = require('express');
const app = express();
const port = 65432;

// Serve static files (e.g., CSS, images, etc.)
app.use(express.static('public'));

// Set up a route for the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});