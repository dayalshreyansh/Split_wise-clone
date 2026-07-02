import express from 'express';
import { addExpense, confirmSettlement, getGroupExpenses, settleUp } from '../controller/expense.controller.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { createExpenseSchema, settleUpSchema } from '../validator/expenseValidator.js';

// We use mergeParams so this router can access the :groupId from the parent router
const router = express.Router({ mergeParams: true });

// This route will actually be: POST /api/groups/:groupId/expenses
router.post('/', protect, validateRequest(createExpenseSchema), addExpense);

router.get('/', protect, getGroupExpenses);

export default router;