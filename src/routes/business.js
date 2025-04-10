import express from 'express';
const router = express.Router();

// Define post-related routes
router.get('/business', (req, res) => {
    res.send('Get all posts');
});

router.post('/business', (req, res) => {
    res.send('Create a post');
});

export default router;
