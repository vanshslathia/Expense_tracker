import express from 'express';

const router = express.Router();

// User routes will be implemented here
// GET /users
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Get users endpoint' });
});

// GET /users/:id
router.get('/:id', (req, res) => {
  res.status(200).json({ message: 'Get user by ID endpoint' });
});

export default router;
