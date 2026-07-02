import express from 'express';
import { register, login, getMe } from '../controller/auth.controller.js';
import { loginSchema, registerSchema } from '../validator/authValidator.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);

router.get('/me', protect, getMe);

export default router;