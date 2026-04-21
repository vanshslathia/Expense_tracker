import express from 'express';
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getUser, changepassword, updateUser } from "../controllers/userController.js";

const router = express.Router();

router.get("/",authMiddleware, getUser);
router.put("/changepassword", authMiddleware, changepassword);
router.put("/updateUser", authMiddleware, updateUser);


export default router;
