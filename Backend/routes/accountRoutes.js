import express from 'express';

const router = express.Router();

// Account routes will be implemented here
// GET /accounts
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Get accounts endpoint' });
});

// POST /accounts
router.post('/', (req, res) => {
  res.status(200).json({ message: 'Create account endpoint' });
});

export default router;
