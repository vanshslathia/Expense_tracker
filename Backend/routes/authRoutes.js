import express from 'express';
import { signupUser } from '../controllers/authController.js';
import { signinUser } from '../controllers/authController.js';

const router = express.Router();

// Auth routes will be implemented here
// POST /auth/register

router.post('/sign-up', signupUser);
router.post('/sign-in', signinUser);


export default router;
