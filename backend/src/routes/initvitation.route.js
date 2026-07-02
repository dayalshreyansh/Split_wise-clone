// routes/invitation.route.js
import express from 'express';
import { inviteMember, acceptInvite, getPendingRequest, getGroupPendingInvites } from '../controller/invitation.controller.js';
import { protect } from '../middlewares/authMiddleware.js';


const router = express.Router();

router.post('/:groupId/send', protect, inviteMember);
router.get('/pending', protect, getPendingRequest);
router.post('/accept/:token', protect, acceptInvite);
router.get("/group/:groupId/pending", protect, getGroupPendingInvites);
export default router;