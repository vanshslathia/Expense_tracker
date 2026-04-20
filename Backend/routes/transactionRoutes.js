import express from 'express';

const router = express.Router();

// Transaction routes will be implemented here
// GET /transactions
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Get transactions endpoint' });
});

// POST /transactions
router.post('/', (req, res) => {
  res.status(200).json({ message: 'Create transaction endpoint' });
});

export default router;
