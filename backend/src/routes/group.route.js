import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { addMemberSchema, createGroupSchema } from '../validator/groupValidator.js';
import { addMemberToGroup, createGroup, getGroupBalances, getSingleGroup, getUserGroups, sendSettlementRequest } from '../controller/group.controller.js';
import expenseRoutes from './expense.route.js';
const router = express.Router();

// Existing routes
router.post('/', protect, validateRequest(createGroupSchema), createGroup);
router.get('/', protect, getUserGroups);

// NEW ROUTE: Notice the /:groupId dynamic parameter in the URL
router.post('/:groupId/members', protect, validateRequest(addMemberSchema), addMemberToGroup);

// This becomes GET /api/groups/:groupId
router.get('/:groupId', protect, getSingleGroup);

// This becomes GET /api/groups/:groupId/balances
router.get('/:groupId/balances', protect, getGroupBalances);

// New routes for your new features

router.post('/:groupId/settlement-request', protect, sendSettlementRequest); 

router.use('/:groupId/expenses', expenseRoutes);
export default router;