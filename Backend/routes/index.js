import express from 'express';
//importing all the routes 
import authRoutes from './authRoutes.js';
import accountRoutes from './accountRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import userRoutes from './userRoutes.js';
//-------------------------------------
const router = express.Router();

// Define your routes here
router.use('/auth', authRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/users', userRoutes);

export default router;