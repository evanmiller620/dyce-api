import express from 'express';
const router = express.Router();

// Define user-related routes
router.get('/user', (req, res) => {
    res.send('Get all users');
});

router.post('/user', (req, res) => {
    res.send('Create a user');
});

export default router;
