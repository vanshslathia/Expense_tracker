import express from 'express';

const router = express.Router();

// Auth routes will be implemented here
// POST /auth/register
router.post('/register', (req, res) => {
  res.status(200).json({ message: 'Register endpoint' });
});

// POST /auth/login
router.post('/login', (req, res) => {
  res.status(200).json({ message: 'Login endpoint' });
});

export default router;
