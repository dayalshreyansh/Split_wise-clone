import express from 'express';
import { scanReceipt, uploadMiddleware } from '../controller/receipt.controller.js';

const router = express.Router();

// The uploadMiddleware intercepts the image before it hits the controller
router.post('/scan', uploadMiddleware, scanReceipt);

export default router;