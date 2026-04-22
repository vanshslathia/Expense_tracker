import express from 'express';
const router = express.Router();
import { addMoneyToAccount, createAccount,getAccounts ,deleteAccount} from '../controllers/accountController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
// Account routes will be implemented here
// GET /accounts
// router.get('/',authMiddleware,getAccount);
router.get('/:id',authMiddleware,getAccounts);

// POST /accounts
router.post('/create',authMiddleware, createAccount);

router.put("/add-money/:id",authMiddleware, addMoneyToAccount);

router.delete('/:id', authMiddleware, deleteAccount);

export default router;
