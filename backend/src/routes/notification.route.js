import express from 'express';
import { getAllNotification, markAsRead } from '../controller/notifcation.cotroller.js';
import { protect } from '../middlewares/authMiddleware.js';
const router=express.Router();


router.get('/',protect,getAllNotification);

router.patch('/:id/read',protect,markAsRead);

export default router;